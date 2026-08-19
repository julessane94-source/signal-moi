import React, { useState } from 'react'
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
  const role = String(user?.role || 'citoyen').toLowerCase()
  const roleLabel = role.includes('admin') ? 'Administration' : role.includes('collabor') ? 'Collaboration citoyenne' : role.includes('commissariat') || role.includes('police') ? 'Forces de l’ordre' : 'Citoyen'

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
        <View style={styles.roleBadge}><Ionicons name="shield-checkmark" size={15} color={COLORS.primary} /><Text style={styles.roleText}>{roleLabel}</Text></View>
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Mon compte en sécurité</Text>
        <AccountRow icon="lock-closed" title="Session protégée" text="Votre espace est réservé à votre compte connecté." />
        <AccountRow icon="eye-off" title="Confidentialité" text="Un signalement anonyme masque votre identité dans le dossier partagé." />
        <Pressable onPress={() => Alert.alert('Aide Signal‑Moi', 'Pour modifier vos informations ou récupérer un accès, utilisez la page de connexion ou contactez l’équipe Signal‑Moi.')} style={styles.helpButton}>
          <Ionicons name="help-circle" size={19} color={COLORS.primary} /><Text style={styles.helpButtonText}>Aide et accès au compte</Text><Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </Pressable>
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
  roleBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: COLORS.soft, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, roleText: { color: COLORS.primary, fontSize: 12, fontWeight: '900' },
  accountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 }, accountIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' }, accountTitle: { color: COLORS.ink, fontWeight: '900' }, accountText: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  helpButton: { minHeight: 46, borderRadius: 13, backgroundColor: '#effcf7', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, helpButtonText: { flex: 1, color: COLORS.primary, fontWeight: '900' },
  amountRow: { flexDirection: 'row', gap: 7 }, amountButton: { flex: 1, minHeight: 42, paddingHorizontal: 4 }, amountActive: { backgroundColor: COLORS.primaryDark }, input: { minHeight: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, paddingHorizontal: 12, color: COLORS.ink, backgroundColor: '#f7fbfa' }, orangeButton: { backgroundColor: '#ea580c' }, reference: { color: COLORS.muted, fontSize: 12, lineHeight: 18 }, actions: { paddingHorizontal: 20, marginTop: 'auto', paddingBottom: 30 }
})

function AccountRow({ icon, title, text }) {
  return <View style={styles.accountRow}><View style={styles.accountIcon}><Ionicons name={icon} size={17} color={COLORS.primary} /></View><View style={{ flex: 1 }}><Text style={styles.accountTitle}>{title}</Text><Text style={styles.accountText}>{text}</Text></View></View>
}
