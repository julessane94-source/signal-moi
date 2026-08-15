import React, { useState } from 'react'
import { Alert, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { COLORS, WAVE_MERCHANT_URL } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { useAuth } from '../../context/AuthContext'

const MAXIT_PACKAGE_INTENT = 'intent:#Intent;package=com.orange.myorange.osn;end'
const WAVE_PACKAGE_INTENT = 'intent:#Intent;package=com.wave.personal;end'
const MAXIT_DOWNLOAD_URL = 'https://onelink.to/6h78t2'

async function tryOpenExternal(url) {
  try {
    await Linking.openURL(url)
    return true
  } catch (error) {}
  return false
}

async function openExternal(url, unavailable) {
  if (await tryOpenExternal(url)) return true
  Alert.alert('Paiement indisponible', unavailable)
  return false
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [amount, setAmount] = useState('10000')

  const numericAmount = Math.max(1, Number(String(amount).replace(/\D/g, '')) || 10000)

  async function openWave() {
    if (await tryOpenExternal(WAVE_MERCHANT_URL)) return
    if (Platform.OS === 'android' && await tryOpenExternal(WAVE_PACKAGE_INTENT)) return
    Alert.alert('Wave indisponible', 'Installez Wave ou vérifiez le lien marchand avant de réessayer.')
  }

  async function openOrange() {
    const opened = Platform.OS === 'android'
      ? await tryOpenExternal(MAXIT_PACKAGE_INTENT)
      : false
    if (!opened) await openExternal(MAXIT_DOWNLOAD_URL, 'Installez Max it pour accéder à Orange Money.')
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Compte" subtitle={user?.role || 'utilisateur'} />
      <View style={styles.card}>
        <Text style={styles.name}>{user?.prenom || user?.name || 'Utilisateur'} {user?.nom || ''}</Text>
        <Text style={styles.meta}>{user?.email || 'Email non renseigné'}</Text>
        <Text style={styles.meta}>{user?.telephone || 'Téléphone non renseigné'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Soutenir Signal Moi</Text>
        <Text style={styles.help}>Choisissez un montant en FCFA, puis ouvrez votre moyen de paiement.</Text>
        <View style={styles.amountRow}>
          {[2000, 5000, 10000, 25000].map((value) => <PrimaryButton key={value} title={`${value / 1000}k`} onPress={() => setAmount(String(value))} style={[styles.amountButton, numericAmount === value && styles.amountActive]} />)}
        </View>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Montant FCFA" style={styles.input} />
        <PrimaryButton title={`Payer ${numericAmount.toLocaleString('fr-FR')} FCFA avec Wave`} onPress={openWave} />
        <PrimaryButton title="Ouvrir Max it pour payer avec Orange Money" onPress={openOrange} style={styles.orangeButton} />
        <Text style={styles.reference}>Référence conseillée : Signal‑Moi + votre nom ou téléphone.</Text>
      </View>
      <View style={styles.actions}><PrimaryButton title="Se déconnecter" tone="danger" onPress={signOut} /></View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  card: { marginHorizontal: 20, marginBottom: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10 },
  name: { color: COLORS.ink, fontSize: 20, fontWeight: '900' }, meta: { color: COLORS.muted }, section: { color: COLORS.ink, fontSize: 18, fontWeight: '900' }, help: { color: COLORS.muted, lineHeight: 20 },
  amountRow: { flexDirection: 'row', gap: 7 }, amountButton: { flex: 1, minHeight: 42, paddingHorizontal: 4 }, amountActive: { backgroundColor: COLORS.primaryDark }, input: { minHeight: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, paddingHorizontal: 12, color: COLORS.ink, backgroundColor: '#f7fbfa' }, orangeButton: { backgroundColor: '#ea580c' }, reference: { color: COLORS.muted, fontSize: 12, lineHeight: 18 }, actions: { paddingHorizontal: 20, marginTop: 'auto', paddingBottom: 30 }
})
