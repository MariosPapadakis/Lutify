import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { LUT, getAllLUTs, insertLUT, deleteLUT } from '../lib/database';
import { saveLUTFile, deleteLUTFile } from '../lib/fileSystem';
import { validateLUTData } from '../lib/lutParser';
import LUTListItem from '../components/LUTListItem';
import Button from '../components/Button';
import Colors from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_HEIGHT = SCREEN_WIDTH * 0.5;

export default function LUTPickerScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri: string }>();
  const [luts, setLuts] = useState<LUT[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const loadLUTs = async () => {
    try {
      const allLuts = await getAllLUTs();
      setLuts(allLuts);
    } catch (error) {
      console.error('Error loading LUTs:', error);
      Alert.alert('Error', 'Failed to load LUTs');
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      loadLUTs();
    }, [])
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLUTs();
    setRefreshing(false);
  };
  
  const handleImportLUT = async () => {
    try {
      setLoading(true);
      
      // Pick .cube file
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setLoading(false);
        return;
      }
      
      const file = result.assets[0];
      
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.cube')) {
        Alert.alert('Invalid File', 'Please select a .cube LUT file');
        setLoading(false);
        return;
      }
      
      // Read and parse the file
      const sourceFile = new File(file.uri);
      const fileContent = await sourceFile.text();
      const { parseCubeLUT } = await import('../lib/lutParser');
      const parsedLUT = parseCubeLUT(fileContent);
      
      // Validate LUT
      if (!validateLUTData(parsedLUT)) {
        Alert.alert('Invalid LUT', 'The LUT file appears to be corrupted or invalid');
        setLoading(false);
        return;
      }
      
      // Save file to app directory
      const savedPath = await saveLUTFile(file.uri, file.name);
      
      // Insert into database
      const lutName = parsedLUT.title || file.name.replace('.cube', '');
      await insertLUT(
        lutName,
        savedPath,
        parsedLUT.size,
        parsedLUT.domainMin,
        parsedLUT.domainMax
      );
      
      // Reload list
      await loadLUTs();
      
      Alert.alert('Success', `LUT "${lutName}" imported successfully!`);
    } catch (error) {
      console.error('Error importing LUT:', error);
      Alert.alert('Error', 'Failed to import LUT file');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteLUT = async (lut: LUT) => {
    try {
      // Delete from database
      await deleteLUT(lut.id);
      
      // Delete file
      await deleteLUTFile(lut.path);
      
      // Reload list
      await loadLUTs();
    } catch (error) {
      console.error('Error deleting LUT:', error);
      Alert.alert('Error', 'Failed to delete LUT');
    }
  };
  
  const handleLUTPress = (lut: LUT) => {
    router.push(`/editor?photoUri=${encodeURIComponent(photoUri)}&lutId=${lut.id}`);
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No LUTs</Text>
      <Text style={styles.emptyText}>
        Import your first .cube LUT file to get started
      </Text>
      <Button
        title="Import LUT (.cube)"
        onPress={handleImportLUT}
        loading={loading}
        disabled={loading}
        style={styles.importButton}
      />
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Photo Preview */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
          resizeMode="cover"
        />
      </View>
      
      {/* LUT List Section */}
      <View style={styles.lutSection}>
        <View style={styles.header}>
          <Text style={styles.title}>Select LUT</Text>
          <Text style={styles.subtitle}>
            {luts.length} {luts.length === 1 ? 'LUT' : 'LUTs'} available
          </Text>
        </View>
        
        <FlatList
          data={luts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <LUTListItem
              lut={item}
              onPress={() => handleLUTPress(item)}
              onDelete={() => handleDeleteLUT(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            luts.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.dark.primary}
            />
          }
        />
      </View>
      
      {/* Footer with Import Button */}
      {luts.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Import LUT (.cube)"
            onPress={handleImportLUT}
            loading={loading}
            disabled={loading}
            variant="secondary"
          />
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
    height: PREVIEW_HEIGHT,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  lutSection: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    letterSpacing: -0.1,
  },
  listContent: {
    padding: 24,
    paddingTop: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    letterSpacing: -0.1,
    marginBottom: 24,
  },
  importButton: {
    minWidth: 200,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
});

