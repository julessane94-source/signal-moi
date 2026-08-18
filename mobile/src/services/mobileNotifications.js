import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AccessibilityInfo } from 'react-native'

const isExpoGo = Constants.appOwnership === 'expo'
const FIRST_USE_PERMISSION_KEY = 'signal_moi_notifications_first_use_asked'
let notificationsModule = null

async function getNotifications() {
  if (isExpoGo) return null
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications')
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
      })
    })
  }
  return notificationsModule
}

export async function requestLocalAlerts() {
  const Notifications = await getNotifications()
  if (!Notifications) return false
  const permission = await Notifications.requestPermissionsAsync()
  return permission.granted || permission.status === 'granted'
}

export async function requestNotificationsOnFirstUse() {
  const alreadyAsked = await AsyncStorage.getItem(FIRST_USE_PERMISSION_KEY)
  if (alreadyAsked) return false

  const Notifications = await getNotifications()
  if (!Notifications) return false
  const current = await Notifications.getPermissionsAsync()
  let granted = current.granted || current.status === 'granted'
  if (!granted && current.canAskAgain !== false) {
    const requested = await Notifications.requestPermissionsAsync()
    granted = requested.granted || requested.status === 'granted'
  }
  await AsyncStorage.setItem(FIRST_USE_PERMISSION_KEY, '1')

  if (granted) {
    // Utilise la voix système du téléphone lorsqu'un lecteur d'écran est actif.
    // Cette confirmation reste accessible et ne dépend pas du réseau.
    AccessibilityInfo.announceForAccessibility('Les notifications Signal Moi sont activées.')
  }
  return granted
}

export async function scheduleLocalAlert(title, body) {
  const Notifications = await getNotifications()
  if (!Notifications) return false
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null
  })
  return true
}
