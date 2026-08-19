import React from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'

const steps = [
  ['1', 'Mettez-vous en sécurité', 'En cas de danger immédiat, éloignez-vous du risque et contactez les services d’urgence locaux. Signal‑Moi ne remplace pas un appel d’urgence.'],
  ['2', 'Préparez vos informations', 'Notez la date, l’heure, le lieu, les personnes impliquées et les faits dans l’ordre. Gardez les preuves originales : photos, vidéos, messages et documents.'],
  ['3', 'Rendez-vous au bon service', 'Pour une infraction ou un préjudice personnel, présentez-vous au commissariat ou à la gendarmerie. Votre signalement Signal‑Moi peut aider à expliquer le contexte, mais ne remplace pas la plainte officielle.'],
  ['4', 'Demandez une référence', 'Demandez le numéro ou le récépissé de votre plainte. Conservez-le avec la référence de votre signalement et vos preuves.'],
  ['5', 'Protégez vos données', 'Ne publiez pas publiquement les visages, numéros, documents ou témoignages sensibles. Partagez-les seulement avec les autorités compétentes.']
]

export default function ComplaintGuideScreen({ navigation }) {
  const openMap = () => Linking.openURL('https://www.google.com/maps/search/?api=1&query=commissariat+ou+gendarmerie+proche').catch(() => {})
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <ScreenHeader title="Déposer une plainte" subtitle="Orientation pratique après votre signalement" />
    <View style={styles.notice}><Ionicons name="information-circle" size={24} color="#9a3412" /><Text style={styles.noticeText}>Un signalement alerte et documente une situation. Une plainte officielle permet aux autorités d’enregistrer les faits et d’engager les vérifications nécessaires.</Text></View>
    {steps.map(([number, title, text]) => <View key={number} style={styles.card}><View style={styles.number}><Text style={styles.numberText}>{number}</Text></View><View style={{ flex: 1 }}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{text}</Text></View></View>)}
    <View style={styles.card}><Ionicons name="folder-open" size={25} color={COLORS.primary} /><View style={{ flex: 1 }}><Text style={styles.title}>À emporter si possible</Text><Text style={styles.text}>Pièce d’identité, captures d’écran, photos ou vidéos originales, noms de témoins, coordonnées du lieu et la référence Signal‑Moi.</Text></View></View>
    <PrimaryButton title="Trouver un commissariat ou une gendarmerie" onPress={openMap} />
    <Pressable onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>Retour à mon compte</Text></Pressable>
  </ScrollView>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' }, content: { paddingBottom: 34, paddingHorizontal: 20, gap: 13 }, notice: { borderRadius: 18, padding: 16, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', flexDirection: 'row', gap: 10 }, noticeText: { flex: 1, color: '#7c2d12', lineHeight: 20, fontWeight: '700' }, card: { borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff', padding: 16, flexDirection: 'row', gap: 12 }, number: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }, numberText: { color: '#fff', fontWeight: '900' }, title: { color: COLORS.ink, fontSize: 16, fontWeight: '900' }, text: { color: COLORS.muted, lineHeight: 20, marginTop: 5 }, back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, backText: { color: COLORS.primary, fontWeight: '900' }
})
