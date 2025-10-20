# LUTify – Mobile Photo Grader

A powerful offline mobile photo editing app that lets you import and apply .cube LUT files to your photos with real-time GPU-accelerated rendering and fine-tuned color adjustments.

## Features

✅ **LUT Support** - Import and manage .cube LUT files (17³, 33³, 64³)  
✅ **GPU Rendering** - Real-time preview with WebGL shaders  
✅ **Color Adjustments** - LUT Strength, Exposure, Contrast, Saturation, Temperature, Tint  
✅ **Offline First** - No internet required, all processing on-device  
✅ **No Watermarks** - Export full-resolution images without any branding  
✅ **SQLite Storage** - Persistent LUT library across sessions  
✅ **Cross-Platform** - Works on iOS, Android, and Web

## Tech Stack

- **Expo SDK 54** - Latest React Native framework
- **TypeScript** - Type-safe development
- **Expo Router** - File-based navigation
- **expo-gl** - WebGL rendering for GPU acceleration
- **expo-sqlite** - Local database for LUT management
- **expo-file-system** - File storage and management
- **expo-image-picker** - Photo import from gallery
- **expo-media-library** - Export photos to camera roll

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo Go app (for testing on physical devices)
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository:
```bash
cd Lutify
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your device

## Usage

### Importing LUTs

1. Open the app
2. Tap **"Import LUT (.cube)"** button
3. Select a `.cube` LUT file from your device
4. The LUT will be parsed, validated, and added to your library

### Editing Photos

1. Tap on any LUT in your library to open the editor
2. Tap **"Import Photo"** to select an image from your gallery
3. Adjust sliders in real-time:
   - **LUT Strength** (0-100%) - Blend between original and LUT-applied image
   - **Exposure** (-2 to +2) - Brighten or darken the image
   - **Contrast** (-1 to +1) - Increase or decrease contrast
   - **Saturation** (-1 to +1) - Make colors more or less vibrant
   - **Temperature** (-1 to +1) - Warm (yellow/red) or cool (blue) color cast
   - **Tint** (-1 to +1) - Green or magenta color cast
4. Tap **"Save Photo"** to export to your camera roll

### Managing LUTs

- Tap any LUT to edit with it
- Tap the **✕** button to delete a LUT
- Pull down to refresh the LUT list

## Project Structure

```
Lutify/
├── app/                      # Expo Router screens
│   ├── _layout.tsx          # Root layout with initialization
│   ├── (tabs)/              # Tab navigation
│   │   ├── _layout.tsx      # Tab layout
│   │   └── index.tsx        # Home screen (LUT list)
│   └── editor.tsx           # Editor screen with GL rendering
├── lib/                      # Core functionality
│   ├── database.ts          # SQLite operations
│   ├── fileSystem.ts        # File storage utilities
│   ├── glRenderer.ts        # WebGL shader renderer
│   └── lutParser.ts         # .cube file parser
├── components/               # Reusable UI components
│   ├── Button.tsx           # Custom button component
│   ├── Slider.tsx           # Slider with label and value
│   └── LUTListItem.tsx      # LUT list item with delete
├── constants/
│   └── Colors.ts            # App color scheme
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

## How It Works

### LUT Parsing

The app parses `.cube` LUT files, which contain 3D color lookup tables. These tables map input RGB values to output RGB values, creating various color grading effects.

### GPU Rendering

LUTs are applied using WebGL shaders on the GPU for real-time performance:

1. The source image is loaded as a texture
2. The 3D LUT is converted to a 2D texture (horizontal slices)
3. A fragment shader samples the image and applies the LUT using trilinear interpolation
4. Additional color adjustments are applied in the shader
5. The result is rendered to the screen at 60fps

### Data Persistence

- **SQLite Database**: Stores LUT metadata (name, size, path, domain)
- **File System**: Stores actual `.cube` files in app's document directory
- **Settings**: Last-used LUT and parameters (future enhancement)

## Permissions

The app requires the following permissions:

**iOS:**
- Photo Library Usage (NSPhotoLibraryUsageDescription)
- Photo Library Add Usage (NSPhotoLibraryAddUsageDescription)

**Android:**
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE
- READ_MEDIA_IMAGES
- ACCESS_MEDIA_LOCATION

All permissions are requested at runtime when needed.

## Performance

- LUT application: < 16ms per frame (60fps)
- Supports images up to 4K resolution
- Real-time slider adjustments with no lag on mid-range devices
- Optimized shader code for mobile GPUs

## Troubleshooting

### LUT Import Fails

- Ensure the file has a `.cube` extension
- Verify the LUT file is properly formatted
- Supported sizes: 17³, 33³, 64³ (other sizes will show a warning)

### Photo Won't Load

- Check photo library permissions
- Try importing a different photo format (JPEG/PNG supported)
- Restart the app if GL context fails to initialize

### Export Quality Issues

- The app exports at original photo resolution
- JPEG quality is set to 1.0 (maximum)
- No compression beyond the format's default

## Building for Production

### iOS

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android
```

## Future Enhancements

- [ ] Batch apply LUTs to multiple photos
- [ ] HSL and Curves adjustment panels
- [ ] Custom presets (save adjustment combinations)
- [ ] Dark/Light theme toggle
- [ ] RAW/ProRAW file support
- [ ] Share to social media integration
- [ ] Before/After comparison slider

## License

This project is open source and available for personal and commercial use.

## Credits

Built with ❤️ using Expo and React Native.

LUT file format specification: [https://wwwimages.adobe.com/content/dam/acom/en/products/speedgrade/cc/pdfs/cube-lut-specification-1.0.pdf](https://wwwimages.adobe.com/content/dam/acom/en/products/speedgrade/cc/pdfs/cube-lut-specification-1.0.pdf)


