import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import Symbol from '../../components/Symbol';
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
        animation: 'shift'
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          headerShown: false,
          tabBarLabel: 'Library',
          tabBarIcon: ({ color }) => (
            <Symbol 
              name="photo.on.rectangle" 
              size={22}
              tintColor={color}
              fallback={<Text style={{ fontSize: 11, color, fontWeight: '500' }}>📷</Text>}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Explore"
        options={{
          headerShown: false,
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => (
            <Symbol 
              name="sparkles" 
              size={22}
              tintColor={color}
              fallback={<Text style={{ fontSize: 11, color, fontWeight: '500' }}>◉</Text>}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Library"
        options={{
          headerShown: false,
          tabBarLabel: 'LUTed',
          tabBarIcon: ({ color }) => (
            <Symbol 
              name="photo.badge.checkmark.fill" 
              size={22}
              tintColor={color}
              fallback={<Text style={{ fontSize: 11, color, fontWeight: '500' }}>✓</Text>}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          headerShown: false,
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Symbol 
              name="gearshape.fill" 
              size={22}
              tintColor={color}
              fallback={<Text style={{ fontSize: 11, color, fontWeight: '500' }}>⚙</Text>}
            />
          ),
        }}
      />
    </Tabs>
  );
}

