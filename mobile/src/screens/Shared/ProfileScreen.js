import React from 'react'
import { Alert, Linking, StyleSheet, Text, View } from 'react-native'
import { COLORS, ORANGE_MONEY_URL } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { useAuth } from '../../context/AuthContext'

const WAVE_URL = 'https://pay.wave.com/m/M_sn_WALm6CkqL2VK/c/sn/'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  async function openWave() {
    const supported = await Linking.canOpenURL(WAVE_URL)
    if (supported) Linking.openURL(WAVE_URL)
    else Alert.alert('Wave indisponible', 'Impossible d ouvrir le lien Wave sur ce telephone.')
  }

  function openOrange() {
    if (ORANGE_MONEY_URL) {
      Linking.openURL(ORANGE_MONEY_URL)
      return
    }
    Alert.alert(
      'Orange Money a configurer',
      'Ajoutez EXPO_PUBLIC_ORANGE_MONEY_URL si vous avez un lien marchand, ou connectez une route backend Orange Money pour garder les secrets API cote serveur.'
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Compte" subtitle={user?.role || 'utilisateur'} />
      <View style={styles.card}>
        <Text style={styles.name}>{user?.prenom || user?.name || 'Utilisateur'} {user?.nom || ''}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.telephone}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Soutenir Signal Moi</Text>
        <PrimaryButton title="Payer avec Wave" onPress={openWave} />
        <PrimaryButton title="Orange Money" onPress={openOrange} />
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Se deconnecter" tone="danger" onPress={signOut} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  card: { marginHorizontal: 20, marginBottom: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10 },
  name: { color: COLORS.ink, fontSize: 20, fontWeight: '900' },
  meta: { color: COLORS.muted },
  section: { color: COLORS.ink, fontSize: 18, fontWeight: '900' },
  actions: { paddingHorizontal: 20, marginTop: 'auto', paddingBottom: 30 }
})
