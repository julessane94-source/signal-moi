import React, { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { COLORS, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../../config/env'
import { useAuth } from '../../context/AuthContext'
import PrimaryButton from '../../components/PrimaryButton'
import { checkBackendConnection } from '../../services/api'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen({ navigation }) {
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [connectionState, setConnectionState] = useState('idle')
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleConfigured = Boolean(
    GOOGLE_WEB_CLIENT_ID &&
    (Platform.OS !== 'android' || GOOGLE_ANDROID_CLIENT_ID) &&
    (Platform.OS !== 'ios' || GOOGLE_IOS_CLIENT_ID)
  )
  const safeAndroidClientId = GOOGLE_ANDROID_CLIENT_ID || 'disabled-android-client.apps.googleusercontent.com'
  const safeIosClientId = GOOGLE_IOS_CLIENT_ID || 'disabled-ios-client.apps.googleusercontent.com'

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: safeAndroidClientId,
    iosClientId: safeIosClientId,
    scopes: ['openid', 'profile', 'email']
  })

  useEffect(() => {
    async function completeGoogleLogin() {
      if (response?.type !== 'success') return
      const idToken = response.authentication?.idToken || response.params?.id_token
      if (!idToken) {
        Alert.alert('Google incomplet', 'Google n a pas renvoye de jeton id_token.')
        return
      }
      setGoogleLoading(true)
      try {
        await signInWithGoogle(idToken)
      } catch (error) {
        Alert.alert('Connexion Google impossible', error.response?.data?.message || 'Verifiez la configuration Google.')
      } finally {
        setGoogleLoading(false)
      }
    }
    completeGoogleLogin()
  }, [response])

  function handleGoogleLogin() {
    if (!googleConfigured) {
      Alert.alert(
        'Google a configurer',
        'Ajoutez EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID dans .env/eas.json pour Android. Le bouton est desactive pour eviter le crash.'
      )
      return
    }

    if (!request) {
      Alert.alert('Google en preparation', 'Reessayez dans quelques secondes.')
      return
    }

    promptAsync()
  }

  async function testConnection() {
    setConnectionState('loading')
    try {
      await checkBackendConnection()
      setConnectionState('online')
    } catch (error) {
      setConnectionState('offline')
      Alert.alert('Backend indisponible', 'Impossible de joindre https://signal-moi-api.onrender.com pour le moment.')
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Entrez votre email et votre mot de passe.')
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      Alert.alert('Connexion impossible', error.response?.data?.message || 'Verifiez vos informations.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>SM</Text>
        </View>
        <Text style={styles.title}>Signal Moi</Text>
        <Text style={styles.subtitle}>Alerter, suivre et intervenir depuis le terrain.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.connectionBox}>
          <View style={[styles.statusDot, connectionState === 'online' && styles.onlineDot, connectionState === 'offline' && styles.offlineDot]} />
          <Text style={styles.connectionText}>
            {connectionState === 'online'
              ? 'Backend Render connecte'
              : connectionState === 'offline'
                ? 'Backend Render inaccessible'
                : 'Backend Render pret a tester'}
          </Text>
          <Text onPress={testConnection} style={styles.testLink}>
            {connectionState === 'loading' ? 'Test...' : 'Tester'}
          </Text>
        </View>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#8a9a96"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#8a9a96"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
        <PrimaryButton title="Se connecter" onPress={handleLogin} loading={loading} />
        <PrimaryButton
          title="Continuer avec Google"
          onPress={handleGoogleLogin}
          loading={googleLoading}
          style={styles.googleButton}
        />
        <View style={styles.authLinks}>
          <Text onPress={() => navigation.navigate('Register')} style={styles.authLink}>Creer un compte</Text>
          <Text onPress={() => navigation.navigate('ForgotPassword')} style={styles.authLink}>Mot de passe oublie</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.soft,
    padding: 24,
    justifyContent: 'center'
  },
  brand: {
    marginBottom: 34
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900'
  },
  title: {
    color: COLORS.ink,
    fontSize: 36,
    fontWeight: '900'
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    marginTop: 8,
    lineHeight: 23
  },
  form: {
    gap: 14
  },
  connectionBox: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c4cbd0'
  },
  onlineDot: {
    backgroundColor: COLORS.primary
  },
  offlineDot: {
    backgroundColor: COLORS.danger
  },
  connectionText: {
    flex: 1,
    color: COLORS.muted,
    fontWeight: '700'
  },
  testLink: {
    color: COLORS.primary,
    fontWeight: '900'
  },
  authLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  authLink: {
    color: COLORS.primary,
    fontWeight: '900'
  },
  googleButton: {
    backgroundColor: '#1f2937'
  },
  input: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.ink
  }
})
