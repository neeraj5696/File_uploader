import React from 'react';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import screens
import OfflineScreen from './src/screens/OfflineScreen';
import OnlineScreen from './src/screens/OnlineScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { StorageProvider } from './src/context/StorageContext';

const Tab = createBottomTabNavigator();

function App() {
  return (
    <StorageProvider>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#E5E5EA',
            },
            headerShown: false,
          }}>
          <Tab.Screen 
            name="Offline" 
            component={OfflineScreen}
            options={{
              tabBarLabel: 'Offline',
              tabBarIcon: () => <Text style={{fontSize: 20}}>📱</Text>,
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
    </StorageProvider>
  );
}

export default App;
