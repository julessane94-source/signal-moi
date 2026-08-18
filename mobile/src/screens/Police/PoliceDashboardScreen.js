import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import { getLiveSessions, getPoliceAlerts, getPoliceDashboard, savePoliceStationLocation, takePoliceAction } from '../../services/api'
import { connectLiveSocket, disconnectLiveSocket } from '../../services/liveSocket'
import { useAuth } from '../../context/AuthContext'
import PrimaryButton from '../../components/PrimaryButton'
import { requestLocalAlerts, scheduleLocalAlert } from '../../services/mobileNotifications'
import VictimActions, { openVictimMap } from '../../components/VictimActions'
import { playRoleAlertSound } from '../../services/soundAlerts'
import { useLocation } from '../../context/LocationContext'

export default function PoliceDashboardScreen() {
  const { token, user, signOut } = useAuth()
  const { requestCurrentLocation } = useLocation()
  const stationLocationSentRef = useRef(false)
  const [cases, setCases] = useState([])
  const [stats, setStats] = useState(null)
  const [lives, setLives] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('tous')
  const urgentCount = cases.filter((item) => ['violence', 'danger', 'accident', 'vol'].includes(String(item.type || '').toLowerCase())).length

  const activeCases = useMemo(() => {
    return cases.filter((item) => {
      if (filter === 'tous') return true
      const status = String(item.statut || item.status || '').toLowerCase()
      if (filter === 'attente') return ['nouveau', 'attente', 'recu', 'reçu'].some((value) => status.includes(value))
      return ['en_cours', 'cours', 'en cours'].some((value) => status.includes(value))
    })
  }, [cases, filter])

  const loadData = useCallback(async () => {
    const [dashboardResult, alertsResult, liveResult] = await Promise.allSettled([
      getPoliceDashboard(),
      getPoliceAlerts(),
      getLiveSessions()
    ])
    if (dashboardResult.status === 'fulfilled') {
      const data = dashboardResult.value
      setStats(data.stats || data)
      if (alertsResult.status !== 'fulfilled') {
        setCases(data.signalements || data.alerts || data.cases || [])
      }
    }
    if (alertsResult.status === 'fulfilled') {
      setCases(alertsResult.value.alerts || alertsResult.value.data || alertsResult.value || [])
    }
    if (liveResult.status === 'fulfilled') {
      setLives(liveResult.value.sessions || liveResult.value.liveSessions || liveResult.value || [])
    }
  }, [])

  useEffect(() => {
    requestLocalAlerts()
    loadData()
    // Le sondage est un filet de sécurité si le Socket arrive après le début
    // du direct ou subit une coupure réseau temporaire.
    const livePolling = setInterval(() => {
      loadData().catch(() => {})
    }, 5000)

    const socket = connectLiveSocket(token, user)
    const upsertLive = (payload) => {
      const incoming = payload?.session || payload
      const sessionId = incoming?.sessionId || incoming?.id
      if (!sessionId) return
      setLives((current) => {
        const index = current.findIndex((live) => String(live?.sessionId || live?.id || '') === String(sessionId))
        if (index < 0) return [{ ...incoming, sessionId: incoming.sessionId || sessionId }, ...current]
        const next = [...current]
        next[index] = { ...next[index], ...incoming, sessionId: incoming.sessionId || sessionId }
        return next
      })
    }
    const onNewCase = async (payload) => {
      setCases((current) => [payload.signalement || payload, ...current])
      await playRoleAlertSound()
      await scheduleLocalAlert('Nouveau signalement', 'Une nouvelle alerte citoyenne vient d arriver.')
    }
    const onLive = async (payload) => {
      upsertLive(payload)
      await playRoleAlertSound()
      await scheduleLocalAlert('Live citoyen en cours', 'Ouvrez l espace commissariat pour suivre la video en temps reel.')
    }
    const onLiveLocation = (payload) => {
      upsertLive(payload)
    }

    socket?.on('new_signalement', onNewCase)
    socket?.on('signalement:new', onNewCase)
    socket?.on('live_session_started', onLive)
    socket?.on('live:started', onLive)
    socket?.on('live_recording_started', onLive)
    socket?.on('live_recording_location', onLiveLocation)
    socket?.on('live_recording_frame', onLiveLocation)

    return () => {
      clearInterval(livePolling)
      socket?.off('new_signalement', onNewCase)
      socket?.off('signalement:new', onNewCase)
      socket?.off('live_session_started', onLive)
      socket?.off('live:started', onLive)
      socket?.off('live_recording_started', onLive)
      socket?.off('live_recording_location', onLiveLocation)
      socket?.off('live_recording_frame', onLiveLocation)
      disconnectLiveSocket()
    }
  }, [loadData, token, user])

  useEffect(() => {
    if (String(user?.role || '').toLowerCase() !== 'commissariat' || stationLocationSentRef.current) return
    stationLocationSentRef.current = true
    requestCurrentLocation()
      .then((coords) => {
        if (!coords) throw new Error('GPS non disponible')
        return savePoliceStationLocation(coords.latitude, coords.longitude)
      })
      .catch(() => {
        stationLocationSentRef.current = false
      })
  }, [requestCurrentLocation, user?.role])

  async function refresh() {
    setRefreshing(true)
    try {
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  async function intervene(caseId) {
    try {
      await takePoliceAction(caseId)
      Alert.alert('Intervention lancee', 'Le dossier est pris en charge.')
      await loadData()
    } catch (error) {
      Alert.alert('Action impossible', error.response?.data?.message || 'Reessayez dans un instant.')
    }
  }

  function openMap(item) {
    openVictimMap(item)
  }

  function Header() {
    return (
      <>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Commissariat</Text>
            <Text style={styles.subtitle}>Agents rattaches, interventions et lives citoyens</Text>
          </View>
          <PrimaryButton title="Sortir" onPress={signOut} tone="police" style={styles.logout} />
        </View>

        <View style={styles.summaryGrid}>
          <Metric label="File active" value={stats?.totalAlerts || cases.length} icon="albums" />
          <Metric label="Urgences" value={stats?.highPriority || urgentCount} icon="warning" danger />
          <Metric label="Lives" value={lives.length} icon="radio" danger />
        </View>

        <View style={styles.livePanel}>
          <View style={styles.liveHeader}>
            <Ionicons name="radio" size={22} color={COLORS.danger} />
            <Text style={styles.liveTitle}>Lives citoyens</Text>
          </View>
          {lives.length ? (
            lives.slice(0, 4).map((live) => (
              <View key={live.id || live.sessionId || live.signalement_id} style={styles.liveItem}>
                {live.frame ? <Image source={{ uri: live.frame }} style={styles.liveFrame} /> : <View style={styles.liveFramePlaceholder}><Ionicons name="videocam" color="#fff" size={22} /></View>}
                <View style={styles.liveInfo}>
                  <Text style={styles.liveName}>{live.titre || live.title || live.type || 'Video en direct'}</Text>
                  <Text style={styles.liveMeta}>{live.localisation || live.location || live.adresse || 'Position recue par GPS'}</Text>
                  <Text style={styles.liveMeta}>{live.videoChunkCount || live.frame ? 'Images recues' : 'En attente image'}</Text>
                </View>
                <Pressable style={styles.liveButton} onPress={() => openMap(live)}>
                  <Ionicons name="navigate" size={18} color="#fff" />
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun live affiche pour le moment.</Text>
          )}
        </View>

        <View style={styles.filters}>
          {['attente', 'cours', 'tous'].map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activeCases}
        keyExtractor={(item, index) => String(item.id || item._id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={<Header />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.caseCard}>
            <View style={styles.caseTop}>
              <Text style={styles.caseType}>{item.type || 'Signalement'}</Text>
              <Text style={styles.caseStatus}>{item.statut || item.status || 'attente'}</Text>
            </View>
            <Text numberOfLines={2} style={styles.caseText}>{item.description || 'Aucun detail fourni.'}</Text>
            <Text style={styles.caseMeta}>{item.adresse || item.location || 'Adresse GPS disponible dans le dossier'}</Text>
            <VictimActions item={item} compact />
            <View style={styles.caseActions}>
              <PrimaryButton title="Intervenir" tone="police" onPress={() => intervene(item.id || item._id)} style={styles.caseAction} />
              <Pressable style={styles.mapButton} onPress={() => openMap(item)}>
                <Ionicons name="map" size={20} color={COLORS.police} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun signalement dans ce filtre.</Text>}
      />
    </View>
  )
}

function Metric({ label, value, icon, danger }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={20} color={danger ? COLORS.danger : COLORS.police} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8ff'
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  title: {
    color: '#0f1f44',
    fontSize: 28,
    fontWeight: '900'
  },
  subtitle: {
    color: COLORS.muted,
    marginTop: 5
  },
  logout: {
    minHeight: 42,
    paddingHorizontal: 14
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16
  },
  metric: {
    flex: 1,
    minHeight: 92,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe6ff',
    padding: 12
  },
  metricValue: {
    color: '#0f1f44',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '800'
  },
  livePanel: {
    margin: 20,
    borderRadius: 22,
    backgroundColor: '#0f1f44',
    padding: 18,
    gap: 12
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  liveTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900'
  },
  liveItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  liveFrame: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  liveFramePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  liveInfo: {
    flex: 1,
    marginHorizontal: 10
  },
  liveName: {
    color: '#fff',
    fontWeight: '900'
  },
  liveMeta: {
    color: '#c9d7ff',
    marginTop: 4
  },
  liveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12
  },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe6ff'
  },
  filterActive: {
    backgroundColor: COLORS.police,
    borderColor: COLORS.police
  },
  filterText: {
    color: COLORS.muted,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  filterTextActive: {
    color: '#fff'
  },
  list: {
    paddingBottom: 24,
    gap: 12
  },
  caseCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe6ff',
    gap: 10
  },
  caseActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  caseAction: {
    flex: 1
  },
  mapButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe6ff',
    backgroundColor: '#f8fbff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  caseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  caseType: {
    color: '#0f1f44',
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  caseStatus: {
    color: COLORS.police,
    fontWeight: '900'
  },
  caseText: {
    color: COLORS.ink,
    lineHeight: 21
  },
  caseMeta: {
    color: COLORS.muted
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    padding: 16
  }
})
