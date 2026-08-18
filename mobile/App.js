import React, { useEffect } from 'react'
import { Alert, Linking } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { LocationProvider } from './src/context/LocationContext'
import AppNavigator from './src/navigation/AppNavigator'
import AppErrorBoundary from './src/components/AppErrorBoundary'
import { getSiteConfig } from './src/services/api'
import { requestNotificationsOnFirstUse } from './src/services/mobileNotifications'

function MobileUpdateNotice() {
  useEffect(() => {
    getSiteConfig()
      .then((config) => {
        const release = config?.mobile_release || config?.mobileRelease
        const installedVersion = Constants.expoConfig?.version
        if (!release?.version || !installedVersion || release.version === installedVersion) return
        Alert.alert(
          'Mise à jour disponible',
          release.notes || 'Une nouvelle version de Signal-Moi est disponible.',
          [
            { text: 'Plus tard', style: 'cancel' },
            { text: 'Télécharger', onPress: () => {
              const url = release.apkUrl?.startsWith('/') ? `https://signal-moi.sn${release.apkUrl}` : (release.apkUrl || 'https://signal-moi.sn/downloads/signal-moi.apk')
              Linking.openURL(url).catch(() => {})
            } }
          ]
        )
      })
      .catch(() => {})
  }, [])
  return null
}

function FirstUseNotifications() {
  useEffect(() => {
    requestNotificationsOnFirstUse().catch(() => {})
  }, [])
  return null
}

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <FirstUseNotifications />
              <MobileUpdateNotice />
              <AppNavigator />
            </NavigationContainer>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  )
}
