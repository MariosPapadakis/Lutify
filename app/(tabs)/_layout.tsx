import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import Colors from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.text,
        tabBarInactiveTintColor: Colors.dark.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.dark.background,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
        },
        // headerStyle: {
        //   backgroundColor: Colors.dark.background,
        //   borderBottomWidth: 1,
        //   borderBottomColor: Colors.dark.border,
        // },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '500',
          fontSize: 17,
          letterSpacing: -0.2,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 11, color, fontWeight: '500' }}>■</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="Library"
        options={{
          headerShown: false,
          tabBarLabel: 'Library',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 11, color, fontWeight: '500' }}>⊞</Text>
          ),
        }}
      />
    </Tabs>
  );
}

