# Getting Started with LUTify

## What are LUT Files?

LUT (Look-Up Table) files are color grading presets used in photography and videography. A `.cube` LUT file contains a 3D color transformation that maps input RGB values to output RGB values, creating various cinematic or stylistic color effects.

## Where to Find Free LUT Files

Here are some sources for free `.cube` LUT files to test the app:

### Free LUT Resources

1. **RocketStock**
   - https://www.rocketstock.com/free-after-effects-templates/35-free-luts-for-color-grading-videos/
   - High-quality cinematic LUTs

2. **FilterGrade**
   - https://filtergrade.com/free-luts/
   - Various free LUT packs for different styles

3. **IWLTBAP**
   - https://iwltbap.com/
   - Free cinematic LUTs

4. **Bounce Color**
   - https://bouncecolor.com/luts/free
   - Professional-grade free LUTs

5. **Lutify.me**
   - https://lutify.me/free-luts/
   - Free sample LUTs from professional packs

### Creating Your Own LUTs

You can also create custom LUTs using:
- **Adobe Photoshop** - Export color lookup tables
- **DaVinci Resolve** - Export .cube LUTs from your grades
- **Adobe Premiere Pro** - Export Lumetri LUTs
- **Final Cut Pro X** - Export custom LUTs

## Testing the App

### Quick Start

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Download a sample LUT file:**
   - Visit any of the free resources above
   - Download a `.cube` file to your device

3. **Import the LUT:**
   - Open LUTify app
   - Tap "Import LUT (.cube)"
   - Select the downloaded `.cube` file

4. **Edit a photo:**
   - Tap on the imported LUT
   - Tap "Import Photo" and select a photo from your gallery
   - Adjust sliders in real-time
   - Tap "Save Photo" to export

### Supported LUT Formats

LUTify supports `.cube` format LUTs with the following specifications:

- **Format:** 3D LUT in .cube format
- **Grid sizes:** 17³, 33³, 64³ (other sizes may work but are not officially tested)
- **Domain:** Default [0-1] or custom domain ranges
- **Color space:** RGB

### Example .cube LUT File Structure

```
TITLE "Sample LUT"
LUT_3D_SIZE 33

0.0 0.0 0.0
0.0 0.0 0.03125
0.0 0.0 0.0625
...
1.0 1.0 1.0
```

## Sample Workflow

### Portrait Photography
1. Import a warm portrait LUT
2. Set LUT Strength to 70-80%
3. Increase Exposure slightly (+0.2 to +0.5)
4. Boost Saturation (+0.1 to +0.2)
5. Warm up Temperature (+0.1 to +0.3)

### Landscape Photography
1. Import a cinematic landscape LUT
2. Keep LUT Strength at 100%
3. Increase Contrast (+0.2 to +0.4)
4. Boost Saturation (+0.2 to +0.3)
5. Cool down Temperature (-0.1 to -0.2)

### Black & White
1. Import a B&W LUT
2. Adjust Contrast for mood (+0.3 to +0.6)
3. Play with Exposure for highlights/shadows
4. Use Tint for subtle color casts

## Troubleshooting

### "Invalid LUT file" Error
- Ensure the file is a valid `.cube` format
- Check that the file isn't corrupted
- Verify the LUT size is supported (17, 33, or 64)

### Photo Won't Load
- Check that you've granted photo library permissions
- Try a different photo (JPEG or PNG)
- Restart the app if GL context fails

### Slow Performance
- Reduce photo resolution before importing
- Close other apps running in background
- Try a smaller LUT size (17³ or 33³ instead of 64³)

### Export Quality Issues
- Ensure original photo is high resolution
- Check device storage space
- Verify media library permissions

## Tips for Best Results

1. **Start with subtle adjustments** - Less is often more
2. **Use LUT strength** - Blend the effect to taste
3. **Consider the photo** - Different LUTs work better with different subjects
4. **Save presets mentally** - Remember your favorite slider combinations
5. **Compare before/after** - Take note of the original photo before editing

## Building for Production

### iOS

```bash
eas build --platform ios --profile production
```

### Android

```bash
eas build --platform android --profile production
```

See README.md for more details on production builds.

## Support

If you encounter any issues or have suggestions:
- Check the README.md for common solutions
- Review the TypeScript type definitions
- Check console logs for detailed error messages

## Next Steps

Once you're comfortable with the basics:
- Experiment with different LUT styles
- Create your own LUT library organized by mood/style
- Share your edited photos (no watermarks!)
- Consider creating your own custom LUTs in professional tools

Happy grading! 🎨


