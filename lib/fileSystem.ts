import { Paths, Directory, File } from 'expo-file-system';
import { parseCubeLUT, ParsedLUT } from './lutParser';

const LUTS_DIRECTORY = new Directory(Paths.document, 'LUTs');
const LUT_IMAGES_DIRECTORY = new Directory(Paths.document, 'LUT_Images');
const PHOTOS_DIRECTORY = new Directory(Paths.document, 'Photos');
const THUMBNAILS_DIRECTORY = new Directory(Paths.document, 'Thumbnails');

export async function initFileSystem(): Promise<void> {
  try {
    if (!LUTS_DIRECTORY.exists) {
      LUTS_DIRECTORY.create();
      console.log('LUTs directory created');
    }
    if (!LUT_IMAGES_DIRECTORY.exists) {
      LUT_IMAGES_DIRECTORY.create();
      console.log('LUT Images directory created');
    }
    if (!PHOTOS_DIRECTORY.exists) {
      PHOTOS_DIRECTORY.create();
      console.log('Photos directory created');
    }
    if (!THUMBNAILS_DIRECTORY.exists) {
      THUMBNAILS_DIRECTORY.create();
      console.log('Thumbnails directory created');
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

export async function saveLUTImage(imageData: Uint8Array, lutId: number): Promise<string> {
  try {
    const fileName = `lut_${lutId}.bin`;
    const targetFile = new File(LUT_IMAGES_DIRECTORY, fileName);
    
    // Save the raw image data
    await targetFile.write(imageData);
    
    console.log('LUT image saved:', targetFile.uri);
    return targetFile.uri;
  } catch (error) {
    console.error('Error saving LUT image:', error);
    throw error;
  }
}

export async function loadLUTImage(imagePath: string): Promise<Uint8Array> {
  try {
    const file = new File(imagePath);
    const data = await file.bytes();
    return data;
  } catch (error) {
    console.error('Error loading LUT image:', error);
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

// Image conversion - Convert all images to PNG for consistent processing
export async function convertImageIfNeeded(uri: string): Promise<string> {
  try {
    // Check if the image is already a PNG
    const isPNG = uri.toLowerCase().match(/\.png$/i);
    
    if (isPNG) {
      console.log('Image is already PNG, skipping conversion');
      return uri;
    }
    
    // Convert all non-PNG images (HEIF, HEIC, JPEG, etc.) to PNG
    // This ensures consistent behavior and avoids Skia compatibility issues
    console.log('Converting image to PNG...');
    
    // Lazy import to avoid loading at module initialization
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    
    // Convert to PNG with maximum quality
    const result = await manipulateAsync(
      uri,
      [], // No transformations, just format conversion
      {
        compress: 1, // Maximum quality
        format: SaveFormat.PNG,
      }
    );
    
    console.log('Image converted to PNG:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('Error converting image:', error);
    throw error;
  }
}

// Photo and thumbnail management
export async function savePhotoToLibrary(sourceUri: string, editedPhotoId: number): Promise<string> {
  try {
    const fileName = `photo_${editedPhotoId}.jpg`;
    const targetFile = new File(PHOTOS_DIRECTORY, fileName);
    
    // Copy the photo to permanent storage
    const sourceFile = new File(sourceUri);
    await sourceFile.copy(targetFile);
    
    console.log('Photo saved to library:', targetFile.uri);
    return targetFile.uri;
  } catch (error) {
    console.error('Error saving photo to library:', error);
    throw error;
  }
}

export async function saveThumbnail(photoUri: string, editedPhotoId: number): Promise<string> {
  try {
    // For now, copy the full image as thumbnail
    // TODO: Install expo-image-manipulator for proper thumbnail generation
    const fileName = `thumb_${editedPhotoId}.jpg`;
    const targetFile = new File(THUMBNAILS_DIRECTORY, fileName);
    const sourceFile = new File(photoUri);
    await sourceFile.copy(targetFile);
    
    console.log('Thumbnail saved:', targetFile.uri);
    return targetFile.uri;
  } catch (error) {
    console.error('Error saving thumbnail:', error);
    throw error;
  }
}

export async function deleteThumbnail(thumbnailUri: string): Promise<void> {
  try {
    const file = new File(thumbnailUri);
    if (file.exists) {
      file.delete();
      console.log('Thumbnail deleted:', thumbnailUri);
    }
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
  }
}

export async function deletePhotoFromLibrary(photoUri: string): Promise<void> {
  try {
    const file = new File(photoUri);
    if (file.exists) {
      file.delete();
      console.log('Photo deleted from library:', photoUri);
    }
  } catch (error) {
    console.error('Error deleting photo from library:', error);
  }
}

