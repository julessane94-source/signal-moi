import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {}

export const API_URL = extra.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'https://signal-moi.sn/api'
export const SOCKET_URL = extra.socketUrl || process.env.EXPO_PUBLIC_SOCKET_URL || 'https://signal-moi.sn'
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ''
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ''
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''
export const ORANGE_MONEY_URL = process.env.EXPO_PUBLIC_ORANGE_MONEY_URL || ''
export const WAVE_MERCHANT_URL = process.env.EXPO_PUBLIC_WAVE_MERCHANT_URL || 'https://pay.wave.com/m/M_sn_WALm6CkqL2VK/c/sn/'

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
  primaryLight: '#ccfbf1',
  accent: '#f59e0b',
  accentSoft: '#fef3c7',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  ink: '#10201d',
  muted: '#667085',
  surface: '#ffffff',
  soft: '#f0fdfa',
  border: '#d8e6e2',
  police: '#2563eb',
  policeSoft: '#eff6ff'
}
