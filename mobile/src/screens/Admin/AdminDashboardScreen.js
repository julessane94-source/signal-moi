import React, { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import { getAdminOverview, getSiteConfig } from '../../services/api'
import VictimActions from '../../components/VictimActions'

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(null)
  const [config, setConfig] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [statsResult, configResult] = await Promise.allSettled([getAdminOverview(), getSiteConfig()])
    if (statsResult.status === 'fulfilled') setStats(statsResult.value)
    if (configResult.status === 'fulfilled') setConfig(configResult.value)
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  async function refresh() {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ScreenHeader title="Administration" subtitle="Supervision mobile" />
      <View style={styles.grid}>
        <Box label="Signalements" value={stats?.totalSignalements || stats?.total || 0} icon="document-text" />
        <Box label="Utilisateurs" value={stats?.totalUsers || stats?.users || 0} icon="people" />
        <Box label="Campagnes" value={stats?.totalCampagnes || stats?.campaigns || 0} icon="calendar" />
        <Box label="Logo BD" value={config?.logoUrl ? 'OK' : '...'} icon="image" />
      </View>
      <View style={styles.statusPanel}>
        <Text style={styles.statusTitle}>Plateforme connectee</Text>
        <Text style={styles.statusText}>Backend Render, base de donnees, logo et statistiques sont consultes depuis l application mobile.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Configuration</Text>
        <Text style={styles.text}>Le logo, les textes d accueil, les images du diaporama et les statistiques restent geres par le backend Render et le dashboard Vercel.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Derniers signalements</Text>
        {(stats?.signalements || []).slice(0, 4).map((item) => (
          <View key={item.id || item._id} style={styles.caseMini}>
            <Text style={styles.caseTitle}>{item.type || item.titre || 'Signalement'}</Text>
            <Text numberOfLines={2} style={styles.text}>{item.description || item.localisation || 'Dossier recu.'}</Text>
            <VictimActions item={item} compact />
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

function Box({ label, value, icon }) {
  return (
    <View style={styles.box}>
      <Ionicons name={icon} size={20} color={COLORS.primaryDark} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  box: { width: '47%', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  value: { color: COLORS.primary, fontSize: 24, fontWeight: '900' },
  label: { color: COLORS.muted, marginTop: 4 },
  statusPanel: { margin: 20, marginBottom: 0, backgroundColor: COLORS.primaryDark, borderRadius: 22, padding: 20 },
  statusTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  statusText: { color: '#d9fffa', marginTop: 8, lineHeight: 22 },
  card: { margin: 20, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  title: { color: COLORS.ink, fontSize: 18, fontWeight: '900' },
  text: { color: COLORS.muted, marginTop: 8, lineHeight: 22 },
  caseMini: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 12, gap: 8 },
  caseTitle: { color: COLORS.ink, fontWeight: '900', textTransform: 'capitalize' }
})
