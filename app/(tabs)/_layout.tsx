import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import Colors from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.dark.surface,
          borderTopColor: Colors.dark.border,
        },
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'LUTs',
          tabBarLabel: 'LUTs',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>📁</Text>
          ),
        }}
      />
    </Tabs>
  );
}

