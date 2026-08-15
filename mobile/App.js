import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { LocationProvider } from './src/context/LocationContext'
import AppNavigator from './src/navigation/AppNavigator'
import AppErrorBoundary from './src/components/AppErrorBoundary'

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  )
}
