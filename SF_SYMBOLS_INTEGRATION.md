# SF Symbols Integration

This document describes the integration of SF Symbols into the Lutify app using the `expo-symbols` library.

## Overview

SF Symbols is Apple's comprehensive library of symbols designed to integrate seamlessly with San Francisco, the system font for Apple platforms. We've integrated `expo-symbols` to provide native, crisp, and beautiful icons throughout the app on iOS, with graceful fallbacks for Android and Web.

## Installation

```bash
npx expo install expo-symbols
```

Package version: `~1.0.7` (compatible with Expo SDK 54)

## Implementation

### Symbol Component Wrapper

Created a reusable `Symbol` component at `components/Symbol.tsx` that:
- Wraps the `SymbolView` from `expo-symbols`
- Provides platform detection (iOS only)
- Automatically falls back to provided fallback components on non-iOS platforms
- Simplifies the API with sensible defaults

### Symbol Usage Throughout the App

#### 1. Tab Bar Navigation (`app/(tabs)/_layout.tsx`)

Replaced Unicode character icons with SF Symbols:

| Tab | Symbol | Fallback | Description |
|-----|--------|----------|-------------|
| Home | `house.fill` | ■ | Filled house icon |
| Explore | `sparkles` | ◉ | Sparkles icon for discovery |
| Library | `photo.stack.fill` | ⊞ | Stack of photos |
| Settings | `gearshape.fill` | ⚙ | Gear icon for settings |

All tab icons use:
- Size: 22pt
- Dynamic tint color from tab bar state
- Monochrome rendering mode

#### 2. Settings Screen (`app/(tabs)/Settings/index.tsx`)

**Coffee/Support Button:**
- Symbol: `cup.and.saucer.fill`
- Size: 32pt
- Tint Color: Black (#000000)
- Style: Against yellow background (#FFDD00)

#### 3. Library Item Component (`components/LibraryItem.tsx`)

**Export Badge:**
- Symbol: `square.and.arrow.up.fill`
- Size: 14pt
- Tint Color: Dynamic (Colors.dark.text)
- Position: Top-right corner of photo thumbnails
- Indicates photos that have been exported

#### 4. LUT List Item Component (`components/LUTListItem.tsx`)

**Edit/Rename Button:**
- Symbol: `pencil`
- Size: 18pt
- Tint Color: Secondary text color
- Function: Opens rename dialog

**Delete Button:**
- Symbol: `xmark`
- Size: 20pt
- Tint Color: Secondary text color
- Function: Deletes the LUT

#### 5. Explore Screen (`app/(tabs)/Explore/index.tsx`)

**Coming Soon Icon:**
- Symbol: `magnifyingglass.circle.fill`
- Size: 64pt
- Type: `hierarchical` (creates depth effect)
- Tint Color: Primary color
- Large decorative icon for placeholder state

#### 6. Editor Screen (`app/editor.tsx`)

**Fullscreen Close Button:**
- Symbol: `xmark.circle.fill`
- Size: 36pt
- Type: `hierarchical`
- Tint Color: `rgba(255, 255, 255, 0.8)`
- Position: Top-right in fullscreen mode
- Function: Exits fullscreen view

## Symbol Types Used

We utilize various SF Symbol rendering modes:

1. **Monochrome** (default): Single color symbols
   - Used in: Tab bar, buttons, actions

2. **Hierarchical**: Creates depth with opacity variations
   - Used in: Explore screen magnifying glass, fullscreen close button
   - Provides visual depth and polish

## Design Benefits

### iOS
- Native appearance that matches system design
- Scales perfectly at all sizes
- Supports dynamic type and accessibility features
- Automatic dark mode support
- Crisp rendering at any size (vector-based)

### Android/Web
- Graceful fallback to Unicode characters
- Maintains functionality across all platforms
- No additional assets needed

## Best Practices Followed

1. **Consistent Sizing**: Used standardized sizes (14pt, 18pt, 22pt, 32pt, 36pt, 64pt)
2. **Appropriate Symbols**: Chose symbols that clearly represent their function
3. **Platform Detection**: Automatic fallback for non-iOS platforms
4. **Accessibility**: SF Symbols inherit accessibility features from the system
5. **Color Consistency**: Tint colors match the app's color scheme
6. **Semantic Naming**: Used descriptive symbol names that indicate their purpose

## Symbol Reference

Complete list of SF Symbols used:

```typescript
// Navigation
"house.fill"                    // Home tab
"sparkles"                      // Explore tab
"photo.stack.fill"              // Library tab
"gearshape.fill"               // Settings tab

// Actions
"square.and.arrow.up.fill"     // Export/Share indicator
"pencil"                       // Edit/Rename
"xmark"                        // Delete/Remove
"xmark.circle.fill"            // Close fullscreen

// UI Elements
"cup.and.saucer.fill"          // Coffee/Support
"magnifyingglass.circle.fill"  // Search/Explore
```

## Future Enhancements

Potential areas to add more SF Symbols:

1. **Button Icons**: Add icons to primary action buttons (Export, Save, Import)
2. **Empty States**: Use relevant symbols for empty library/LUT lists
3. **Animations**: Utilize SF Symbol animations for state changes
4. **Additional Actions**: 
   - `photo` for photo selection
   - `slider.horizontal.3` for adjustments
   - `wand.and.stars` for LUT application
   - `arrow.clockwise` for reset

## Resources

- [SF Symbols App](https://developer.apple.com/sf-symbols/) - Browse all available symbols
- [expo-symbols Documentation](https://docs.expo.dev/versions/latest/sdk/symbols/)
- [Apple Human Interface Guidelines - SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)

## Notes

- SF Symbols are only available on iOS/tvOS
- Always provide meaningful fallbacks for other platforms
- Test symbol appearance in both light and dark modes
- Consider using different symbol weights (ultraLight, regular, bold) for visual hierarchy

