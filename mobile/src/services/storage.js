import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'signal_moi_token'
const USER_KEY = 'signal_moi_user'

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
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY])
}
