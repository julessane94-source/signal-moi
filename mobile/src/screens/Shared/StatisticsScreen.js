import React, { useCallback, useEffect, useState } from 'react'
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { API_URL, COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { getCompleteStatistics } from '../../services/api'
import { getSession } from '../../services/storage'
import { useAuth } from '../../context/AuthContext'

export default function StatisticsScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(null)

  const load = useCallback(async () => {
    const data = await getCompleteStatistics()
    setStats(data)
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

  async function downloadExport(format) {
    setExporting(format)
    try {
      const { token } = await getSession()
      const role = String(user?.role || '').toLowerCase()
      const endpoint = role.includes('collaborateur') || role.includes('collaborator')
        ? `/collaborator/statistics/export?format=${format}`
        : `/admin/statistics/export?format=${format}`
      const extension = format === 'excel' ? 'xlsx' : 'pdf'
      const result = await FileSystem.downloadAsync(
        `${API_URL}${endpoint}`,
        `${FileSystem.documentDirectory}signal-moi-statistiques.${extension}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri)
      } else {
        Alert.alert('Rapport telecharge', result.uri)
      }
    } catch (error) {
      Alert.alert('Telechargement impossible', 'Verifiez votre connexion et vos droits.')
    } finally {
      setExporting(null)
    }
  }

  const overview = stats?.overview || {}
  const typeItems = stats?.byType?.data || stats?.byType || []

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ScreenHeader title="Statistiques" subtitle="Vue complete depuis Render" />
      <View style={styles.grid}>
        <Stat label="Total" value={overview.total || overview.totalSignalements || 0} />
        <Stat label="En cours" value={overview.enCours || overview.pending || 0} />
        <Stat label="Traites" value={overview.traites || overview.resolved || 0} />
        <Stat label="Lives" value={overview.lives || 0} />
      </View>
      <View style={styles.card}>
        <Text style={styles.section}>Par type</Text>
        {Array.isArray(typeItems) && typeItems.length ? typeItems.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.rowLabel}>{item.type || item.label || 'Type'}</Text>
            <Text style={styles.rowValue}>{item.count || item.total || 0}</Text>
          </View>
        )) : <Text style={styles.empty}>Aucune statistique detaillee chargee.</Text>}
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Telecharger PDF" onPress={() => downloadExport('pdf')} loading={exporting === 'pdf'} />
        <PrimaryButton title="Telecharger Excel" onPress={() => downloadExport('excel')} loading={exporting === 'excel'} />
      </View>
    </ScrollView>
  )
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 },
  stat: { width: '47%', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  value: { color: COLORS.ink, fontSize: 28, fontWeight: '900' },
  label: { color: COLORS.muted, marginTop: 4 },
  card: { margin: 20, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  section: { color: COLORS.ink, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#edf2f1' },
  rowLabel: { color: COLORS.ink, textTransform: 'capitalize' },
  rowValue: { color: COLORS.primary, fontWeight: '900' },
  empty: { color: COLORS.muted },
  actions: { paddingHorizontal: 20, gap: 10, paddingBottom: 28 }
})
