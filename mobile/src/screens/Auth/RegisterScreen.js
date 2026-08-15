import React, { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { COLORS } from '../../config/env'
import PrimaryButton from '../../components/PrimaryButton'
import ScreenHeader from '../../components/ScreenHeader'
import { register } from '../../services/api'

const initialForm = { prenom: '', nom: '', email: '', telephone: '', password: '', confirmPassword: '', ville: 'Sédhiou', quartier: '', dateNaissance: '', lieuNaissance: '' }

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState(initialForm)
  const [step, setStep] = useState(1)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)

  function setValue(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  function validateCurrentStep() {
    if (step === 1 && (!form.prenom.trim() || !form.nom.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) {
      Alert.alert('Informations incomplètes', 'Indiquez votre prénom, nom et une adresse email valide.')
      return false
    }
    if (step === 2 && (form.password.length < 8 || form.password !== form.confirmPassword)) {
      Alert.alert('Mot de passe', 'Utilisez au moins 8 caractères et confirmez le même mot de passe.')
      return false
    }
    if (step === 3 && (!form.telephone.trim() || !form.ville.trim() || !form.quartier.trim() || !acceptedPrivacy)) {
      Alert.alert('Informations requises', 'Téléphone, ville, quartier et acceptation de la politique de confidentialité sont requis.')
      return false
    }
    return true
  }

  async function submit() {
    if (!validateCurrentStep()) return
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = form
      await register({ ...payload, role: 'citoyen' })
      Alert.alert('Compte créé', 'Votre compte citoyen est prêt. Vous pouvez vous connecter.')
      navigation.navigate('Login')
    } catch (error) {
      Alert.alert('Inscription impossible', error.response?.data?.message || error.response?.data?.error || 'Vérifiez les informations saisies.')
    } finally { setLoading(false) }
  }

  const fields = step === 1
    ? [{ key: 'prenom', label: 'Prénom' }, { key: 'nom', label: 'Nom' }, { key: 'email', label: 'Adresse email', keyboardType: 'email-address', autoCapitalize: 'none' }]
    : step === 2
      ? [{ key: 'password', label: 'Mot de passe (8 caractères minimum)', secureTextEntry: true }, { key: 'confirmPassword', label: 'Confirmer le mot de passe', secureTextEntry: true }]
      : [{ key: 'telephone', label: 'Téléphone', keyboardType: 'phone-pad' }, { key: 'ville', label: 'Ville' }, { key: 'quartier', label: 'Quartier' }, { key: 'dateNaissance', label: 'Date de naissance (AAAA-MM-JJ)', keyboardType: 'numbers-and-punctuation' }, { key: 'lieuNaissance', label: 'Lieu de naissance (facultatif)' }]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Créer un compte" subtitle={`Étape ${step}/3 · Compte citoyen Signal‑Moi`} />
      <View style={styles.progress}>{[1, 2, 3].map((item) => <View key={item} style={[styles.progressPart, item <= step && styles.progressActive]} />)}</View>
      <View style={styles.card}>
        <Text style={styles.title}>{step === 1 ? 'Votre identité' : step === 2 ? 'Protéger votre compte' : 'Votre zone et vos droits'}</Text>
        <Text style={styles.help}>{step === 3 ? 'Ces informations permettent de mieux orienter les signalements, sans rattacher votre compte à un commissariat.' : 'Les champs marqués ici sont nécessaires à la création de votre compte.'}</Text>
        {fields.map(({ key, label, ...options }) => <TextInput key={key} value={form[key]} onChangeText={(value) => setValue(key, value)} placeholder={label} placeholderTextColor="#82909d" style={styles.input} {...options} />)}
        {step === 3 ? <>
          <Pressable onPress={() => setAcceptedPrivacy((current) => !current)} style={styles.privacyChoice} accessibilityRole="checkbox" accessibilityState={{ checked: acceptedPrivacy }}>
            <View style={[styles.checkbox, acceptedPrivacy && styles.checkboxActive]}>{acceptedPrivacy ? <Text style={styles.check}>✓</Text> : null}</View>
            <Text style={styles.privacyText}>J’accepte les conditions d’utilisation et la politique de confidentialité.</Text>
          </Pressable>
          <Text onPress={() => navigation.navigate('Privacy')} style={styles.privacyLink}>Lire la politique de confidentialité</Text>
        </> : null}
      </View>
      <View style={styles.actions}>
        {step > 1 ? <PrimaryButton title="Précédent" onPress={() => setStep((current) => current - 1)} style={styles.secondary} /> : null}
        {step < 3 ? <PrimaryButton title="Suivant" onPress={() => { if (validateCurrentStep()) setStep((current) => current + 1) }} /> : <PrimaryButton title="Créer mon compte" onPress={submit} loading={loading} />}
      </View>
      <Text onPress={() => navigation.navigate('Login')} style={styles.link}>J’ai déjà un compte</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' }, content: { paddingBottom: 32, gap: 14 }, progress: { flexDirection: 'row', gap: 7, paddingHorizontal: 20 }, progressPart: { flex: 1, height: 5, borderRadius: 4, backgroundColor: '#d9e7e3' }, progressActive: { backgroundColor: COLORS.primary }, card: { marginHorizontal: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 17, gap: 11 }, title: { color: COLORS.ink, fontSize: 21, fontWeight: '900' }, help: { color: COLORS.muted, lineHeight: 20, marginBottom: 4 }, input: { minHeight: 52, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#f8fbfa', paddingHorizontal: 14, color: COLORS.ink }, privacyChoice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 4 }, checkbox: { width: 23, height: 23, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginTop: 1 }, checkboxActive: { backgroundColor: COLORS.primary }, check: { color: '#fff', fontWeight: '900' }, privacyText: { flex: 1, color: COLORS.ink, lineHeight: 20 }, privacyLink: { color: COLORS.primary, fontWeight: '900', textDecorationLine: 'underline' }, actions: { paddingHorizontal: 20, gap: 10 }, secondary: { backgroundColor: COLORS.primaryDark }, link: { color: COLORS.primary, textAlign: 'center', fontWeight: '900', marginTop: 5 }
})
