import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  BackHandler,
  Modal,
  StatusBar,
  Pressable,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Directory, File, Paths } from 'expo-file-system';
import {
  Canvas,
  Skia,
  ImageShader,
  Shader,
  Group,
  useImage,
  useCanvasRef,
  Image as SkiaImage,
  Rect,
  Paint,
} from '@shopify/react-native-skia';
import { 
  getLUTById, 
  insertEditedPhoto, 
  updateEditedPhoto, 
  markAsExported,
  getEditedPhotoById,
  updateThumbnailUri
} from '../lib/database';
import { 
  loadLUTData, 
  saveThumbnail, 
  savePhotoToLibrary 
} from '../lib/fileSystem';
import { createLUTShader, convertCubeLUTToImageData, RenderParams } from '../lib/skiaRenderer';
import Slider from '../components/Slider';
import Button from '../components/Button';
import Symbol from '../components/Symbol';
import Colors from '../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_CANVAS_HEIGHT = SCREEN_WIDTH * 0.75; // 4:3 aspect ratio fallback
const CANVAS_MAX_HEIGHT = SCREEN_HEIGHT * 0.4; // Max 40% of screen height

// Default values for comparison
const DEFAULT_STRENGTH = 100;
const DEFAULT_EXPOSURE = 0;
const DEFAULT_CONTRAST = 0;
const DEFAULT_SATURATION = 0;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_TINT = 0;

export default function EditorScreen() {
  const { photoUri: photoUriParam, lutId, editedPhotoId } = useLocalSearchParams<{ 
    photoUri: string; 
    lutId: string;
    editedPhotoId?: string;
  }>();
  const router = useRouter();
  
  const [lutName, setLutName] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(photoUriParam || null);
  const [lutImageData, setLutImageData] = useState<{
    data: Uint8Array;
    width: number;
    height: number;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentEditedPhotoId, setCurrentEditedPhotoId] = useState<number | null>(
    editedPhotoId ? parseInt(editedPhotoId) : null
  );
  const [showOriginal, setShowOriginal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(false);
  
  // Render parameters
  const [strength, setStrength] = useState(DEFAULT_STRENGTH);
  const [exposure, setExposure] = useState(DEFAULT_EXPOSURE);
  const [contrast, setContrast] = useState(DEFAULT_CONTRAST);
  const [saturation, setSaturation] = useState(DEFAULT_SATURATION);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [tint, setTint] = useState(DEFAULT_TINT);
  
  // Skia images
  const photoImage = useImage(photoUri || '');
  const canvasRef = useCanvasRef();

  const canvasHeight = useMemo(() => {
    if (!photoImage) {
      return DEFAULT_CANVAS_HEIGHT;
    }

    const width = photoImage.width();
    const height = photoImage.height();

    if (width === 0 || height === 0) {
      return DEFAULT_CANVAS_HEIGHT;
    }

    const aspectRatio = height / width;
    return Math.min(SCREEN_WIDTH * aspectRatio, CANVAS_MAX_HEIGHT);
  }, [photoImage]);
  
  // Track if user has made changes
  const hasChanges = useMemo(() => {
    return (
      strength !== DEFAULT_STRENGTH ||
      exposure !== DEFAULT_EXPOSURE ||
      contrast !== DEFAULT_CONTRAST ||
      saturation !== DEFAULT_SATURATION ||
      temperature !== DEFAULT_TEMPERATURE ||
      tint !== DEFAULT_TINT
    );
  }, [strength, exposure, contrast, saturation, temperature, tint]);
  
  // Should prevent navigation
  const shouldPreventNavigation = hasChanges && !allowNavigation;
  
  // Create LUT image from data
  const lutImage = useMemo(() => {
    if (!lutImageData) return null;
    
    try {
      // ColorType.RGBA_8888 = 4, AlphaType.Premul = 1
      const imageInfo = {
        width: lutImageData.width,
        height: lutImageData.height,
        colorType: 4, // RGBA_8888
        alphaType: 1, // Premul
      };
      
      // Wrap the Uint8Array in a Skia Data object
      const data = Skia.Data.fromBytes(lutImageData.data);
      
      const image = Skia.Image.MakeImage(
        imageInfo,
        data,
        lutImageData.width * 4
      );
      
      return image;
    } catch (error) {
      console.error('Error creating LUT image:', error);
      return null;
    }
  }, [lutImageData]);
  
  // Create shader effect
  const shaderEffect = useMemo(() => {
    return createLUTShader();
  }, []);
  
  // Load LUT and edited photo on mount
  useEffect(() => {
    if (editedPhotoId) {
      loadEditedPhoto();
    } else if (lutId) {
      loadLUT();
    }
  }, [lutId, editedPhotoId]);
  
  const loadEditedPhoto = async () => {
    try {
      if (!editedPhotoId) return;
      
      const editedPhoto = await getEditedPhotoById(parseInt(editedPhotoId));
      if (!editedPhoto) {
        Alert.alert('Error', 'Edited photo not found');
        router.back();
        return;
      }
      
      // Load photo
      setPhotoUri(editedPhoto.photoUri);
      
      // Load LUT
      const lut = await getLUTById(editedPhoto.lutId);
      if (lut) {
        setLutName(lut.name);
        
        // Load pre-converted LUT image if available, otherwise convert on-the-fly
        if (lut.imagePath) {
          const { loadLUTImage } = await import('../lib/fileSystem');
          const imageData = await loadLUTImage(lut.imagePath);
          // Reconstruct the image data object (512x512 for 64-size LUT)
          setLutImageData({ data: imageData, width: 512, height: 512 });
        } else {
          // Fallback: convert on-the-fly (for old LUTs without imagePath)
          const lutData = await loadLUTData(lut.path);
          const imageData = convertCubeLUTToImageData(lutData.data, lutData.size);
          setLutImageData(imageData);
        }
      }
      
      // Load saved adjustments
      setStrength(editedPhoto.strength);
      setExposure(editedPhoto.exposure);
      setContrast(editedPhoto.contrast);
      setSaturation(editedPhoto.saturation);
      setTemperature(editedPhoto.temperature);
      setTint(editedPhoto.tint);
    } catch (error) {
      console.error('Error loading edited photo:', error);
      Alert.alert('Error', 'Failed to load edited photo');
    }
  };
  
  const loadLUT = async () => {
    try {
      if (!lutId) return;
      
      const lut = await getLUTById(parseInt(lutId));
      if (!lut) {
        Alert.alert('Error', 'LUT not found');
        router.back();
        return;
      }
      
      setLutName(lut.name);
      
      // Load pre-converted LUT image if available, otherwise convert on-the-fly
      if (lut.imagePath) {
        const { loadLUTImage } = await import('../lib/fileSystem');
        const imageData = await loadLUTImage(lut.imagePath);
        // Reconstruct the image data object (512x512 for 64-size LUT)
        setLutImageData({ data: imageData, width: 512, height: 512 });
      } else {
        // Fallback: convert on-the-fly (for old LUTs without imagePath)
          const lutData = await loadLUTData(lut.path);
          const imageData = convertCubeLUTToImageData(lutData.data, lutData.size);
          setLutImageData(imageData);
      }
    } catch (error) {
      console.error('Error loading LUT:', error);
      Alert.alert('Error', 'Failed to load LUT');
    }
  };
  
  const handleChangeLUT = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setAllowNavigation(true);
              setTimeout(() => {
                if (photoUri) {
                  router.push(`/lut-picker?photoUri=${encodeURIComponent(photoUri)}`);
                }
              }, 0);
            },
          },
        ]
      );
    } else {
      if (photoUri) {
        router.push(`/lut-picker?photoUri=${encodeURIComponent(photoUri)}`);
      }
    }
  };
  
  // Handle hardware back button and navigation back
  const handleBackPress = useCallback(() => {
    if (hasChanges && !allowNavigation) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setAllowNavigation(true);
              setTimeout(() => router.back(), 0);
            },
          },
        ]
      );
      return true; // Prevent default back behavior
    }
    return false; // Allow default back behavior
  }, [hasChanges, allowNavigation, router]);
  
  // Prevent navigation when there are unsaved changes
  usePreventRemove(shouldPreventNavigation, ({ data }) => {
    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setAllowNavigation(true);
            setTimeout(() => router.back(), 0);
          },
        },
      ]
    );
  });
  
  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );
      
      return () => backHandler.remove();
    }, [handleBackPress])
  );
  
  const handleSaveToLibrary = async () => {
    try {
      if (!photoUri || !lutId) {
        Alert.alert('Error', 'Photo and LUT are required');
        return;
      }
      
      setSaving(true);
      
      const photoName = `LUTify_${Date.now()}`;
      
      // If updating existing photo
      if (currentEditedPhotoId) {
        await updateEditedPhoto(
          currentEditedPhotoId,
          photoName,
          strength,
          exposure,
          contrast,
          saturation,
          temperature,
          tint
        );
        Alert.alert('Success', 'Changes saved!');
      } else {
        // Save photo to permanent storage
        const savedPhotoUri = await savePhotoToLibrary(photoUri, Date.now());
        
        // Insert into database (this will return the new ID)
        const newId = await insertEditedPhoto(
          photoName,
          savedPhotoUri,
          '', // Thumbnail will be generated next
          parseInt(lutId),
          strength,
          exposure,
          contrast,
          saturation,
          temperature,
          tint
        );
        
        // Generate and save thumbnail
        const thumbnailUri = await saveThumbnail(savedPhotoUri, newId);
        
        // Update the record with thumbnail URI
        await updateThumbnailUri(newId, thumbnailUri);
        
        // Update state to track this is now a library item
        setCurrentEditedPhotoId(newId);
        
        Alert.alert('Success', 'Saved to Library!');
      }
    } catch (error) {
      console.error('Error saving to library:', error);
      Alert.alert('Error', 'Failed to save to library');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExportPhoto = async () => {
    try {
      if (!photoUri || !photoImage || !lutImage || !shaderEffect) {
        Alert.alert('No Photo', 'Please import a photo first');
        return;
      }
      
      setExporting(true);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to save images');
        setExporting(false);
        return;
      }
      
      // Render at original image resolution
      const imageWidth = photoImage.width();
      const imageHeight = photoImage.height();
      const lutWidth = lutImage.width();
      const lutHeight = lutImage.height();
      
      // Create offscreen surface at original dimensions
      const surface = Skia.Surface.MakeOffscreen(imageWidth, imageHeight);
      if (!surface) {
        throw new Error('Failed to create offscreen surface');
      }
      
      const canvas = surface.getCanvas();
      
      // Build the shader with full-res uniforms
      const uniforms = [
        imageWidth,
        imageHeight,
        lutWidth,
        lutHeight,
        strength / 100,
        exposure,
        contrast,
        saturation,
        temperature,
        tint,
      ];
      
      const photoShader = photoImage.makeShaderCubic(
        0, // TileMode.Clamp
        0, // TileMode.Clamp
        1/3, // B
        1/3  // C
      );
      
      const lutShader = lutImage.makeShaderCubic(
        0, // TileMode.Clamp
        0, // TileMode.Clamp
        1/3,
        1/3
      );
      
      const effect = shaderEffect.makeShaderWithChildren(
        uniforms,
        [photoShader, lutShader]
      );
      
      if (!effect) {
        throw new Error('Failed to create shader');
      }
      
      // Draw to canvas
      const paint = Skia.Paint();
      paint.setShader(effect);
      canvas.drawRect(Skia.XYWHRect(0, 0, imageWidth, imageHeight), paint);
      
      // Capture the surface
      const snapshot = surface.makeImageSnapshot();
      if (!snapshot) {
        throw new Error('Failed to capture surface');
      }
      
      // Encode to PNG
      const pngData = snapshot.encodeToBytes();
      if (!pngData) {
        throw new Error('Failed to encode image');
      }
      
      // Save to file
      const filename = `LUTify_${Date.now()}.png`;
      const cacheDirectory = new Directory(Paths.cache, 'exports');
      if (!cacheDirectory.exists) {
        cacheDirectory.create();
      }
      const file = new File(cacheDirectory, filename);
      
      await file.write(pngData);
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(file.uri);
      await MediaLibrary.createAlbumAsync('LUTify', asset, false);
      
      // Mark as exported in library if it exists
      if (currentEditedPhotoId) {
        await markAsExported(currentEditedPhotoId);
      }
      
      Alert.alert('Success', 'Photo exported to camera roll!');
    } catch (error) {
      console.error('Error exporting photo:', error);
      Alert.alert('Error', 'Failed to export photo');
    } finally {
      setExporting(false);
    }
  };
  
  const handleReset = () => {
    setStrength(DEFAULT_STRENGTH);
    setExposure(DEFAULT_EXPOSURE);
    setContrast(DEFAULT_CONTRAST);
    setSaturation(DEFAULT_SATURATION);
    setTemperature(DEFAULT_TEMPERATURE);
    setTint(DEFAULT_TINT);
  };
  
  // Render the canvas content
  const renderShader = useMemo(() => {
    if (!photoImage) {
      return null;
    }
    
    const displayWidth = isFullscreen ? SCREEN_WIDTH : SCREEN_WIDTH;
    const displayHeight = isFullscreen ? SCREEN_HEIGHT : canvasHeight;
    
    // If showing original or no LUT/shader, just show the photo
    if (showOriginal || !lutImage || !shaderEffect) {
      return (
        <SkiaImage
          image={photoImage}
          fit="contain"
          x={0}
          y={0}
          width={displayWidth}
          height={displayHeight}
        />
      );
    }
    
    const imageWidth = photoImage.width();
    const imageHeight = photoImage.height();
    const lutWidth = lutImage.width();
    const lutHeight = lutImage.height();
    
    const uniforms = {
      imageWidth,
      imageHeight,
      lutWidth,
      lutHeight,
      strength: strength / 100,
      exposure,
      contrast,
      saturation,
      temperature,
      tint,
    };
    
    return (
      <Group>
        <Rect x={0} y={0} width={displayWidth} height={displayHeight}>
          <Shader source={shaderEffect} uniforms={uniforms}>
            <ImageShader
              image={photoImage}
              fit="contain"
              x={0}
              y={0}
              width={displayWidth}
              height={displayHeight}
            />
            <ImageShader
              image={lutImage}
              fit="none"
              x={0}
              y={0}
              width={lutWidth}
              height={lutHeight}
            />
          </Shader>
        </Rect>
      </Group>
    );
  }, [
    photoImage,
    lutImage,
    shaderEffect,
    strength,
    exposure,
    contrast,
    saturation,
    temperature,
    tint,
    canvasHeight,
    showOriginal,
    isFullscreen,
  ]);
  
  // Gesture handler callbacks
  const handleLongPressStart = useCallback(() => {
    setShowOriginal(true);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    setShowOriginal(false);
  }, []);

  const handleDoubleTap = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Gesture handlers - memoized to prevent recreation
  const longPressGesture = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(200)
        .onStart(() => {
          runOnJS(handleLongPressStart)();
        })
        .onEnd(() => {
          runOnJS(handleLongPressEnd)();
        })
        .onFinalize(() => {
          runOnJS(handleLongPressEnd)();
        }),
    [handleLongPressStart, handleLongPressEnd]
  );

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          runOnJS(handleDoubleTap)();
        }),
    [handleDoubleTap]
  );

  const composedGesture = useMemo(
    () => Gesture.Race(doubleTapGesture, longPressGesture),
    [doubleTapGesture, longPressGesture]
  );

  return (
    <View style={styles.container}>
      {/* Canvas Preview - Fixed or Fullscreen */}
      {!isFullscreen && (
        <GestureDetector gesture={composedGesture}>
          <View style={[styles.previewContainer, { height: canvasHeight }]}>
            <Canvas
              ref={canvasRef}
              style={[styles.canvas, { height: canvasHeight }]}
            >
              {renderShader}
            </Canvas>
            {!photoUri && (
              <View style={styles.placeholderOverlay}>
                <Text style={styles.placeholderText}>Import a photo to start</Text>
              </View>
            )}
            {showOriginal && (
              <View style={styles.originalBadge}>
                <Text style={styles.originalBadgeText}>Original</Text>
              </View>
            )}
          </View>
        </GestureDetector>
      )}
      
      {/* Fullscreen Modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
        statusBarTranslucent
      >
        <StatusBar hidden />
        <GestureDetector gesture={composedGesture}>
          <View style={styles.fullscreenContainer}>
            <Canvas style={styles.fullscreenCanvas}>
              {renderShader}
            </Canvas>
            {showOriginal && (
              <View style={styles.fullscreenOriginalBadge}>
                <Text style={styles.originalBadgeText}>Original</Text>
              </View>
            )}
            <Pressable
              style={styles.fullscreenCloseButton}
              onPress={() => setIsFullscreen(false)}
            >
              <Symbol 
                name="xmark.circle.fill" 
                size={36}
                tintColor="rgba(255, 255, 255, 0.8)"
                type="hierarchical"
                fallback={<Text style={styles.fullscreenCloseText}>✕</Text>}
              />
            </Pressable>
          </View>
        </GestureDetector>
      </Modal>

      {/* Controls - Scrollable */}
      {!isFullscreen && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.controls}>
          <Text style={styles.sectionTitle}>Adjustments</Text>
          
          <Slider
            label="LUT Strength"
            value={strength}
            minimumValue={0}
            maximumValue={100}
            step={1}
            onValueChange={setStrength}
            unit="%"
          />
          
          <Slider
            label="Exposure"
            value={exposure}
            minimumValue={-2}
            maximumValue={2}
            step={0.01}
            onValueChange={setExposure}
          />
          
          <Slider
            label="Contrast"
            value={contrast}
            minimumValue={-1}
            maximumValue={1}
            step={0.01}
            onValueChange={setContrast}
          />
          
          <Slider
            label="Saturation"
            value={saturation}
            minimumValue={-1}
            maximumValue={1}
            step={0.01}
            onValueChange={setSaturation}
          />
          
          <Slider
            label="Temperature"
            value={temperature}
            minimumValue={-1}
            maximumValue={1}
            step={0.01}
            onValueChange={setTemperature}
          />
          
          <Slider
            label="Tint"
            value={tint}
            minimumValue={-1}
            maximumValue={1}
            step={0.01}
            onValueChange={setTint}
          />
          
          <Button
            title="Reset Adjustments"
            onPress={handleReset}
            variant="secondary"
            style={styles.resetButton}
          />
        </View>
        </ScrollView>
      )}
      
      {/* Bottom Actions */}
      {!isFullscreen && (
        <View style={styles.footer}>
        <View style={styles.footerButtonsRow}>
          <Button
            title="Change LUT"
            onPress={handleChangeLUT}
            variant="secondary"
            disabled={!photoUri}
            style={styles.footerButtonSmall}
          />
        </View>
        <View style={styles.footerButtonsRow}>
          <Button
            title="Save to Library"
            onPress={handleSaveToLibrary}
            variant="secondary"
            loading={saving}
            disabled={!photoUri || saving || exporting}
            style={styles.footerButton}
          />
          <Button
            title="Export"
            onPress={handleExportPhoto}
            variant="primary"
            loading={exporting}
            disabled={!photoUri || exporting || saving}
            style={styles.footerButton}
          />
        </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  previewContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: Colors.dark.surface,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  canvas: {
    width: SCREEN_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
  },
  placeholderText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    letterSpacing: -0.1,
  },
  lutBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  lutBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.dark.text,
    letterSpacing: -0.1,
  },
  controls: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  resetButton: {
    marginTop: 4,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonSmall: {
    flex: 1,
  },
  originalBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  originalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
    letterSpacing: -0.1,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCanvas: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullscreenOriginalBadge: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.dark.text,
  },
});
