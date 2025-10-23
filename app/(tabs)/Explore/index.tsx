import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Symbol from '../../../components/Symbol';
import Colors from '../../../constants/Colors';

export default function ExploreScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.content}>
          <View style={styles.placeholderContainer}>
            <Symbol 
              name="magnifyingglass.circle.fill" 
              size={64}
              tintColor={Colors.dark.primary}
              type="hierarchical"
              style={styles.icon}
              fallback={<Text style={styles.iconText}>🔍</Text>}
            />
            <Text style={styles.title}>Coming Soon</Text>
            <Text style={styles.description}>
              Discover trending LUTs, presets, and filters.{'\n'}
              Explore curated collections and find inspiration for your next edit.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 8,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  icon: {
    marginBottom: 24,
  },
  iconText: {
    fontSize: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    letterSpacing: -0.2,
  },
});

