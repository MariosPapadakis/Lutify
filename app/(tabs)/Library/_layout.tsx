import { Stack } from 'expo-router';
import Colors from '../../../constants/Colors';
import { Platform } from 'react-native';

const Layout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: '500',
          fontSize: 17,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.dark.background,
              },
              headerTransparent: Platform.OS === 'android' ? false : true,
              headerBlurEffect: 'regular',
        headerLargeStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Library',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
};

export default Layout;