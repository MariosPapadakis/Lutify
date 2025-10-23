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
  TextInput,
  Modal,
  Pressable,
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
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [lutName, setLutName] = useState('');
  const [pendingLutData, setPendingLutData] = useState<any>(null);
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
  
  const handleConfirmName = async () => {
    if (!pendingLutData || !lutName.trim()) {
      Alert.alert('Error', 'Please enter a name for the LUT');
      return;
    }
    
    try {
      setShowNameDialog(false);
      setLoading(true);
      
      // Insert into database first to get the ID
      const lutId = await insertLUT(
        lutName.trim(),
        pendingLutData.savedPath,
        '', // imagePath will be updated after saving
        pendingLutData.size,
        pendingLutData.domainMin,
        pendingLutData.domainMax
      );
      
      // Save the converted LUT image
      const { saveLUTImage } = await import('../lib/fileSystem');
      const imagePath = await saveLUTImage(pendingLutData.imageData.data, lutId);
      
      // Update the LUT with the image path
      const { updateLUTImagePath } = await import('../lib/database');
      await updateLUTImagePath(lutId, imagePath);
      
      // Reload list
      await loadLUTs();
      
      // Clear pending data
      setPendingLutData(null);
      setLutName('');
      
      Alert.alert('Success', `LUT "${lutName.trim()}" imported successfully!`);
    } catch (error) {
      console.error('Error completing import:', error);
      Alert.alert('Error', 'Failed to complete LUT import');
    } finally {
      setLoading(false);
    }
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
      
      // Convert LUT to image format
      const { convertCubeLUTToImageData } = await import('../lib/skiaRenderer');
      const imageData = convertCubeLUTToImageData(parsedLUT.data, parsedLUT.size);
      
      // Prepare data for name dialog
      const defaultName = parsedLUT.title || file.name.replace('.cube', '');
      setLutName(defaultName);
      setPendingLutData({
        savedPath,
        imageData,
        size: parsedLUT.size,
        domainMin: parsedLUT.domainMin,
        domainMax: parsedLUT.domainMax,
      });
      setShowNameDialog(true);
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
      
      // Delete cube file
      await deleteLUTFile(lut.path);
      
      // Delete image file if it exists
      if (lut.imagePath) {
        const imageFile = new File(lut.imagePath);
        if (imageFile.exists) {
          imageFile.delete();
        }
      }
      
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
  
  const handleRenameLUT = (lut: LUT) => {
    Alert.prompt(
      'Rename LUT',
      'Enter a new name for this LUT',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: async (newName) => {
            if (!newName || !newName.trim()) {
              Alert.alert('Error', 'Please enter a valid name');
              return;
            }
            
            try {
              const { updateLUTName } = await import('../lib/database');
              await updateLUTName(lut.id, newName.trim());
              await loadLUTs();
              Alert.alert('Success', 'LUT renamed successfully');
            } catch (error) {
              console.error('Error renaming LUT:', error);
              Alert.alert('Error', 'Failed to rename LUT');
            }
          },
        },
      ],
      'plain-text',
      lut.name
    );
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
              onRename={() => handleRenameLUT(item)}
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
      
      {/* Name Dialog */}
      <Modal
        visible={showNameDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNameDialog(false);
          setPendingLutData(null);
          setLutName('');
        }}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            setShowNameDialog(false);
            setPendingLutData(null);
            setLutName('');
          }}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Name Your LUT</Text>
            <Text style={styles.modalSubtitle}>Enter a name for this LUT</Text>
            
            <TextInput
              style={styles.modalInput}
              value={lutName}
              onChangeText={setLutName}
              placeholder="LUT Name"
              placeholderTextColor={Colors.dark.textSecondary}
              autoFocus
              selectTextOnFocus
            />
            
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowNameDialog(false);
                  setPendingLutData(null);
                  setLutName('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmName}
              >
                <Text style={styles.modalButtonText}>Import</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 20,
    letterSpacing: -0.1,
  },
  modalInput: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.dark.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    letterSpacing: -0.2,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    letterSpacing: -0.2,
  },
});

