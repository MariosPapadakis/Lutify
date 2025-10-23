import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Symbol from './Symbol';
import { LUT } from '../lib/database';
import Colors from '../constants/Colors';

interface LUTListItemProps {
  lut: LUT;
  onPress: () => void;
  onDelete: () => void;
  onRename?: () => void;
}

export default function LUTListItem({ lut, onPress, onDelete, onRename }: LUTListItemProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete LUT',
      `Are you sure you want to delete "${lut.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {lut.name}
        </Text>
        <View style={styles.details}>
          <Text style={styles.detailText}>Size: {lut.size}³</Text>
          <Text style={styles.detailText}>•</Text>
          <Text style={styles.detailText}>{formatDate(lut.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {onRename && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRename}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Symbol 
              name="pencil" 
              size={18}
              tintColor={Colors.dark.textSecondary}
              fallback={<Text style={styles.actionIcon}>✎</Text>}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Symbol 
            name="xmark" 
            size={20}
            tintColor={Colors.dark.textSecondary}
            fallback={<Text style={styles.deleteIcon}>×</Text>}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 20,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    letterSpacing: -0.1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
    color: Colors.dark.textSecondary,
    fontWeight: '400',
  },
  deleteIcon: {
    fontSize: 24,
    color: Colors.dark.textSecondary,
    fontWeight: '300',
  },
});


