# LUTify

A professional mobile photo editing application that applies cinematic color grading to photos using industry-standard LUT (Look-Up Table) files. Built with React Native and Expo, featuring real-time GPU-accelerated rendering powered by Skia.

![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### Core Functionality

- **🎨 LUT Import & Management** - Import and organize `.cube` LUT files (supports 17³, 33³, 64³ grid sizes)
- **⚡ Real-Time GPU Rendering** - Live preview powered by React Native Skia with custom shaders (60fps)
- **🎛️ Professional Color Adjustments** - Fine-tune with 6 parameters:
  - LUT Strength (0-100%) - Blend between original and graded image
  - Exposure (-2 to +2) - Brightness control
  - Contrast (-1 to +1) - Dynamic range adjustment
  - Saturation (-1 to +1) - Color intensity
  - Temperature (-1 to +1) - Warm/cool color cast
  - Tint (-1 to +1) - Green/magenta shift
- **📸 Photo Library Integration** - Browse, select, and save photos seamlessly
- **💾 Persistent Storage** - SQLite database for LUT metadata and edited photo library
- **🚫 No Watermarks** - Export full-resolution images without any branding
- **📱 Offline-First** - All processing happens on-device, no internet required

### User Experience

- **Gesture Controls** - Long-press to preview original, double-tap for fullscreen
- **Intuitive Navigation** - Tab-based interface with dedicated screens for photos, LUTs, and library
- **Real-Time Feedback** - Instant visual updates as you adjust sliders
- **Professional Export** - Save to camera roll at original resolution

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Expo SDK | 54.0.13 |
| Runtime | React Native | 0.81.4 |
| Language | TypeScript | 5.9.2 |
| Navigation | Expo Router | 6.0.12 |
| Rendering | React Native Skia | 2.2.12 |
| Database | Expo SQLite | 16.0.8 |
| File System | Expo File System | 19.0.17 |
| Image Processing | Expo Image Manipulator | 14.0.7 |
| Media Library | Expo Media Library | 18.2.0 |

## Screenshots

Screenshots are available in the `screenshots_appstore/` directory.

## Installation

### Prerequisites

- **Node.js** - LTS version (18.x or later recommended)
- **npm** or **yarn** - Package manager
- **Expo CLI** - For development server
- **iOS Simulator** (macOS) or **Android Emulator** - For local testing
- **Expo Go** app (optional) - For testing on physical devices

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<username>/Lutify.git
   cd Lutify
   ```
   
   Or using SSH:
   ```bash
   git clone git@github.com:<username>/Lutify.git
   cd Lutify
   ```

2. **Set up configuration:**
   ```bash
   # Copy the example config file and update with your credentials
   cp app.json.example app.json
   # Edit app.json and replace placeholders (YOUR_EXPO_USERNAME, YOUR_APPLE_TEAM_ID, YOUR_EAS_PROJECT_ID)
   ```

   > **Note:** See the [Configuration](#configuration) section for details on required values.

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on your preferred platform:**
   - Press `i` to open iOS Simulator
   - Press `a` to open Android Emulator
   - Scan QR code with Expo Go app on your device

## Usage

### Importing LUTs

1. Navigate to the **Explore** tab
2. Tap **"Import LUT (.cube)"**
3. Select a `.cube` file from your device
4. Enter a name for the LUT (optional)
5. The LUT will be validated, parsed, and added to your library

### Editing Photos

1. Go to the **Library** tab (Home) to browse your photo library
2. Select a photo
3. Choose a LUT from the picker screen
4. Adjust color parameters using the sliders:
   - See changes in real-time on the preview canvas
   - Long-press to compare with original
   - Double-tap for fullscreen preview
5. Save to library or export to camera roll

### Managing Your Work

- **Library Tab** - View all edited photos with saved adjustments
- **Explore Tab** - Manage imported LUTs (rename, delete)
- **Settings Tab** - Clear all LUTs or library, manage preferences

## Project Structure

```
Lutify/
├── app/                      # Expo Router file-based routing
│   ├── _layout.tsx          # Root layout with app initialization
│   ├── (tabs)/              # Tab navigation group
│   │   ├── _layout.tsx      # Tab bar configuration
│   │   ├── Home/            # Photo library browser
│   │   ├── Explore/         # LUT management screen
│   │   ├── Library/         # Edited photos library
│   │   └── Settings/        # App settings
│   ├── editor.tsx           # Photo editor with Skia rendering
│   └── lut-picker.tsx       # LUT selection screen
├── lib/                      # Core business logic
│   ├── database.ts          # SQLite CRUD operations
│   ├── fileSystem.ts        # File storage and management
│   ├── lutParser.ts         # .cube file parser and validator
│   ├── skiaRenderer.ts      # Skia shader creation and LUT conversion
│   └── utils.ts             # Helper utilities
├── components/               # Reusable UI components
│   ├── Button.tsx           # Custom button with variants
│   ├── Slider.tsx           # Labeled slider component
│   ├── LUTListItem.tsx      # LUT list item with actions
│   ├── LibraryItem.tsx      # Edited photo list item
│   └── Symbol.tsx           # SF Symbols wrapper
├── constants/
│   └── Colors.ts            # App color scheme
├── types/
│   └── global.d.ts          # TypeScript type definitions
├── examples/                 # Sample LUT files
│   └── README.md            # Sample LUT documentation
├── app.json                  # Expo configuration (create from app.json.example)
├── app.json.example          # Example config with placeholders
├── eas.json                  # EAS Build configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Architecture

### LUT Processing Pipeline

1. **Parsing** - `.cube` files are parsed and validated
2. **Conversion** - 3D LUT data is converted to a 2D texture (8x8 grid for 64³ LUTs)
3. **Storage** - Original `.cube` files and converted images are stored in app directories
4. **Rendering** - Custom Skia shader applies LUT with trilinear interpolation and color adjustments

### Rendering System

The app uses React Native Skia's RuntimeEffect system to create custom shaders that:
- Sample the source image
- Apply 3D LUT lookup with trilinear interpolation
- Apply color adjustments (exposure, contrast, saturation, temperature, tint)
- Blend between original and graded image based on strength parameter
- Render at 60fps with real-time slider updates

### Data Persistence

- **SQLite Database** - Stores LUT metadata (name, size, paths, domain ranges) and edited photo records
- **File System** - Stores actual `.cube` files, converted LUT images, edited photos, and thumbnails
- **Automatic Cleanup** - Orphaned files are removed on app initialization

## Building for Production

### Using EAS Build

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure build:**
   ```bash
   eas build:configure
   ```

4. **Build for production:**
   ```bash
   # iOS
   eas build --platform ios --profile production
   
   # Android
   eas build --platform android --profile production
   ```

### Build Profiles

The `eas.json` file contains profiles for:
- **development** - Development client builds
- **preview** - Internal distribution builds
- **production** - App Store/Play Store builds

## Performance

- **Frame Rate** - Consistent 60fps rendering on mid-range devices
- **Image Resolution** - Supports up to 4K images
- **LUT Application** - < 16ms per frame (60fps target)
- **Memory Efficiency** - Optimized texture handling and cleanup

## Configuration

This repository includes an `app.json.example` template file. To get started, you'll need to create your own `app.json` with your credentials.

### Setting Up Configuration

1. **Copy the example configuration file:**
   ```bash
   cp app.json.example app.json
   ```

2. **Update `app.json` with your values:**
   - **Line 5** - `"owner"`: Replace `"YOUR_EXPO_USERNAME"` with your Expo username
   - **Line 28** - `"appleTeamId"`: Replace `"YOUR_APPLE_TEAM_ID"` with your Apple Developer Team ID (10 characters, e.g., `ABC123DEF4`)
   - **Line 94** - `"projectId"`: Replace `"YOUR_EAS_PROJECT_ID"` with your EAS project ID (UUID format)

   > **Note:** The `app.json` file is excluded from git (via `.gitignore`) to protect your credentials. Each developer should maintain their own local copy.

3. **Update developer information (optional):**
   - **`app/(tabs)/Settings/index.tsx` Line 152** - Update the developer name if desired

### Getting Your Credentials

- **Expo Username**: Your Expo account username from [expo.dev](https://expo.dev)
- **Apple Team ID**: Found in [Apple Developer Account](https://developer.apple.com/account) → Membership section
- **EAS Project ID**: Generated when you run `eas init` or found in your Expo dashboard

### Protected Files

The following files are excluded from version control (via `.gitignore`) to protect sensitive information:

- `app.json` - Expo configuration with your credentials (each developer maintains their own copy)
- `android/app/debug.keystore` - Debug signing key
- `/ios` and `/android` directories - Native build artifacts
- `.env*.local` - Local environment files

> **Note:** Always keep your `app.json` file local with your actual credentials. Never commit it to the repository. The `app.json.example` file serves as a template for all developers.

## Permissions

### iOS
- **NSPhotoLibraryUsageDescription** - Required to select photos from library
- **NSPhotoLibraryAddUsageDescription** - Required to save edited photos

### Android
- **READ_EXTERNAL_STORAGE** / **READ_MEDIA_IMAGES** - Required to access photos
- **WRITE_EXTERNAL_STORAGE** - Required to save edited photos

All permissions are requested at runtime when needed.

## Supported Formats

### LUT Files
- **Format**: `.cube` (3D LUT)
- **Grid Sizes**: 17³, 33³, 64³ (tested), other sizes may work
- **Domain**: Default [0-1] or custom ranges

### Images
- **Import**: JPEG, PNG, HEIF, HEIC (auto-converted to PNG for processing)
- **Export**: PNG (full resolution, no compression)

## Troubleshooting

### LUT Import Fails
- Ensure the file has a `.cube` extension
- Verify the LUT file is properly formatted
- Check that the LUT size is supported (17, 33, or 64)

### Photo Won't Load
- Grant photo library permissions when prompted
- Try importing a different photo format
- Restart the app if rendering context fails

### Performance Issues
- Close other apps running in background
- Try a smaller LUT size (17³ or 33³ instead of 64³)
- Reduce photo resolution before importing

### Export Quality Issues
- Ensure original photo is high resolution
- Check device storage space
- Verify media library permissions are granted

## Sample LUT Files

A sample LUT file is included in the `examples/` directory. For more free LUTs, see the `examples/README.md` file or visit:
- [RocketStock](https://www.rocketstock.com/free-after-effects-templates/35-free-luts-for-color-grading-videos/)
- [FilterGrade](https://filtergrade.com/free-luts/)
- [IWLTBAP](https://iwltbap.com/)
- [Bounce Color](https://bouncecolor.com/luts/free)

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npx tsc --noEmit
```

### Code Style

The project uses TypeScript with strict mode enabled. Follow React Native and Expo best practices.

## License

This project is open source and available under the MIT License.

## Credits

Built with:
- [Expo](https://expo.dev/) - React Native framework
- [React Native Skia](https://shopify.github.io/react-native-skia/) - 2D graphics library
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing

LUT file format specification: [Adobe Cube LUT Specification](https://wwwimages.adobe.com/content/dam/acom/en/products/speedgrade/cc/pdfs/cube-lut-specification-1.0.pdf)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

For questions or issues, please open an issue on GitHub.
