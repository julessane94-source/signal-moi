import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'

const TOKEN_KEY = 'signal_moi_token'
const USER_KEY = 'signal_moi_user'
const OFFLINE_REPORTS_KEY = 'signal_moi_offline_reports'
const CACHE_PREFIX = 'signal_moi_cache_'
const OFFLINE_LOGIN_KEY = 'signal_moi_offline_login'

async function credentialsHash(email, password) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${String(email || '').trim().toLowerCase()}:${String(password || '')}`
  )
}

export async function saveSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token || ''],
    [USER_KEY, JSON.stringify(user || null)]
  ])
}

export async function getSession() {
  const [[, token], [, userRaw]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY])
  return {
    token,
    user: userRaw ? JSON.parse(userRaw) : null
  }
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, OFFLINE_LOGIN_KEY])
}

// Les identifiants ne sont jamais enregistrés en clair. Cette empreinte sert
// uniquement à déverrouiller une session déjà validée sur ce même téléphone.
export async function saveOfflineLogin(email, password) {
  const verifier = await credentialsHash(email, password)
  await AsyncStorage.setItem(OFFLINE_LOGIN_KEY, JSON.stringify({
    email: String(email || '').trim().toLowerCase(),
    verifier,
    savedAt: Date.now()
  }))
}

export async function getOfflineSession(email, password) {
  const [session, rawVerifier] = await Promise.all([
    getSession(),
    AsyncStorage.getItem(OFFLINE_LOGIN_KEY)
  ])
  if (!session.token || !session.user || !rawVerifier) return null
  try {
    const saved = JSON.parse(rawVerifier)
    const verifier = await credentialsHash(email, password)
    const sameEmail = saved.email === String(email || '').trim().toLowerCase()
    return sameEmail && saved.verifier === verifier ? session : null
  } catch {
    return null
  }
}

export async function getOfflineReports() {
  const raw = await AsyncStorage.getItem(OFFLINE_REPORTS_KEY)
  try {
    const reports = raw ? JSON.parse(raw) : []
    return Array.isArray(reports) ? reports : []
  } catch {
    return []
  }
}

export async function saveOfflineReports(reports) {
  await AsyncStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(reports || []))
}

export async function cacheData(key, value) {
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ value, savedAt: Date.now() }))
}

export async function getCachedData(key) {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`)
  try {
    return raw ? JSON.parse(raw)?.value ?? null : null
  } catch {
    return null
  }
}
