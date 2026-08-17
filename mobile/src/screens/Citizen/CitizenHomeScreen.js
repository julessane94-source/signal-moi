import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import { getCampagnes, getCitizenDashboard, getCitizenSignalements, joinCampagne } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from '../../context/LocationContext'
import PrimaryButton from '../../components/PrimaryButton'
import { REPORT_TYPES } from '../../constants/reportTypes'

export default function CitizenHomeScreen({ navigation }) {
  const { user, signOut } = useAuth()
  const { position, address, requestCurrentLocation } = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [campagnes, setCampagnes] = useState([])
  const [signalements, setSignalements] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    const [dashboardResult, campagnesResult, signalementsResult] = await Promise.allSettled([
      getCitizenDashboard(),
      getCampagnes(),
      getCitizenSignalements()
    ])
    if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value.dashboard || dashboardResult.value.data?.dashboard || dashboardResult.value)
    if (campagnesResult.status === 'fulfilled') {
      const payload = campagnesResult.value
      setCampagnes(payload.campagnes || payload.data?.campagnes || payload.data || payload || [])
    }
    if (signalementsResult.status === 'fulfilled') {
      setSignalements(signalementsResult.value.signalements || signalementsResult.value.data || signalementsResult.value || [])
    }
  }, [])

  useEffect(() => {
    requestCurrentLocation()
    loadData()
  }, [loadData])

  async function refresh() {
    setRefreshing(true)
    try {
      await Promise.all([requestCurrentLocation(), loadData()])
    } finally {
      setRefreshing(false)
    }
  }

  async function handleJoin(campaignId) {
    if (!campaignId) {
      Alert.alert('Campagne indisponible', 'Cette campagne n a pas encore d identifiant valide.')
      return
    }
    try {
      await joinCampagne(campaignId)
      Alert.alert('Inscription envoyee', 'Vous etes inscrit a cette campagne.')
      await loadData()
    } catch (error) {
      Alert.alert('Inscription impossible', error.response?.data?.message || 'Reessayez dans un instant.')
    }
  }

  const locationLabel = address?.city || address?.subregion || address?.region || 'Position precise activee'
  const commonTypes = REPORT_TYPES.filter((type) => [
    'vol', 'probleme_eclairage', 'nid_de_poule', 'dechet', 'eau_sale', 'bruit'
  ].includes(type.type))

  function goToTab(tabName, params) {
    navigation.navigate(tabName, params)
  }

  function openLive(type, description) {
    let rootNavigation = navigation
    while (rootNavigation?.getParent?.()) rootNavigation = rootNavigation.getParent()
    if (!rootNavigation?.navigate) {
      Alert.alert('Live indisponible', 'Reouvrez l application puis reessayez.')
      return
    }
    rootNavigation.navigate('LiveCamera', {
      sessionId: `citizen-live-${Date.now()}`,
      type,
      description
    })
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Bonjour {user?.prenom || user?.name || ''}</Text>
          <Text style={styles.location}>
            <Ionicons name="location" size={14} color={COLORS.primary} /> {locationLabel}
          </Text>
        </View>
        <PrimaryButton title="Sortir" onPress={signOut} style={styles.logout} />
      </View>

      <View style={styles.alertCard}>
        <View style={styles.alertTop}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" />
          <Text style={styles.alertBadge}>Alerte prioritaire</Text>
        </View>
        <Text style={styles.alertTitle}>Vous avez besoin d aide ?</Text>
        <Text style={styles.alertText}>
          Lancez un direct pour une urgence. Votre position sera demandee avant l envoi.
        </Text>
        <View style={styles.urgentActions}>
          <Pressable
            onPress={() => openLive('violence', 'Alerte citoyenne urgente : violence')}
            style={({ pressed }) => [styles.urgentButton, styles.dangerButton, pressed && styles.quickPressed]}
          >
            <Ionicons name="shield" size={18} color="#fff" />
            <Text style={styles.urgentButtonText}>Je suis en danger</Text>
          </Pressable>
          <Pressable
            onPress={() => openLive('accident', 'Alerte citoyenne urgente : accident ou blessure')}
            style={({ pressed }) => [styles.urgentButton, styles.accidentButton, pressed && styles.quickPressed]}
          >
            <Ionicons name="medical" size={18} color="#fff" />
            <Text style={styles.urgentButtonText}>Accident / blessure</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <Stat label="Signalements" value={dashboard?.totalSignalements || dashboard?.stats?.total || 0} icon="document-text" />
        <Stat label="En cours" value={dashboard?.enCours || dashboard?.stats?.enCours || 0} icon="time" />
      </View>

      <View style={styles.quickRow}>
        <Quick label="Signaler" icon="add-circle" tone={COLORS.primary} onPress={() => goToTab('Signaler')} />
        <Quick label="GPS" icon="navigate" tone={COLORS.primary} onPress={async () => {
          const coords = await requestCurrentLocation()
          Alert.alert('GPS', coords ? 'Position mise a jour.' : 'Autorisez la localisation du telephone.')
        }} />
        <Quick label="Suivi" icon="eye" tone="#1d4ed8" onPress={async () => {
          await refresh()
          Alert.alert('Suivi', 'Vos derniers signalements sont actualises.')
        }} />
      </View>

      <View>
        <Text style={styles.sectionTitle}>Signaler rapidement</Text>
        <Text style={styles.sectionHint}>Les situations urgentes se trouvent juste au-dessus.</Text>
        <View style={styles.typeGrid}>
          {commonTypes.map((type) => (
            <Pressable
              key={type.type}
              onPress={() => goToTab('Signaler', { type: type.type })}
              style={({ pressed }) => [styles.typeQuick, pressed && styles.quickPressed]}
            >
              <View style={[styles.typeQuickIcon, { backgroundColor: type.tone }]}>
                <Ionicons name={type.icon} size={18} color="#fff" />
              </View>
              <Text numberOfLines={1} style={styles.typeQuickText}>{type.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => goToTab('Signaler')}
          style={({ pressed }) => [styles.allTypesButton, pressed && styles.quickPressed]}
        >
          <Text style={styles.allTypesText}>Voir tous les types de signalement</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Mes derniers signalements</Text>
      {!signalements.length ? <Text style={styles.empty}>Aucun signalement pour le moment.</Text> : null}
      {signalements.slice(0, 3).map((item) => (
        <View key={item.id || item._id} style={styles.caseCard}>
          <View style={styles.caseTop}>
            <Text style={styles.caseType}>{item.type || 'Signalement'}</Text>
            <Text style={styles.caseStatus}>{item.statut || item.status || 'recu'}</Text>
          </View>
          <Text numberOfLines={2} style={styles.cardText}>{item.description || 'Signalement transmis.'}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Campagnes disponibles</Text>
      {!campagnes.length ? <Text style={styles.empty}>Aucune campagne active actuellement.</Text> : null}
      {campagnes.slice(0, 4).map((campagne) => (
        <View key={campagne.id || campagne._id} style={styles.card}>
          <Text style={styles.cardTitle}>{campagne.titre || campagne.title}</Text>
          <Text numberOfLines={2} style={styles.cardText}>
            {campagne.description || 'Campagne Signal Moi'}
          </Text>
          <PrimaryButton title="Participer" onPress={() => handleJoin(campagne.id || campagne._id)} />
        </View>
      ))}

      {position ? (
        <Text style={styles.coords}>GPS: {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</Text>
      ) : null}
    </ScrollView>
  )
}

function Stat({ label, value, icon }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function Quick({ label, icon, tone, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.quickPressed]}>
      <View style={[styles.quickIcon, { backgroundColor: tone }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <Text style={styles.quickText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbfa'
  },
  content: {
    padding: 20,
    paddingTop: 56,
    gap: 18
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14
  },
  hello: {
    color: COLORS.ink,
    fontSize: 25,
    fontWeight: '900'
  },
  location: {
    color: COLORS.muted,
    marginTop: 6
  },
  logout: {
    minHeight: 42,
    paddingHorizontal: 14
  },
  alertCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 22,
    padding: 22
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  alertBadge: {
    color: '#d9fffa',
    fontWeight: '900'
  },
  alertTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900'
  },
  alertText: {
    color: '#d9fffa',
    fontSize: 15,
    marginTop: 8,
    lineHeight: 22
  },
  urgentActions: {
    marginTop: 18,
    gap: 10
  },
  urgentButton: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  dangerButton: {
    backgroundColor: '#dc2626'
  },
  accidentButton: {
    backgroundColor: '#d97706'
  },
  urgentButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14
  },
  grid: {
    flexDirection: 'row',
    gap: 12
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10
  },
  quick: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    alignItems: 'center',
    gap: 8
  },
  quickPressed: {
    opacity: 0.75
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickText: {
    color: COLORS.ink,
    fontWeight: '900'
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statValue: {
    color: COLORS.ink,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8
  },
  statLabel: {
    color: COLORS.muted,
    marginTop: 4
  },
  sectionTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontWeight: '900'
  },
  sectionHint: {
    color: COLORS.muted,
    marginTop: 4,
    marginBottom: 10,
    fontSize: 13
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9
  },
  typeQuick: {
    width: '47.8%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    paddingHorizontal: 10
  },
  typeQuickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  typeQuickText: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  allTypesButton: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#ecfdf5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  allTypesText: {
    color: COLORS.primary,
    fontWeight: '900'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10
  },
  caseCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8
  },
  caseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  caseType: {
    color: COLORS.ink,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  caseStatus: {
    color: COLORS.primary,
    fontWeight: '900'
  },
  cardTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  cardText: {
    color: COLORS.muted,
    lineHeight: 21
  },
  coords: {
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: 18
  },
  empty: { color: COLORS.muted, textAlign: 'center', paddingVertical: 10 }
})
