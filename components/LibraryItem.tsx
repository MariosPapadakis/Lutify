import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Symbol from './Symbol';
import { EditedPhoto } from '../lib/database';
import Colors from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_MARGIN = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - 48 - ITEM_MARGIN) / 2; // 2 columns with padding

interface LibraryItemProps {
  photo: EditedPhoto;
  onPress: () => void;
  onLongPress: () => void;
}

export default function LibraryItem({ photo, onPress, onLongPress }: LibraryItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: photo.thumbnailUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {photo.isExported === 1 && (
          <View style={styles.exportBadge}>
            <Symbol 
              name="square.and.arrow.up.fill" 
              size={14}
              tintColor={Colors.dark.text}
              fallback={<Text style={styles.exportIcon}>↗</Text>}
            />
          </View>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {photo.name}
        </Text>
        {photo.lutName && (
          <Text style={styles.lutName} numberOfLines={1}>
            {photo.lutName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    backgroundColor: Colors.dark.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  exportBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportIcon: {
    fontSize: 12,
    color: Colors.dark.text,
  },
  info: {
    marginTop: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  lutName: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    letterSpacing: -0.1,
  },
});

