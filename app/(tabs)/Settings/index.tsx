import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Colors from '../../../constants/Colors';
import { getAllLUTs, deleteLUT, getAllEditedPhotos, deleteEditedPhoto } from '../../../lib/database';
import { deleteLUTFile, deleteThumbnail, deletePhotoFromLibrary } from '../../../lib/fileSystem';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllLUTs = () => {
    Alert.alert(
      'Clear All LUTs',
      'Are you sure you want to delete all LUTs? This will remove all imported filters from the app. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const luts = await getAllLUTs();
              
              // Delete all LUT files and database entries
              for (const lut of luts) {
                await deleteLUTFile(lut.path);
                if (lut.imagePath) {
                  await deleteLUTFile(lut.imagePath);
                }
                await deleteLUT(lut.id);
              }
              
              Alert.alert('Success', `${luts.length} LUT(s) deleted successfully`);
            } catch (error) {
              console.error('Error clearing LUTs:', error);
              Alert.alert('Error', 'Failed to clear LUTs');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleClearLibrary = () => {
    Alert.alert(
      'Clear Library',
      'Are you sure you want to delete all edited photos? This will remove all photos from your library. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const photos = await getAllEditedPhotos();
              
              // Delete all photos, thumbnails, and database entries
              for (const photo of photos) {
                await deleteThumbnail(photo.thumbnailUri);
                await deletePhotoFromLibrary(photo.photoUri);
                await deleteEditedPhoto(photo.id);
              }
              
              Alert.alert('Success', `${photos.length} photo(s) deleted successfully`);
            } catch (error) {
              console.error('Error clearing library:', error);
              Alert.alert('Error', 'Failed to clear library');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleExportSettings = () => {
    Alert.alert('Coming Soon', 'Export settings feature will be available in a future update.');
  };

  const handleImportSettings = () => {
    Alert.alert('Coming Soon', 'Import settings feature will be available in a future update.');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.content}>
          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>PREFERENCES</Text>
            <View style={styles.card}>
              <SettingsButton
                title="Clear All LUTs"
                onPress={handleClearAllLUTs}
                disabled={isClearing}
                destructive
              />
              <View style={styles.separator} />
              <SettingsButton
                title="Clear Library"
                onPress={handleClearLibrary}
                disabled={isClearing}
                destructive
              />
              <View style={styles.separator} />
              <SettingsButton
                title="Export Settings"
                onPress={handleExportSettings}
                disabled={isClearing}
              />
              <View style={styles.separator} />
              <SettingsButton
                title="Import Settings"
                onPress={handleImportSettings}
                disabled={isClearing}
              />
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ABOUT</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>App Name</Text>
                <Text style={styles.infoValue}>Lutify</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Version</Text>
                <Text style={styles.infoValue}>{APP_VERSION}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Developer</Text>
                <Text style={styles.infoValue}>Marios Papadakis</Text>
              </View>
            </View>
            <Text style={styles.description}>
              Lutify is a powerful photo editing app that lets you apply professional color grading to your photos using LUT (Look-Up Table) filters. Import your own LUTs and transform your photos with industry-standard color grading.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

interface SettingsButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

function SettingsButton({ title, onPress, disabled, destructive }: SettingsButtonProps) {
  return (
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <Text
        style={[
          styles.settingsButtonText,
          destructive && styles.destructiveText,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  settingsButton: {
    padding: 16,
    backgroundColor: Colors.dark.surface,
  },
  settingsButtonText: {
    fontSize: 15,
    color: Colors.dark.text,
    letterSpacing: -0.2,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  disabledText: {
    opacity: 0.4,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: Colors.dark.text,
    letterSpacing: -0.2,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginTop: 16,
    letterSpacing: -0.1,
  },
});

