import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { followCase, getCollaboratorDashboard, getCollaboratorStatistics } from '../../services/api'
import VictimActions from '../../components/VictimActions'

export default function CollaboratorDashboardScreen() {
  const [cases, setCases] = useState([])
  const [stats, setStats] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [dashboardResult, statsResult] = await Promise.allSettled([
      getCollaboratorDashboard(),
      getCollaboratorStatistics()
    ])
    if (dashboardResult.status === 'fulfilled') {
      const data = dashboardResult.value
      setCases(data.signalements || data.followedCases || data.cases || [])
    }
    if (statsResult.status === 'fulfilled') setStats(statsResult.value)
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

  async function follow(id) {
    await followCase(id).catch(() => {})
    await load()
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Collaborateur" subtitle="Dossiers, campagnes et statistiques" />
      <View style={styles.stats}>
        <Box label="Dossiers" value={cases.length} icon="folder-open" />
        <Box label="Suivis" value={stats?.followedCases || stats?.suivis || 0} icon="eye" />
        <Box label="Rapports" value={stats ? 'OK' : '...'} icon="bar-chart" />
      </View>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Priorites collaborateur</Text>
        <Text style={styles.panelText}>Suivre les dossiers, accompagner les citoyens et exporter les statistiques completes depuis l onglet Statistiques.</Text>
      </View>
      <FlatList
        data={cases}
        keyExtractor={(item, index) => String(item.id || item._id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.type || item.titre || 'Dossier'}</Text>
            <Text numberOfLines={3} style={styles.text}>{item.description || 'Dossier a accompagner.'}</Text>
            <Text style={styles.meta}>{item.statut || item.status || 'nouveau'}</Text>
            <VictimActions item={item} compact />
            <PrimaryButton title="Suivre le dossier" onPress={() => follow(item.id || item._id)} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun dossier collaborateur charge.</Text>}
      />
    </View>
  )
}

function Box({ label, value, icon }) {
  return (
    <View style={styles.box}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.boxValue}>{value}</Text>
      <Text style={styles.boxLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  stats: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  box: { flex: 1, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  boxValue: { color: COLORS.primary, fontSize: 24, fontWeight: '900' },
  boxLabel: { color: COLORS.muted, marginTop: 4 },
  panel: { marginHorizontal: 20, marginBottom: 12, borderRadius: 20, backgroundColor: COLORS.primaryDark, padding: 18 },
  panelTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  panelText: { color: '#d9fffa', marginTop: 6, lineHeight: 21 },
  list: { padding: 20, paddingTop: 0, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10 },
  title: { color: COLORS.ink, fontSize: 18, fontWeight: '900' },
  text: { color: COLORS.muted, lineHeight: 21 },
  meta: { color: COLORS.primary, fontWeight: '900' },
  empty: { color: COLORS.muted, textAlign: 'center', padding: 18 }
})
