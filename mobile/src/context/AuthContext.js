import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { getMe, login as loginRequest, loginWithGoogle } from '../services/api'
import { clearSession, getSession, saveSession } from '../services/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function bootstrap() {
      try {
        const session = await getSession()
        if (!mounted) return
        setToken(session.token)
        setUser(session.user)

        if (session.token) {
          const fresh = await getMe()
          const nextUser = fresh.user || fresh
          setUser(nextUser)
          await saveSession(session.token, nextUser)
        }
      } catch (error) {
        await clearSession()
      } finally {
        if (mounted) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      mounted = false
    }
  }, [])

  async function signIn(email, password) {
    const result = await loginRequest(email.trim(), password)
    const nextToken = result.token || result.accessToken
    const nextUser = result.user || result.data?.user

    if (!nextToken || !nextUser) {
      Alert.alert('Connexion impossible', 'Le serveur n a pas renvoye une session valide.')
      return false
    }

    await saveSession(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
    return true
  }

  async function signInWithGoogle(idToken) {
    const result = await loginWithGoogle(idToken)
    const nextToken = result.token || result.accessToken
    const nextUser = result.user || result.data?.user

    if (!nextToken || !nextUser) {
      Alert.alert('Connexion Google impossible', 'Le serveur n a pas renvoye une session valide.')
      return false
    }

    await saveSession(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
    return true
  }

  async function signOut() {
    await clearSession()
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      loading,
      token,
      user,
      isAuthenticated: Boolean(token),
      signIn,
      signInWithGoogle,
      signOut
    }),
    [loading, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
