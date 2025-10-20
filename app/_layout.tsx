import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { initDatabase, getAllLUTs } from '../lib/database';
import { initFileSystem, cleanupOrphanedFiles } from '../lib/fileSystem';
import Colors from '../constants/Colors';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize database
        await initDatabase();
        console.log('Database initialized');
        
        // Initialize file system
        await initFileSystem();
        console.log('File system initialized');
        
        // Clean up orphaned files
        const luts = await getAllLUTs();
        const validPaths = luts.map(lut => lut.path);
        await cleanupOrphanedFiles(validPaths);
        console.log('Cleanup completed');
        
        setIsReady(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
      }
    }
    
    initialize();
  }, []);
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }
  
  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Initializing LUTify...</Text>
      </View>
    );
  }
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: Colors.dark.background,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="editor"
        options={{
          title: 'Editor',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.dark.error,
    textAlign: 'center',
  },
});


