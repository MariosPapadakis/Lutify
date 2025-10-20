import { Paths, Directory, File } from 'expo-file-system';
import { parseCubeLUT, ParsedLUT } from './lutParser';

const LUTS_DIRECTORY = new Directory(Paths.document, 'LUTs');

export async function initFileSystem(): Promise<void> {
  try {
    if (!LUTS_DIRECTORY.exists) {
      LUTS_DIRECTORY.create();
      console.log('LUTs directory created');
    }
  } catch (error) {
    console.error('Error initializing file system:', error);
    throw error;
  }
}

export async function saveLUTFile(sourceUri: string, fileName: string): Promise<string> {
  try {
    // Ensure the file has .cube extension
    if (!fileName.toLowerCase().endsWith('.cube')) {
      fileName += '.cube';
    }
    
    // Generate unique filename if needed
    let targetFile = new File(LUTS_DIRECTORY, fileName);
    let counter = 1;
    
    while (targetFile.exists) {
      const nameWithoutExt = fileName.replace('.cube', '');
      targetFile = new File(LUTS_DIRECTORY, `${nameWithoutExt}_${counter}.cube`);
      counter++;
    }
    
    // Copy file to app directory
    const sourceFile = new File(sourceUri);
    await sourceFile.copy(targetFile);
    
    console.log('LUT file saved to:', targetFile.uri);
    return targetFile.uri;
  } catch (error) {
    console.error('Error saving LUT file:', error);
    throw error;
  }
}

export async function loadLUTData(path: string): Promise<ParsedLUT> {
  try {
    const file = new File(path);
    const content = await file.text();
    const parsedLUT = parseCubeLUT(content);
    return parsedLUT;
  } catch (error) {
    console.error('Error loading LUT data:', error);
    throw error;
  }
}

export async function deleteLUTFile(path: string): Promise<void> {
  try {
    const file = new File(path);
    
    if (file.exists) {
      file.delete();
      console.log('LUT file deleted:', path);
    }
  } catch (error) {
    console.error('Error deleting LUT file:', error);
    throw error;
  }
}

export async function getLUTsDirectory(): Promise<string> {
  return LUTS_DIRECTORY.uri;
}

export async function cleanupOrphanedFiles(validPaths: string[]): Promise<void> {
  try {
    if (!LUTS_DIRECTORY.exists) {
      return;
    }
    
    const dirContents = LUTS_DIRECTORY.list();
    
    for (const item of dirContents) {
      if (item instanceof File && !validPaths.includes(item.uri)) {
        item.delete();
        console.log('Orphaned file removed:', item.uri);
      }
    }
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
  }
}

