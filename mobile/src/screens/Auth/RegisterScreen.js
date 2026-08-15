import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { COLORS } from '../../config/env'
import PrimaryButton from '../../components/PrimaryButton'
import ScreenHeader from '../../components/ScreenHeader'
import { register } from '../../services/api'

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', password: '' })
  const [loading, setLoading] = useState(false)

  function setValue(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    if (!form.email || !form.password || !form.telephone) {
      Alert.alert('Champs requis', 'Email, telephone et mot de passe sont obligatoires.')
      return
    }

    setLoading(true)
    try {
      await register({ ...form, role: 'citoyen' })
      Alert.alert('Compte cree', 'Vous pouvez maintenant vous connecter.')
      navigation.goBack()
    } catch (error) {
      Alert.alert('Inscription impossible', error.response?.data?.message || 'Verifiez les informations.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Creer un compte" subtitle="Compte citoyen Signal Moi" />
      {['prenom', 'nom', 'email', 'telephone'].map((key) => (
        <TextInput
          key={key}
          value={form[key]}
          onChangeText={(value) => setValue(key, value)}
          placeholder={key}
          autoCapitalize={key === 'email' ? 'none' : 'sentences'}
          keyboardType={key === 'email' ? 'email-address' : key === 'telephone' ? 'phone-pad' : 'default'}
          style={styles.input}
        />
      ))}
      <TextInput
        value={form.password}
        onChangeText={(value) => setValue('password', value)}
        placeholder="mot de passe"
        secureTextEntry
        style={styles.input}
      />
      <PrimaryButton title="S inscrire" onPress={submit} loading={loading} />
      <Text onPress={() => navigation.goBack()} style={styles.link}>J ai deja un compte</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbfa'
  },
  content: {
    paddingBottom: 32,
    gap: 12
  },
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
    fontWeight: '900',
    marginTop: 6
  }
})
