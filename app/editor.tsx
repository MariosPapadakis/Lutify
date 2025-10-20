import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { getLUTById } from '../lib/database';
import { loadLUTData } from '../lib/fileSystem';
import { createLUTShader, convertCubeLUTToImageData, RenderParams } from '../lib/skiaRenderer';
import Slider from '../components/Slider';
import Button from '../components/Button';
import Colors from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CANVAS_HEIGHT = SCREEN_WIDTH * 0.75; // 4:3 aspect ratio fallback
const CANVAS_MAX_HEIGHT = SCREEN_WIDTH * 1.5; // Avoid overly tall previews

export default function EditorScreen() {
  const { lutId } = useLocalSearchParams<{ lutId: string }>();
  const router = useRouter();
  
  const [lutName, setLutName] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [lutImageData, setLutImageData] = useState<{
    data: Uint8Array;
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

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
  
  // Render parameters
  const [strength, setStrength] = useState(100);
  const [exposure, setExposure] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  
  // Skia images
  const photoImage = useImage(photoUri || '');
  const canvasRef = useCanvasRef();
  
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
  
  // Load LUT on mount
  useEffect(() => {
    if (lutId) {
      loadLUT();
    }
  }, [lutId]);
  
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
      
      // Load LUT data and convert to image
      const lutData = await loadLUTData(lut.path);
      const imageData = convertCubeLUTToImageData(lutData.data, lutData.size);
      setLutImageData(imageData);
      
      console.log('LUT loaded and converted to image:', lut.name);
    } catch (error) {
      console.error('Error loading LUT:', error);
      Alert.alert('Error', 'Failed to load LUT');
    }
  };
  
  const handleImportPhoto = async () => {
    try {
      setLoading(true);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to import images');
        setLoading(false);
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
      });
      
      if (result.canceled) {
        setLoading(false);
        return;
      }
      
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      
      console.log('Image loaded:', {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
    } catch (error) {
      console.error('Error importing photo:', error);
      Alert.alert('Error', 'Failed to import photo');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePhoto = async () => {
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
      
      console.log('Exporting at full resolution:', { imageWidth, imageHeight });
      
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
      
      Alert.alert('Success', 'Photo saved to camera roll!');
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    } finally {
      setExporting(false);
    }
  };
  
  const handleReset = () => {
    setStrength(100);
    setExposure(0);
    setContrast(0);
    setSaturation(0);
    setTemperature(0);
    setTint(0);
  };
  
  // Render the canvas content
  const renderShader = useMemo(() => {
    if (!photoImage) {
      return null;
    }
    
    // If no LUT or shader, just show the photo
    if (!lutImage || !shaderEffect) {
      console.log('Showing photo without LUT');
      return (
        <SkiaImage
          image={photoImage}
          fit="contain"
          x={0}
          y={0}
          width={SCREEN_WIDTH}
          height={canvasHeight}
        />
      );
    }
    
    const imageWidth = photoImage.width();
    const imageHeight = photoImage.height();
    const lutWidth = lutImage.width();
    const lutHeight = lutImage.height();
    
    console.log('Rendering with shader:', { imageWidth, imageHeight, lutWidth, lutHeight });
    
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
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={canvasHeight}>
          <Shader source={shaderEffect} uniforms={uniforms}>
            <ImageShader
              image={photoImage}
              fit="contain"
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={canvasHeight}
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
  ]);
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Canvas Preview */}
        <View style={[styles.previewContainer, { height: canvasHeight }]}>
          <Canvas
            ref={canvasRef}
            style={[styles.canvas, { height: canvasHeight }]}
          >
            {renderShader}
          </Canvas>
          {!photoUri && (
            <View style={styles.placeholderOverlay}>
              <Text style={styles.placeholderIcon}>🖼️</Text>
              <Text style={styles.placeholderText}>Import a photo to start</Text>
            </View>
          )}
          {lutName && (
            <View style={styles.lutBadge}>
              <Text style={styles.lutBadgeText}>{lutName}</Text>
            </View>
          )}
        </View>
        
        {/* Controls */}
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
      
      {/* Bottom Actions */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          <Button
            title="Import Photo"
            onPress={handleImportPhoto}
            variant="secondary"
            loading={loading}
            disabled={loading}
            style={styles.footerButton}
          />
          <Button
            title="Save Photo"
            onPress={handleSavePhoto}
            variant="primary"
            loading={exporting}
            disabled={!photoUri || exporting}
            style={styles.footerButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  previewContainer: {
    width: SCREEN_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
    backgroundColor: Colors.dark.surface,
    position: 'relative',
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
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  lutBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  lutBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  controls: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 8,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
