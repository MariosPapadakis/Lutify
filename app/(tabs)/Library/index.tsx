import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
  ActionSheetIOS,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { EditedPhoto, getAllEditedPhotos, deleteEditedPhoto } from '../../../lib/database';
import { deleteThumbnail, deletePhotoFromLibrary } from '../../../lib/fileSystem';
import LibraryItem from '../../../components/LibraryItem';
import Colors from '../../../constants/Colors';

export default function LibraryScreen() {
  const [photos, setPhotos] = useState<EditedPhoto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const loadPhotos = async () => {
    try {
      const allPhotos = await getAllEditedPhotos();
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load library');
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  };
  
  const handlePhotoPress = (photo: EditedPhoto) => {
    // Navigate to editor with all saved parameters
    router.push(
      `/editor?editedPhotoId=${photo.id}&photoUri=${encodeURIComponent(photo.photoUri)}&lutId=${photo.lutId}`
    );
  };
  
  const handlePhotoLongPress = (photo: EditedPhoto) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: photo.name,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            confirmDelete(photo);
          }
        }
      );
    } else {
      // Android - show alert dialog
      Alert.alert(
        photo.name,
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => confirmDelete(photo),
          },
        ]
      );
    }
  };
  
  const confirmDelete = (photo: EditedPhoto) => {
    Alert.alert(
      'Delete Photo',
      `Are you sure you want to delete "${photo.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(photo),
        },
      ]
    );
  };
  
  const handleDelete = async (photo: EditedPhoto) => {
    try {
      // Delete from database
      await deleteEditedPhoto(photo.id);
      
      // Delete thumbnail
      await deleteThumbnail(photo.thumbnailUri);
      
      // Delete photo file
      await deletePhotoFromLibrary(photo.photoUri);
      
      // Reload list
      await loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'Failed to delete photo');
    }
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Edited Photos</Text>
      <Text style={styles.emptyText}>
        Photos you edit will appear here
      </Text>
    </View>
  );

  // Helper function to create rows of 2 items
  const createRows = (data: EditedPhoto[]) => {
    const rows = [];
    for (let i = 0; i < data.length; i += 2) {
      rows.push(data.slice(i, i + 2));
    }
    return rows;
  };
  
  return (
    <View style= {{ flex:1 }}>
    <ScrollView 
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.dark.primary}
        />
      }
    >
      <View style={[
        styles.listContent,
        photos.length === 0 && styles.listContentEmpty,
      ]}>
        {photos.length === 0 ? (
          renderEmptyState()
        ) : (
          createRows(photos).map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((item) => (
                <LibraryItem
                  key={item.id}
                  photo={item}
                  onPress={() => handlePhotoPress(item)}
                  onLongPress={() => handlePhotoLongPress(item)}
                />
              ))}
            </View>
          ))
        )}
      </View>
      </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.dark.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 6,
    letterSpacing: -0.5,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
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
  },
});

