import React, { useState } from 'react'
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, WAVE_MERCHANT_URL } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { updateProfile } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const MAXIT_PACKAGE_INTENT = 'intent:#Intent;package=com.orange.myorange.osn;end'
const WAVE_PACKAGE_INTENT = 'intent:#Intent;package=com.wave.personal;end'
const MAXIT_DOWNLOAD_URL = 'https://onelink.to/6h78t2'
const tryOpen = async (url) => { try { await Linking.openURL(url); return true } catch { return false } }

export default function ProfileScreen({ navigation }) {
  const { user, signOut, updateCurrentUser } = useAuth()
  const [amount, setAmount] = useState('10000')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ prenom: user?.prenom || user?.name || '', nom: user?.nom || '', telephone: user?.telephone || '', ville: user?.ville || '', quartier: user?.quartier || '' })
  const role = String(user?.role || 'citoyen').toLowerCase()
  const roleLabel = role.includes('admin') ? 'Administration' : role.includes('collabor') ? 'Collaboration citoyenne' : role.includes('commissariat') || role.includes('police') ? 'Forces de l’ordre' : 'Citoyen'
  const numericAmount = Math.max(1, Number(String(amount).replace(/\D/g, '')) || 10000)
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  const openRoot = (screen) => { let current = navigation; while (current?.getParent?.()) current = current.getParent(); current?.navigate?.(screen) }

  async function saveProfile() {
    setSaving(true)
    try {
      const result = await updateProfile(form)
      await updateCurrentUser(result.user || form)
      setEditing(false)
      Alert.alert('Profil mis à jour', 'Vos informations sont maintenant enregistrées.')
    } catch (error) {
      Alert.alert('Mise à jour impossible', error.response?.data?.message || 'Vérifiez votre connexion puis réessayez.')
    } finally { setSaving(false) }
  }

  async function openWave() {
    if (await tryOpen(WAVE_MERCHANT_URL)) return
    if (Platform.OS === 'android' && await tryOpen(WAVE_PACKAGE_INTENT)) return
    Alert.alert('Wave indisponible', 'Installez Wave ou vérifiez le lien marchand avant de réessayer.')
  }
  async function openOrange() {
    if (Platform.OS === 'android' && await tryOpen(MAXIT_PACKAGE_INTENT)) return
    if (!(await tryOpen(MAXIT_DOWNLOAD_URL))) Alert.alert('Orange Money indisponible', 'Installez Max it pour accéder à Orange Money.')
  }

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <ScreenHeader title="Compte" subtitle={roleLabel} />
    <View style={styles.card}>
      <View style={styles.profileTop}><View style={styles.avatar}><Ionicons name="person" size={28} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.name}>{user?.prenom || user?.name || 'Utilisateur'} {user?.nom || ''}</Text><Text style={styles.meta}>{user?.email || 'Email non renseigné'}</Text></View></View>
      <View style={styles.roleBadge}><Ionicons name="shield-checkmark" size={15} color={COLORS.primary} /><Text style={styles.roleText}>{roleLabel}</Text></View>
      {!editing ? <Pressable onPress={() => setEditing(true)} style={styles.editButton}><Ionicons name="create-outline" size={18} color={COLORS.primary} /><Text style={styles.editText}>Modifier mes informations</Text></Pressable> : <>
        <ProfileField label="Prénom" value={form.prenom} onChangeText={(value) => update('prenom', value)} />
        <ProfileField label="Nom" value={form.nom} onChangeText={(value) => update('nom', value)} />
        <ProfileField label="Téléphone" value={form.telephone} keyboardType="phone-pad" onChangeText={(value) => update('telephone', value)} />
        <ProfileField label="Ville" value={form.ville} onChangeText={(value) => update('ville', value)} />
        <ProfileField label="Quartier" value={form.quartier} onChangeText={(value) => update('quartier', value)} />
        <PrimaryButton title="Enregistrer mes informations" onPress={saveProfile} loading={saving} /><Pressable onPress={() => setEditing(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Annuler</Text></Pressable>
      </>}
    </View>
    <View style={styles.card}>
      <Text style={styles.section}>Mon compte en sécurité</Text>
      <AccountRow icon="lock-closed" title="Session protégée" text="Votre espace est réservé à votre compte connecté." />
      <AccountRow icon="eye-off" title="Confidentialité" text="Un signalement anonyme masque votre identité dans le dossier partagé." />
      <AccountLink icon="document-text-outline" label="Politique de confidentialité" onPress={() => openRoot('Privacy')} />
      {role === 'citoyen' ? <AccountLink icon="shield-checkmark" label="Guide : déposer une plainte" onPress={() => openRoot('ComplaintGuide')} /> : null}
      <AccountLink icon="help-circle" label="Aide et accès au compte" onPress={() => Alert.alert('Aide Signal‑Moi', 'Pour récupérer un accès, utilisez « Mot de passe oublié » sur la page de connexion. Pour une urgence, contactez les services locaux sans attendre une réponse dans l’application.')} />
    </View>
    <View style={styles.card}>
      <Text style={styles.section}>Soutenir Signal Moi</Text><Text style={styles.help}>Choisissez un montant en FCFA, puis ouvrez votre moyen de paiement.</Text>
      <View style={styles.amountRow}>{[2000, 5000, 10000, 25000].map((value) => <PrimaryButton key={value} title={`${value / 1000}k`} onPress={() => setAmount(String(value))} style={[styles.amountButton, numericAmount === value && styles.amountActive]} />)}</View>
      <TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Montant FCFA" style={styles.input} />
      <PrimaryButton title={`Payer ${numericAmount.toLocaleString('fr-FR')} FCFA avec Wave`} onPress={openWave} /><PrimaryButton title="Ouvrir Max it pour payer avec Orange Money" onPress={openOrange} style={styles.orangeButton} />
    </View>
    <View style={styles.actions}><PrimaryButton title="Se déconnecter" tone="danger" onPress={signOut} /></View>
  </ScrollView>
}

function ProfileField({ label, ...props }) { return <View><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.input} placeholderTextColor="#8a9a96" {...props} /></View> }
function AccountRow({ icon, title, text }) { return <View style={styles.accountRow}><View style={styles.accountIcon}><Ionicons name={icon} size={17} color={COLORS.primary} /></View><View style={{ flex: 1 }}><Text style={styles.accountTitle}>{title}</Text><Text style={styles.accountText}>{text}</Text></View></View> }
function AccountLink({ icon, label, onPress }) { return <Pressable onPress={onPress} style={styles.helpButton}><Ionicons name={icon} size={19} color={COLORS.primary} /><Text style={styles.helpButtonText}>{label}</Text><Ionicons name="chevron-forward" size={18} color={COLORS.primary} /></Pressable> }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' }, content: { paddingBottom: 34 }, card: { marginHorizontal: 20, marginBottom: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, avatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, name: { color: COLORS.ink, fontSize: 20, fontWeight: '900' }, meta: { color: COLORS.muted, marginTop: 2 }, section: { color: COLORS.ink, fontSize: 18, fontWeight: '900' }, help: { color: COLORS.muted, lineHeight: 20 },
  roleBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: COLORS.soft, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, roleText: { color: COLORS.primary, fontSize: 12, fontWeight: '900' }, editButton: { minHeight: 44, borderRadius: 13, backgroundColor: COLORS.soft, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, editText: { color: COLORS.primary, fontWeight: '900' }, fieldLabel: { color: COLORS.ink, fontWeight: '800', marginBottom: 5 }, input: { minHeight: 48, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, paddingHorizontal: 12, color: COLORS.ink, backgroundColor: '#f7fbfa' }, cancelButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: COLORS.muted, fontWeight: '800' },
  accountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 }, accountIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: COLORS.soft, alignItems: 'center', justifyContent: 'center' }, accountTitle: { color: COLORS.ink, fontWeight: '900' }, accountText: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 2 }, helpButton: { minHeight: 46, borderRadius: 13, backgroundColor: '#effcf7', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, helpButtonText: { flex: 1, color: COLORS.primary, fontWeight: '900' },
  amountRow: { flexDirection: 'row', gap: 7 }, amountButton: { flex: 1, minHeight: 42, paddingHorizontal: 4 }, amountActive: { backgroundColor: COLORS.primaryDark }, orangeButton: { backgroundColor: '#ea580c' }, actions: { paddingHorizontal: 20, paddingTop: 4 }
})
