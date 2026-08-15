import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import VictimActions from '../../components/VictimActions'
import {
  deleteAdminCampagne,
  deleteAdminSignalement,
  deleteAdminUser,
  getAdminCampagnes,
  getAdminSignalements,
  getAdminUsers
} from '../../services/api'

export default function AdminManagementScreen() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [u, s, c] = await Promise.allSettled([getAdminUsers(), getAdminSignalements(), getAdminCampagnes()])
    if (u.status === 'fulfilled') setUsers(u.value.users || u.value.data || u.value || [])
    if (s.status === 'fulfilled') setSignalements(s.value.signalements || s.value.data || s.value || [])
    if (c.status === 'fulfilled') setCampagnes(c.value.campagnes || c.value.data || c.value || [])
  }, [])

  useEffect(() => { load().catch(() => {}) }, [load])

  async function refresh() {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  async function remove(type, id) {
    if (!id) return
    try {
      if (type === 'user') await deleteAdminUser(id)
      if (type === 'signalement') await deleteAdminSignalement(id)
      if (type === 'campagne') await deleteAdminCampagne(id)
      Alert.alert('Action effectuee', 'Element mis a jour.')
      await load()
    } catch (error) {
      Alert.alert('Action impossible', error.response?.data?.message || 'Reessayez.')
    }
  }

  const data = tab === 'users' ? users : tab === 'signalements' ? signalements : campagnes

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gestion admin" subtitle="Utilisateurs, signalements, campagnes" />
      <View style={styles.tabs}>
        <Tab label="Utilisateurs" active={tab === 'users'} onPress={() => setTab('users')} />
        <Tab label="Signalements" active={tab === 'signalements'} onPress={() => setTab('signalements')} />
        <Tab label="Campagnes" active={tab === 'campagnes'} onPress={() => setTab('campagnes')} />
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => String(item.id || item._id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.titre || item.title || `${item.prenom || ''} ${item.nom || ''}`.trim() || item.email || 'Element'}</Text>
            <Text style={styles.meta}>{item.role || item.type || item.statut || item.status || item.email || item.localisation || 'Signal Moi'}</Text>
            {tab === 'signalements' ? <VictimActions item={item} compact /> : null}
            <Pressable style={styles.deleteButton} onPress={() => remove(tab === 'users' ? 'user' : tab === 'signalements' ? 'signalement' : 'campagne', item.id || item._id)}>
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.deleteText}>Supprimer / desactiver</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune donnee chargee.</Text>}
      />
    </View>
  )
}

function Tab({ label, active, onPress }) {
  return <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable>
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  tab: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '900' },
  tabTextActive: { color: '#fff' },
  list: { padding: 20, paddingTop: 0, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 9 },
  title: { color: COLORS.ink, fontSize: 17, fontWeight: '900' },
  meta: { color: COLORS.muted },
  deleteButton: { minHeight: 44, borderRadius: 14, backgroundColor: COLORS.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { color: '#fff', fontWeight: '900' },
  empty: { textAlign: 'center', color: COLORS.muted, padding: 20 }
})
