import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { COLORS } from '../../config/env'
import PrimaryButton from '../../components/PrimaryButton'
import ScreenHeader from '../../components/ScreenHeader'
import { forgotPassword, resetPassword, verifyResetCode } from '../../services/api'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState('email')
  const [loading, setLoading] = useState(false)

  async function sendCode() {
    setLoading(true)
    try {
      await forgotPassword(email)
      setStep('code')
      Alert.alert('Code envoye', 'Consultez votre email.')
    } catch (error) {
      Alert.alert('Envoi impossible', error.response?.data?.message || 'Verifiez votre email.')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    setLoading(true)
    try {
      await verifyResetCode(email, code)
      setStep('password')
    } catch (error) {
      Alert.alert('Code incorrect', error.response?.data?.message || 'Verifiez le code recu.')
    } finally {
      setLoading(false)
    }
  }

  async function changePassword() {
    setLoading(true)
    try {
      await resetPassword(email, code, password)
      Alert.alert('Mot de passe modifie', 'Vous pouvez vous connecter.')
      navigation.goBack()
    } catch (error) {
      Alert.alert('Modification impossible', error.response?.data?.message || 'Reessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Mot de passe oublie" subtitle="Recuperation par email" />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      {step !== 'email' ? (
        <TextInput value={code} onChangeText={setCode} placeholder="code recu" keyboardType="number-pad" style={styles.input} />
      ) : null}
      {step === 'password' ? (
        <TextInput value={password} onChangeText={setPassword} placeholder="nouveau mot de passe" secureTextEntry style={styles.input} />
      ) : null}
      <PrimaryButton
        title={step === 'email' ? 'Envoyer le code' : step === 'code' ? 'Verifier le code' : 'Changer le mot de passe'}
        onPress={step === 'email' ? sendCode : step === 'code' ? verifyCode : changePassword}
        loading={loading}
      />
      <Text onPress={() => navigation.goBack()} style={styles.link}>Retour connexion</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  content: { gap: 12, paddingBottom: 32 },
  input: {
    marginHorizontal: 20,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 16
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '900'
  }
})
