import Constants from 'expo-constants'

const isExpoGo = Constants.appOwnership === 'expo'
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

export async function scheduleLocalAlert(title, body) {
  const Notifications = await getNotifications()
  if (!Notifications) return false
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null
  })
  return true
}
