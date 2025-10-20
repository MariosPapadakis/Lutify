import { Skia } from '@shopify/react-native-skia';

export interface RenderParams {
  strength: number; // 0-1
  exposure: number; // -2 to 2
  contrast: number; // -1 to 1
  saturation: number; // -1 to 1
  temperature: number; // -1 to 1
  tint: number; // -1 to 1
}

/**
 * Creates a Skia RuntimeEffect for applying LUT and color adjustments
 * Based on: https://github.com/Shopify/react-native-skia/discussions/1436
 */
export function createLUTShader() {
  const source = `
    uniform shader image;
    uniform shader lutImage;
    uniform float imageWidth;
    uniform float imageHeight;
    uniform float lutWidth;
    uniform float lutHeight;
    uniform float strength;
    uniform float exposure;
    uniform float contrast;
    uniform float saturation;
    uniform float temperature;
    uniform float tint;

    vec3 adjustExposure(vec3 color, float exp) {
      return color * pow(2.0, exp);
    }

    vec3 adjustContrast(vec3 color, float cont) {
      return (color - 0.5) * (1.0 + cont) + 0.5;
    }

    vec3 adjustSaturation(vec3 color, float sat) {
      float gray = dot(color, vec3(0.299, 0.587, 0.114));
      return mix(vec3(gray), color, 1.0 + sat);
    }

    vec3 adjustTemperature(vec3 color, float temp) {
      if (temp > 0.0) {
        color.r += temp * 0.1;
        color.b -= temp * 0.05;
      } else {
        color.b -= temp * 0.1;
        color.r += temp * 0.05;
      }
      return color;
    }

    vec3 adjustTint(vec3 color, float tintVal) {
      if (tintVal > 0.0) {
        color.g += tintVal * 0.1;
      } else {
        color.r -= tintVal * 0.1;
        color.b -= tintVal * 0.1;
      }
      return color;
    }

    vec4 main(vec2 pos) {
      // Sample original color
      vec4 originalColor = image.eval(pos);
      vec3 c = clamp(originalColor.rgb, 0.0, 1.0);

      // Apply LUT with strength
      if (strength > 0.0) {
        float lutSize = 64.0;  // Number of color slices
        float gridDim = 8.0;   // 8x8 grid of LUT tiles

        // Convert RGB to LUT coordinates (scale 0-1 to 0-63)
        vec3 scaled = c * (lutSize - 1.0);

        // Blue channel determines which slice (tile) in the grid
        float sliceIndex = floor(scaled.b);
        float sliceFrac = fract(scaled.b);

        // Calculate tile position in the 8x8 grid
        float tileX = mod(sliceIndex, gridDim);
        float tileY = floor(sliceIndex / gridDim);

        // Calculate UV within a single tile (each tile is 64x64 pixels)
        vec2 uvWithinTile = (vec2(scaled.r, scaled.g) + 0.5) / lutSize;

        // Final UV for the current slice (scale to 0-1 range)
        vec2 uv1 = (vec2(tileX, tileY) + uvWithinTile) / gridDim;

        // UV for the next slice (for interpolation between slices)
        float nextSliceIndex = min(sliceIndex + 1.0, lutSize - 1.0);
        float tileX2 = mod(nextSliceIndex, gridDim);
        float tileY2 = floor(nextSliceIndex / gridDim);
        vec2 uv2 = (vec2(tileX2, tileY2) + uvWithinTile) / gridDim;

        // Sample LUT at pixel coordinates
        vec4 lutColor1 = lutImage.eval(uv1 * vec2(lutWidth, lutHeight));
        vec4 lutColor2 = lutImage.eval(uv2 * vec2(lutWidth, lutHeight));
        
        // Interpolate between two slices based on blue channel fraction
        vec4 finalLUTColor = mix(lutColor1, lutColor2, sliceFrac);

        // Blend between original color and LUT-applied color based on strength
        c = mix(c, finalLUTColor.rgb, strength);
      }

      // Apply color adjustments
      if (exposure != 0.0) {
        c = adjustExposure(c, exposure);
      }
      if (contrast != 0.0) {
        c = adjustContrast(c, contrast);
      }
      if (saturation != 0.0) {
        c = adjustSaturation(c, saturation);
      }
      if (temperature != 0.0) {
        c = adjustTemperature(c, temperature);
      }
      if (tint != 0.0) {
        c = adjustTint(c, tint);
      }

      // Clamp final color
      c = clamp(c, 0.0, 1.0);

      return vec4(c, originalColor.a);
    }
  `;

  return Skia.RuntimeEffect.Make(source);
}

/**
 * Converts a .cube LUT data to a PNG-style image data array
 * Uses an 8x8 grid layout for 64 color slices (512x512 pixels)
 * Based on the approach from the GitHub discussion
 */
export function convertCubeLUTToImageData(lutData: Float32Array, size: number): {
  data: Uint8Array;
  width: number;
  height: number;
} {
  // For 64-slice LUT, use 8x8 grid (512x512 pixels)
  const gridDim = 8;
  const lutSize = 64;
  const width = gridDim * lutSize;  // 512
  const height = gridDim * lutSize; // 512
  
  const imageData = new Uint8Array(width * height * 4);
  
  console.log(`Converting LUT to image: ${width}x${height} (${gridDim}x${gridDim} grid) for size ${size}`);
  
  // Initialize to transparent
  imageData.fill(0);
  
  // Map the cube data to the image grid
  // CUBE format is R (outer), G (middle), B (inner) loop
  // We need to interpolate if the source size doesn't match 64
  
  if (size === lutSize) {
    // Direct mapping for 64x64x64 LUT
    for (let b = 0; b < lutSize; b++) {
      const tileX = b % gridDim;
      const tileY = Math.floor(b / gridDim);
      const tileStartX = tileX * lutSize;
      const tileStartY = tileY * lutSize;
      
      for (let g = 0; g < lutSize; g++) {
        for (let r = 0; r < lutSize; r++) {
          const srcIndex = ((b * lutSize + g) * lutSize + r) * 3;
          const x = tileStartX + r;
          const y = tileStartY + g;
          const dstIndex = (y * width + x) * 4;
          
          imageData[dstIndex + 0] = Math.floor(lutData[srcIndex + 0] * 255);
          imageData[dstIndex + 1] = Math.floor(lutData[srcIndex + 1] * 255);
          imageData[dstIndex + 2] = Math.floor(lutData[srcIndex + 2] * 255);
          imageData[dstIndex + 3] = 255;
        }
      }
    }
  } else {
    // Interpolate for different sizes (e.g., 33x33x33)
    for (let b = 0; b < lutSize; b++) {
      const tileX = b % gridDim;
      const tileY = Math.floor(b / gridDim);
      const tileStartX = tileX * lutSize;
      const tileStartY = tileY * lutSize;
      
      for (let g = 0; g < lutSize; g++) {
        for (let r = 0; r < lutSize; r++) {
          // Map from 64 space to original LUT space
          const srcR = (r / (lutSize - 1)) * (size - 1);
          const srcG = (g / (lutSize - 1)) * (size - 1);
          const srcB = (b / (lutSize - 1)) * (size - 1);
          
          // Trilinear interpolation
          const r0 = Math.floor(srcR);
          const r1 = Math.min(r0 + 1, size - 1);
          const g0 = Math.floor(srcG);
          const g1 = Math.min(g0 + 1, size - 1);
          const b0 = Math.floor(srcB);
          const b1 = Math.min(b0 + 1, size - 1);
          
          const rFrac = srcR - r0;
          const gFrac = srcG - g0;
          const bFrac = srcB - b0;
          
          // Sample 8 corners of the cube
          const c000 = getColor(lutData, r0, g0, b0, size);
          const c001 = getColor(lutData, r0, g0, b1, size);
          const c010 = getColor(lutData, r0, g1, b0, size);
          const c011 = getColor(lutData, r0, g1, b1, size);
          const c100 = getColor(lutData, r1, g0, b0, size);
          const c101 = getColor(lutData, r1, g0, b1, size);
          const c110 = getColor(lutData, r1, g1, b0, size);
          const c111 = getColor(lutData, r1, g1, b1, size);
          
          // Interpolate
          const c00 = lerp3(c000, c001, bFrac);
          const c01 = lerp3(c010, c011, bFrac);
          const c10 = lerp3(c100, c101, bFrac);
          const c11 = lerp3(c110, c111, bFrac);
          
          const c0 = lerp3(c00, c01, gFrac);
          const c1 = lerp3(c10, c11, gFrac);
          
          const finalColor = lerp3(c0, c1, rFrac);
          
          const x = tileStartX + r;
          const y = tileStartY + g;
          const dstIndex = (y * width + x) * 4;
          
          imageData[dstIndex + 0] = Math.floor(finalColor[0] * 255);
          imageData[dstIndex + 1] = Math.floor(finalColor[1] * 255);
          imageData[dstIndex + 2] = Math.floor(finalColor[2] * 255);
          imageData[dstIndex + 3] = 255;
        }
      }
    }
  }
  
  return { data: imageData, width, height };
}

function getColor(lutData: Float32Array, r: number, g: number, b: number, size: number): [number, number, number] {
  const index = ((b * size + g) * size + r) * 3;
  return [
    lutData[index + 0],
    lutData[index + 1],
    lutData[index + 2],
  ];
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

