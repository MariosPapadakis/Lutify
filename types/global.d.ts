// Global type definitions for LUTify

// Extend expo-gl types if needed
declare module 'expo-gl' {
  export interface GLView {
    takeSnapshotAsync(options?: {
      format?: 'png' | 'jpg';
      quality?: number;
      compress?: number;
    }): Promise<{ uri: string; localUri: string; width: number; height: number }>;
  }
}

export {};

