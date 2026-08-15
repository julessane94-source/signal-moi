import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'

const sections = [
  ['Données utilisées', 'Votre identité, vos coordonnées, votre localisation et les éléments joints à un signalement servent uniquement à créer, orienter et suivre votre dossier.'],
  ['Accès aux signalements', 'Les informations d’un signalement sont visibles uniquement par les équipes autorisées : administration, commissariat concerné et collaborateurs concernés par le type de dossier.'],
  ['Localisation et preuves', 'La position GPS, les photos, vidéos ou lives sont envoyés seulement lorsque vous utilisez ces fonctions. Vous pouvez refuser les autorisations du téléphone.'],
  ['Vos droits', 'Vous pouvez demander la consultation, la correction ou la suppression de vos données, sous réserve des obligations légales liées aux signalements.'],
  ['Sécurité', 'Signal‑Moi protège les accès par authentification et limite les données affichées selon le rôle de chaque utilisateur. Ne partagez jamais votre mot de passe.']
]

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Politique de confidentialité" subtitle="Signal‑Moi · Informations essentielles" />
      <View style={styles.notice}><Text style={styles.noticeTitle}>Votre confiance est essentielle</Text><Text style={styles.noticeText}>Cette version résume la manière dont l’application mobile utilise vos données pour traiter les signalements citoyens.</Text></View>
      {sections.map(([title, text]) => <View key={title} style={styles.card}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{text}</Text></View>)}
      <Text style={styles.contact}>Pour toute question liée à vos données : julessane94@gmail.com</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' }, content: { paddingBottom: 34 }, notice: { margin: 20, marginTop: 0, borderRadius: 20, backgroundColor: COLORS.primaryDark, padding: 18 }, noticeTitle: { color: '#fff', fontSize: 19, fontWeight: '900' }, noticeText: { color: '#d9fffa', marginTop: 7, lineHeight: 21 }, card: { marginHorizontal: 20, marginBottom: 11, backgroundColor: '#fff', borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, padding: 16 }, title: { color: COLORS.ink, fontSize: 17, fontWeight: '900' }, text: { color: COLORS.muted, marginTop: 7, lineHeight: 21 }, contact: { color: COLORS.primaryDark, marginHorizontal: 24, marginTop: 8, fontWeight: '800', textAlign: 'center' }
})
