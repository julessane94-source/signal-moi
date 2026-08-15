import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {}

export const API_URL = extra.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'https://signal-moi.sn/api'
export const SOCKET_URL = extra.socketUrl || process.env.EXPO_PUBLIC_SOCKET_URL || 'https://signal-moi.sn'
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ''
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ''
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''
export const ORANGE_MONEY_URL = process.env.EXPO_PUBLIC_ORANGE_MONEY_URL || ''

export function resolveMediaUrl(url) {
  if (!url) return null
  const value = String(url)
  if (value.startsWith('data:') || value.startsWith('http')) return value
  if (value.startsWith('/')) return `${API_ORIGIN}${value}`
  return `${API_ORIGIN}/${value}`
}

export const COLORS = {
  primary: '#0f766e',
  primaryDark: '#134e4a',
  accent: '#f59e0b',
  danger: '#dc2626',
  ink: '#10201d',
  muted: '#667085',
  surface: '#ffffff',
  soft: '#edf7f5',
  border: '#d9e7e3',
  police: '#1d4ed8'
}
