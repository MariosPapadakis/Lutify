export interface ParsedLUT {
  size: number;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  data: Float32Array;
  title?: string;
}

export function parseCubeLUT(content: string): ParsedLUT {
  const lines = content.split('\n').map(line => line.trim());
  
  let size = 0;
  let domainMin: [number, number, number] = [0, 0, 0];
  let domainMax: [number, number, number] = [1, 1, 1];
  let title: string | undefined;
  const dataLines: string[] = [];
  
  for (const line of lines) {
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    // Parse title
    if (line.startsWith('TITLE')) {
      title = line.substring(5).trim().replace(/"/g, '');
      continue;
    }
    
    // Parse LUT size
    if (line.startsWith('LUT_3D_SIZE')) {
      size = parseInt(line.split(/\s+/)[1], 10);
      continue;
    }
    
    // Parse domain min
    if (line.startsWith('DOMAIN_MIN')) {
      const values = line.split(/\s+/).slice(1).map(v => parseFloat(v));
      if (values.length === 3) {
        domainMin = [values[0], values[1], values[2]];
      }
      continue;
    }
    
    // Parse domain max
    if (line.startsWith('DOMAIN_MAX')) {
      const values = line.split(/\s+/).slice(1).map(v => parseFloat(v));
      if (values.length === 3) {
        domainMax = [values[0], values[1], values[2]];
      }
      continue;
    }
    
    // If it looks like RGB data (3 numbers), add it
    const parts = line.split(/\s+/);
    if (parts.length === 3 && !isNaN(parseFloat(parts[0]))) {
      dataLines.push(line);
    }
  }
  
  if (size === 0) {
    throw new Error('Invalid LUT file: LUT_3D_SIZE not found');
  }
  
  // Validate size (common sizes: 17, 33, 64)
  if (![17, 33, 64].includes(size)) {
    console.warn(`Unusual LUT size: ${size}. Supported sizes are 17, 33, 64`);
  }
  
  const expectedDataPoints = size * size * size;
  if (dataLines.length !== expectedDataPoints) {
    throw new Error(
      `Invalid LUT file: Expected ${expectedDataPoints} data points, got ${dataLines.length}`
    );
  }
  
  // Parse RGB data into Float32Array
  const data = new Float32Array(expectedDataPoints * 3);
  let dataIndex = 0;
  
  for (const line of dataLines) {
    const [r, g, b] = line.split(/\s+/).map(v => parseFloat(v));
    data[dataIndex++] = r;
    data[dataIndex++] = g;
    data[dataIndex++] = b;
  }
  
  return {
    size,
    domainMin,
    domainMax,
    data,
    title,
  };
}

export function validateLUTData(lut: ParsedLUT): boolean {
  if (lut.size <= 0 || lut.data.length !== lut.size * lut.size * lut.size * 3) {
    return false;
  }
  
  // Check if domain values are valid
  for (let i = 0; i < 3; i++) {
    if (lut.domainMin[i] >= lut.domainMax[i]) {
      return false;
    }
  }
  
  return true;
}


