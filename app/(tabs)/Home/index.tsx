import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import Colors from '../../../constants/Colors';

export default function HomeScreen() {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [after, setAfter] = useState<string | undefined>(undefined);
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  const PHOTOS_PER_BATCH = 50;
  
  const loadPhotos = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    
    try {
      setLoading(true);
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library access to view your photos');
        setInitialLoading(false);
        return;
      }
      
      // Fetch photos from media library
      const result = await MediaLibrary.getAssetsAsync({
        first: PHOTOS_PER_BATCH,
        after: reset ? undefined : after,
        mediaType: 'photo',
        sortBy: [MediaLibrary.SortBy.creationTime],
      });
      
      if (reset) {
        setPhotos(result.assets);
      } else {
        setPhotos(prev => [...prev, ...result.assets]);
      }
      
      setHasMore(result.hasNextPage);
      setAfter(result.endCursor);
      setInitialLoading(false);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
      setInitialLoading(false);
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      loadPhotos(true);
    }, [])
  );
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPhotos(false);
    }
  };
  
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 500;
    
    if (isCloseToBottom) {
      handleLoadMore();
    }
  };
  
  const handlePhotoPress = async (asset: MediaLibrary.Asset) => {
    try {
      setLoading(true);
      
      // Convert all images to PNG for consistent processing and Skia compatibility
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
  
  // Helper function to create rows of 3 items
  const createRows = (data: MediaLibrary.Asset[]) => {
    const rows = [];
    for (let i = 0; i < data.length; i += 3) {
      rows.push(data.slice(i, i + 3));
    }
    return rows;
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Photos</Text>
      <Text style={styles.emptyText}>
        No photos found in your library
      </Text>
    </View>
  );
  
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }
  
  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <View style={styles.gridContent}>
          {photos.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {createRows(photos).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {row.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.gridItem,
                        { width: (width - 4) / 3, height: (width - 4) / 3 }
                      ]}
                      onPress={() => handlePhotoPress(item)}
                      activeOpacity={0.7}
                    >
                      <Image 
                        source={{ uri: item.uri }} 
                        style={styles.gridImage}
                        contentFit="cover"
                        transition={200}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              {loading && hasMore && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                </View>
              )}
            </>
          )}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },
  gridItem: {
    backgroundColor: Colors.dark.background,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 24,
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

