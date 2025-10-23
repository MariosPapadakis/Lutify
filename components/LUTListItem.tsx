import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LUT } from '../lib/database';
import Colors from '../constants/Colors';

interface LUTListItemProps {
  lut: LUT;
  onPress: () => void;
  onDelete: () => void;
}

export default function LUTListItem({ lut, onPress, onDelete }: LUTListItemProps) {
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
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.6}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
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
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  deleteIcon: {
    fontSize: 24,
    color: Colors.dark.textSecondary,
    fontWeight: '300',
  },
});


