import React, { useEffect } from 'react';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import OfflineScreen from './src/screens/OfflineScreen';
import OnlineScreen from './src/screens/OnlineScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { StorageProvider } from './src/context/StorageContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import backgroundService from './src/services/backgroundService';

const Tab = createBottomTabNavigator();

const AppContent = () => {
  const { theme, isDarkMode } = useTheme();
  
  useEffect(() => {
    backgroundService.start();
    return () => backgroundService.stop();
  }, []);
  
  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />
      <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
          },
          headerShown: false,
        }}>
          <Tab.Screen 
            name="Offline" 
            component={OfflineScreen}
            options={{
              tabBarLabel: 'Offline',
              tabBarIcon: () => <Text style={{fontSize: 20}}>🎙️</Text>,
            }}
          />
          <Tab.Screen 
            name="Online" 
            component={OnlineScreen}
            options={{
              tabBarLabel: 'Online',
              tabBarIcon: () => <Text style={{fontSize: 20}}>☁️</Text>,
            }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              tabBarIcon: () => <Text style={{fontSize: 20}}>⚙️</Text>,
            }}
          />
        </Tab.Navigator>
        </NavigationContainer>
    </SafeAreaProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <StorageProvider>
        <AppContent />
      </StorageProvider>
    </ThemeProvider>
  );
}

export default App;
