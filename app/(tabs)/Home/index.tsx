import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../../components/Button';
import Colors from '../../../constants/Colors';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleSelectPhoto = async () => {
    try {
      setLoading(true);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to select images');
        setLoading(false);
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
        allowsMultipleSelection: false,
        legacy: false, // Use new picker that supports HEIF
      });
      
      if (result.canceled) {
        setLoading(false);
        return;
      }
      
      const asset = result.assets[0];
      
      // Convert HEIF images to PNG if needed
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
      
      // Navigate to LUT picker with photo URI
      router.push(`/lut-picker?photoUri=${encodeURIComponent(photoUri)}`);
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style= {{ flex:1 }}>
    <ScrollView style={styles.container}
    contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>LUTify</Text>
          <Text style={styles.subtitle}>
            Apply color grading LUTs to your photos
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Button
          title="Select Photo"
          onPress={handleSelectPhoto}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
});

