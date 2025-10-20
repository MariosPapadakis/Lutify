# Skia LUT Implementation

This document describes the new Skia-based LUT rendering implementation that replaces the previous expo-gl (WebGL) approach.

## Overview

The implementation uses `@shopify/react-native-skia` with runtime effects (custom shaders) to apply LUT color grading and additional color adjustments. This approach is based on the discussion at:
https://github.com/Shopify/react-native-skia/discussions/1436

## Key Components

### 1. `lib/skiaRenderer.ts`

Contains the core rendering logic:

- **`createLUTShader()`**: Creates a Skia RuntimeEffect with a custom shader that:
  - Applies 3D LUT color grading with adjustable strength
  - Supports trilinear interpolation for smooth color transitions
  - Applies additional color adjustments (exposure, contrast, saturation, temperature, tint)
  - Uses an 8x8 grid layout (512x512 pixels) for 64 color slices

- **`convertCubeLUTToImageData()`**: Converts .cube LUT files to image data:
  - Transforms 3D LUT data into a 512x512 RGBA image
  - Uses an 8x8 grid layout where each tile represents a blue slice
  - Supports trilinear interpolation for non-64 sized LUTs (e.g., 33x33x33)
  - Output can be directly used as a Skia Image shader

### 2. `app/editor.tsx`

Updated editor screen using Skia Canvas:

- Replaced `GLView` with `Canvas` component from Skia
- Uses `useImage` hook to load images
- Creates shader with uniforms for dynamic parameter updates
- Implements `makeImageFromView` for exporting edited photos

## Implementation Details

### LUT Grid Layout

The LUT is organized in an 8x8 grid (512x512 pixels total):
- Each tile is 64x64 pixels
- Tiles are arranged left-to-right, top-to-bottom
- Each tile represents one blue slice of the 3D LUT
- Within each tile, X = red channel, Y = green channel

```
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ B=0 │ B=1 │ B=2 │ B=3 │ B=4 │ B=5 │ B=6 │ B=7 │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ B=8 │ B=9 │B=10 │B=11 │B=12 │B=13 │B=14 │B=15 │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │ ... │     │     │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### Shader Algorithm

1. **Sample original color** from the input image
2. **LUT Application** (if strength > 0):
   - Scale RGB values to LUT size (0-63)
   - Determine blue slice index and fractional part
   - Calculate UV coordinates for current and next slice
   - Sample both slices and interpolate between them
   - Blend with original color based on strength parameter
3. **Color Adjustments**:
   - Exposure: Multiply by 2^exposure
   - Contrast: Scale around midpoint
   - Saturation: Mix between grayscale and color
   - Temperature: Shift red/blue balance
   - Tint: Shift green/magenta balance
4. **Output** final clamped color

## Advantages over WebGL

1. **Better Performance**: Skia is optimized for mobile and uses native rendering
2. **Simpler API**: No manual WebGL context management
3. **Better Integration**: Direct React Native component integration
4. **Smaller Bundle**: No need for expo-gl overhead
5. **More Reliable**: Fewer cross-platform rendering issues

## Setup & Installation

1. Install dependencies:
   ```bash
   npm install @shopify/react-native-skia --legacy-peer-deps
   ```

2. For iOS, install pods:
   ```bash
   cd ios && pod install
   ```

3. For Android, rebuild:
   ```bash
   npm run android
   ```

## Testing

To test the implementation:

1. Import a photo in the editor
2. Select a LUT file
3. Adjust the sliders to see real-time changes
4. Export the edited photo

## Migration Notes

### What Changed

- **Removed**: `expo-gl`, `GLView`, `GLRenderer` class
- **Added**: `@shopify/react-native-skia`, Skia-based rendering
- **Files Modified**:
  - `app/editor.tsx`: Complete rewrite using Skia Canvas
  - `lib/skiaRenderer.ts`: New file with Skia-specific rendering logic

### Old vs New

| Old (expo-gl) | New (Skia) |
|---------------|------------|
| `GLView` | `Canvas` |
| WebGL shaders | RuntimeEffect shaders |
| Manual texture management | `useImage` hook |
| `gl.endFrameEXP()` | Automatic rendering |
| Complex setup | Declarative components |

## Troubleshooting

### Issue: Shader not applying

- Verify LUT image was created successfully
- Check console for RuntimeEffect compilation errors
- Ensure uniforms are passed correctly

### Issue: Performance problems

- Reduce image resolution
- Optimize shader calculations
- Use memoization for heavy computations

### Issue: Colors look wrong

- Verify LUT grid layout (8x8, 512x512)
- Check trilinear interpolation implementation
- Ensure proper color space handling

## References

- [Skia GitHub Discussion on LUTs](https://github.com/Shopify/react-native-skia/discussions/1436)
- [react-native-skia Documentation](https://shopify.github.io/react-native-skia/)
- [Skia RuntimeEffect Documentation](https://api.skia.org/classSkRuntimeEffect.html)

