import React, { useCallback, useEffect, useState } from 'react'
import { ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS, resolveMediaUrl } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { getAdminOverview, getCollaboratorDashboard, getPoliceDashboard, getSiteConfig } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const fallbackImage = 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=70'

export default function HomeScreen() {
  const { user } = useAuth()
  const [image, setImage] = useState(fallbackImage)
  const [summary, setSummary] = useState({ total: 0, pending: 0, urgent: 0 })
  const [refreshing, setRefreshing] = useState(false)
  const role = String(user?.role || '').toLowerCase()
  const roleLabel = role.includes('admin') ? 'Administration' : role.includes('collabor') ? 'Espace collaborateur' : 'Commissariat'

  const load = useCallback(async () => {
    const configResult = getSiteConfig().then((config) => {
      const first = config?.home_page?.images?.[0] || config?.homePage?.images?.[0]
      if (first) setImage(resolveMediaUrl(first))
    }).catch(() => {})

    try {
      if (role.includes('admin')) {
        const data = await getAdminOverview()
        setSummary({ total: Number(data.totalSignalements || data.total || 0), pending: Number(data.totalUsers || 0), urgent: Number(data.totalCampagnes || 0) })
      } else if (role.includes('collabor')) {
        const data = await getCollaboratorDashboard()
        const cases = data.signalements || data.followedCases || data.cases || []
        setSummary({ total: cases.length, pending: Number(data.stats?.followedCases || data.suivis || 0), urgent: cases.filter((item) => ['violence', 'accident', 'vol'].includes(String(item.type || '').toLowerCase())).length })
      } else {
        const data = await getPoliceDashboard()
        const stats = data.stats || data
        setSummary({ total: Number(stats.totalAlerts || 0), pending: Number(stats.inProgress || 0), urgent: Number(stats.highPriority || 0) })
      }
    } finally {
      await configResult
    }
  }, [role])

  useEffect(() => { load().catch(() => {}) }, [load])

  async function refresh() {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  const metrics = role.includes('admin')
    ? [{ label: 'Signalements', value: summary.total }, { label: 'Utilisateurs', value: summary.pending }, { label: 'Campagnes', value: summary.urgent }]
    : [{ label: 'Dossiers', value: summary.total }, { label: role.includes('collabor') ? 'Suivis' : 'En cours', value: summary.pending }, { label: 'Urgences', value: summary.urgent }]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ScreenHeader title={roleLabel} subtitle={`Bonjour ${user?.prenom || user?.name || ''}`} />
      <ImageBackground source={{ uri: image }} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.overlay}><Text style={styles.heroTitle}>{role.includes('admin') ? 'Piloter la plateforme.' : role.includes('collabor') ? 'Suivre les actions locales.' : 'Intervenir sans délai.'}</Text><Text style={styles.heroText}>Les données sont actualisées depuis Signal‑Moi. Faites glisser pour rafraîchir.</Text></View>
      </ImageBackground>
      <View style={styles.grid}>{metrics.map((item) => <View key={item.label} style={styles.metric}><Text style={styles.metricValue}>{item.value}</Text><Text style={styles.metricLabel}>{item.label}</Text></View>)}</View>
      <View style={styles.info}><Text style={styles.infoTitle}>Accès rapide</Text><Text style={styles.infoText}>{role.includes('admin') ? 'Gérez les utilisateurs dans Gestion et consultez les analyses dans Statistiques.' : role.includes('collabor') ? 'Vos dossiers, campagnes et statistiques sont disponibles dans les onglets ci-dessous.' : 'Ouvrez Interventions pour localiser les victimes, appeler et prendre les dossiers en charge.'}</Text><PrimaryButton title="Actualiser les données" onPress={refresh} loading={refreshing} /></View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' }, content: { paddingBottom: 28 }, hero: { margin: 20, height: 220, borderRadius: 24, overflow: 'hidden' }, heroImage: { borderRadius: 24 }, overlay: { flex: 1, backgroundColor: 'rgba(8,31,27,0.55)', justifyContent: 'flex-end', padding: 20 }, heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900' }, heroText: { color: '#e6fffa', marginTop: 8, lineHeight: 21 }, grid: { flexDirection: 'row', gap: 9, paddingHorizontal: 20 }, metric: { flex: 1, minHeight: 90, borderRadius: 17, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, padding: 12 }, metricValue: { color: COLORS.primaryDark, fontSize: 25, fontWeight: '900' }, metricLabel: { color: COLORS.muted, marginTop: 5, fontSize: 12, fontWeight: '800' }, info: { margin: 20, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 17, gap: 10 }, infoTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900' }, infoText: { color: COLORS.muted, lineHeight: 21 }
})
