# JPEG Export Crash Fix

## Problem

The app was crashing when exporting images that were originally imported as JPEG files. This issue occurred during the export process in the editor screen.

## Root Cause

The issue was caused by inconsistent image format handling:

1. **Previous Behavior**: The `convertImageIfNeeded()` function only converted HEIF/HEIC images to PNG, leaving JPEG images in their original format.

2. **Skia Compatibility Issues**: React Native Skia's image processing has known compatibility issues with certain JPEG formats:
   - Progressive JPEGs
   - JPEGs with specific color profiles
   - JPEGs with EXIF orientation data
   - JPEGs with certain compression settings

3. **Export Pipeline**: During export, the app:
   - Loads the image using Skia's `useImage` hook
   - Creates shaders from the image
   - Renders to an offscreen surface
   - Encodes the result to PNG

   When a JPEG with compatibility issues was passed to Skia, it would fail during shader creation or rendering, causing the app to crash.

## Solution

Convert **all** imported images (including JPEGs) to PNG format upon import. This ensures:

1. **Consistent Format**: All images are processed in the same format
2. **Skia Compatibility**: PNG is fully supported by Skia with no known issues
3. **Predictable Behavior**: Eliminates format-specific edge cases
4. **Quality Preservation**: PNG is lossless, maintaining image quality

## Implementation

### Modified Files

#### `lib/fileSystem.ts`

**Before:**
```typescript
// HEIF image conversion
export async function convertImageIfNeeded(uri: string): Promise<string> {
  try {
    // Check if the image is HEIF/HEIC format by file extension or mime type
    const isHEIF = uri.toLowerCase().match(/\.(heif|heic)$/i);
    
    if (isHEIF) {
      console.log('Converting HEIF image to PNG...');
      // ... conversion code ...
    }
    
    return uri; // Return original URI if not HEIF
  } catch (error) {
    // ... error handling ...
  }
}
```

**After:**
```typescript
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
    
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    
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
```

#### `app/(tabs)/Home/index.tsx`

Updated the comment to reflect the new behavior:

```typescript
// Convert all images to PNG for consistent processing and Skia compatibility
let photoUri = asset.uri;
try {
  const { convertImageIfNeeded } = await import('../../../lib/fileSystem');
  photoUri = await convertImageIfNeeded(asset.uri);
} catch (error) {
  console.error('Error converting image:', error);
  Alert.alert('Error', 'Failed to process the image');
  setLoading(false);
  return;
}
```

## Technical Details

### Conversion Process

1. **Format Detection**: Check if the image is already PNG by file extension
2. **Conditional Conversion**: Only convert non-PNG images
3. **Quality Settings**: Use `compress: 1` (maximum quality) to preserve image fidelity
4. **Format**: Always convert to `SaveFormat.PNG`

### Benefits

- **No Data Loss**: PNG is lossless, preserving all image data
- **Broad Support**: PNG is universally supported
- **Alpha Channel**: PNG supports transparency (useful for future features)
- **No Compression Artifacts**: Unlike JPEG, PNG doesn't introduce compression artifacts

### Performance Considerations

- **One-Time Conversion**: Images are only converted once at import time
- **Lazy Import**: `expo-image-manipulator` is lazily imported to reduce initial bundle size
- **Cached Result**: Converted images are stored in temporary cache and reused

## Testing

To verify the fix:

1. Import a JPEG image from the photo library
2. Select a LUT and make adjustments
3. Tap "Export" button
4. Verify the image exports successfully without crashes
5. Check that the exported image maintains quality

## Known Limitations

- **Larger File Sizes**: PNG files are generally larger than JPEG files
- **Conversion Time**: Initial import may take slightly longer due to conversion
- **Storage**: More disk space required for cached converted images

## Alternative Solutions Considered

1. **JPEG-to-JPEG Pipeline**: Keep JPEGs as-is and fix Skia loading
   - **Rejected**: Too many JPEG format variations to handle reliably

2. **Format-Specific Handling**: Different processing for different formats
   - **Rejected**: Adds complexity and maintenance burden

3. **Direct Skia JPEG Support**: Use native JPEG codecs
   - **Rejected**: React Native Skia's JPEG support has known issues

## Future Enhancements

- Add progress indicator during image conversion
- Implement image size optimization before conversion
- Add user preference for output format (PNG vs JPEG)
- Cache converted images permanently to avoid re-conversion

## References

- [React Native Skia Image Documentation](https://shopify.github.io/react-native-skia/docs/images/)
- [expo-image-manipulator Documentation](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [PNG Specification](http://www.libpng.org/pub/png/spec/1.2/PNG-Contents.html)

