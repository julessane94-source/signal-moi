import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, Easing, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import { getLiveSessions, getPoliceAlerts, getPoliceDashboard, getPoliceOfficers, savePoliceStationLocation, takePoliceAction, transferSignalement, updatePoliceCaseStatus } from '../../services/api'
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
  const entrance = useRef(new Animated.Value(0)).current
  const livePulse = useRef(new Animated.Value(1)).current
  const [cases, setCases] = useState([])
  const [stats, setStats] = useState(null)
  const [lives, setLives] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('tous')
  const [transferForId, setTransferForId] = useState(null)
  const [officers, setOfficers] = useState([])
  const [transferring, setTransferring] = useState(false)
  const [archivingId, setArchivingId] = useState(null)
  const urgentCount = cases.filter((item) => ['violence', 'danger', 'accident', 'vol'].includes(String(item.type || '').toLowerCase())).length

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 1.16, duration: 850, useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 1, duration: 850, useNativeDriver: true })
    ]))
    pulse.start()
    return () => pulse.stop()
  }, [entrance, livePulse])

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

  async function openTransfer(caseId) {
    if (transferForId === caseId) {
      setTransferForId(null)
      return
    }
    try {
      const list = await getPoliceOfficers()
      setOfficers(list.filter((officer) => String(officer.id) !== String(user?.id)))
      setTransferForId(caseId)
    } catch (error) {
      Alert.alert('Transfert indisponible', error.response?.data?.error || 'La liste des agents ne peut pas être chargée.')
    }
  }

  async function transferCase(caseId, officer) {
    setTransferring(true)
    try {
      await transferSignalement(caseId, officer.id)
      Alert.alert('Dossier transféré', `Le dossier est confié à ${officer.prenom || ''} ${officer.nom || ''}`.trim())
      setTransferForId(null)
      await loadData()
    } catch (error) {
      Alert.alert('Transfert impossible', error.response?.data?.error || 'Réessayez dans un instant.')
    } finally {
      setTransferring(false)
    }
  }

  function archiveCase(caseId) {
    Alert.alert(
      'Archiver ce dossier ?',
      'Le dossier sortira de la file active et restera consultable dans l historique des interventions.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          style: 'destructive',
          onPress: async () => {
            setArchivingId(caseId)
            try {
              await updatePoliceCaseStatus(caseId, 'intervention_terminee')
              Alert.alert('Dossier archivé', 'Le citoyen et les personnes qui suivent le dossier sont informés.')
              await loadData()
            } catch (error) {
              Alert.alert('Archivage impossible', error.response?.data?.error || 'Réessayez dans un instant.')
            } finally {
              setArchivingId(null)
            }
          }
        }
      ]
    )
  }

  function openMap(item) {
    openVictimMap(item)
  }

  function Header() {
    return (
      <>
        <Animated.View style={[styles.commandBanner, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }]}>
          <View style={styles.commandBannerTop}>
            <View style={styles.commandIcon}><Ionicons name="shield-checkmark" size={23} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.commandEyebrow}>POSTE DE COORDINATION</Text>
              <Text style={styles.commandTitle}>Surveillance en temps réel</Text>
            </View>
            <View style={styles.zonePill}><Ionicons name="locate" size={13} color="#bfdbfe" /><Text style={styles.zonePillText}>Zone GPS</Text></View>
          </View>
          <View style={styles.commandFooter}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: livePulse }] }]} />
            <Text style={styles.commandFooterText}>{lives.length ? `${lives.length} direct${lives.length > 1 ? 's' : ''} à surveiller` : 'Veille active — aucun direct en cours'}</Text>
          </View>
        </Animated.View>
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
          <View style={[styles.caseCard, ['violence', 'danger', 'accident', 'vol'].includes(String(item.type || '').toLowerCase()) && styles.urgentCaseCard]}>
            <View style={styles.caseTop}>
              <Text style={styles.caseType}>{item.type || 'Signalement'}</Text>
              <Text style={styles.caseStatus}>{item.statut || item.status || 'attente'}</Text>
            </View>
            <Text numberOfLines={2} style={styles.caseText}>{item.description || 'Aucun detail fourni.'}</Text>
            <Text style={styles.caseMeta}>{item.adresse || item.location || 'Adresse GPS disponible dans le dossier'}</Text>
            {item.estAnonyme || item.isAnonymous ? <View style={styles.anonymousBadge}><Ionicons name="shield-checkmark" size={14} color="#0f766e" /><Text style={styles.anonymousText}>Citoyen anonyme</Text></View> : null}
            <VictimActions item={item} compact />
            <View style={styles.caseActions}>
              <PrimaryButton title="Intervenir" tone="police" onPress={() => intervene(item.id || item._id)} style={styles.caseAction} />
              <Pressable style={styles.mapButton} onPress={() => openMap(item)}>
                <Ionicons name="map" size={20} color={COLORS.police} />
              </Pressable>
            </View>
            <Pressable disabled={archivingId === (item.id || item._id)} onPress={() => archiveCase(item.id || item._id)} style={styles.archiveButton}>
              <Ionicons name="archive-outline" size={18} color="#475569" />
              <Text style={styles.archiveText}>{archivingId === (item.id || item._id) ? 'Archivage…' : 'Clôturer et archiver le dossier'}</Text>
            </Pressable>
            {String(user?.role || '').toLowerCase() === 'commissariat' ? (
              <>
                <Pressable onPress={() => openTransfer(item.id || item._id)} style={styles.transferButton}>
                  <Ionicons name="swap-horizontal" size={19} color={COLORS.police} />
                  <Text style={styles.transferText}>{transferForId === (item.id || item._id) ? 'Fermer le transfert' : 'Transférer ce dossier à un agent'}</Text>
                </Pressable>
                {transferForId === (item.id || item._id) ? (
                  <View style={styles.transferPanel}>
                    <Text style={styles.transferTitle}>Choisir un agent</Text>
                    {!officers.length ? <Text style={styles.transferEmpty}>Aucun agent disponible dans la liste.</Text> : officers.map((officer) => (
                      <Pressable key={officer.id} disabled={transferring} onPress={() => transferCase(item.id || item._id, officer)} style={styles.officerRow}>
                        <View style={styles.officerAvatar}><Ionicons name="person" size={16} color="#fff" /></View>
                        <View style={{ flex: 1 }}><Text style={styles.officerName}>{officer.prenom} {officer.nom}</Text><Text style={styles.officerMeta}>{officer.telephone || officer.email || 'Agent police'}</Text></View>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.police} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}
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
  commandBanner: {
    marginTop: 52,
    marginHorizontal: 20,
    borderRadius: 26,
    backgroundColor: '#102a56',
    padding: 18,
    shadowColor: '#102a56',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 7
  },
  commandBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  commandIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb'
  },
  commandEyebrow: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1
  },
  commandTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2
  },
  zonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  zonePillText: { color: '#dbeafe', fontSize: 11, fontWeight: '800' },
  commandFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fb7185' },
  commandFooterText: { color: '#dbeafe', fontSize: 12, fontWeight: '700' },
  header: {
    paddingTop: 20,
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
  urgentCaseCard: {
    borderColor: '#fecaca',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },
  caseActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  archiveButton: { minHeight: 44, marginTop: 10, borderRadius: 13, backgroundColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  archiveText: { color: '#334155', fontWeight: '900', fontSize: 13 },
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
  anonymousBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: '#ecfdf5', paddingHorizontal: 9, paddingVertical: 5 },
  anonymousText: { color: '#0f766e', fontWeight: '800', fontSize: 12 },
  transferButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  transferText: { color: COLORS.police, fontWeight: '900', fontSize: 13 },
  transferPanel: { borderRadius: 15, borderWidth: 1, borderColor: '#dbeafe', backgroundColor: '#f8fbff', padding: 11, gap: 7 },
  transferTitle: { color: '#0f1f44', fontWeight: '900', marginBottom: 2 },
  transferEmpty: { color: COLORS.muted, fontSize: 13 },
  officerRow: { minHeight: 50, borderRadius: 11, padding: 8, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 9 },
  officerAvatar: { width: 32, height: 32, borderRadius: 11, backgroundColor: COLORS.police, alignItems: 'center', justifyContent: 'center' },
  officerName: { color: COLORS.ink, fontWeight: '900', fontSize: 13 },
  officerMeta: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    padding: 16
  }
})
