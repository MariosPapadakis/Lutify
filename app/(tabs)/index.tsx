import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { LUT, getAllLUTs, insertLUT, deleteLUT } from '../../lib/database';
import { saveLUTFile, loadLUTData, deleteLUTFile } from '../../lib/fileSystem';
import { validateLUTData } from '../../lib/lutParser';
import LUTListItem from '../../components/LUTListItem';
import Button from '../../components/Button';
import Colors from '../../constants/Colors';

export default function HomeScreen() {
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
      const { parseCubeLUT } = await import('../../lib/lutParser');
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
    router.push(`/editor?lutId=${lut.id}`);
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📁</Text>
      <Text style={styles.emptyTitle}>No LUTs Yet</Text>
      <Text style={styles.emptyText}>
        Import your first .cube LUT file to get started
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My LUTs</Text>
        <Text style={styles.subtitle}>
          {luts.length} {luts.length === 1 ? 'LUT' : 'LUTs'} imported
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
      
      <View style={styles.footer}>
        <Button
          title="Import LUT (.cube)"
          onPress={handleImportLUT}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  listContent: {
    padding: 20,
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
});

