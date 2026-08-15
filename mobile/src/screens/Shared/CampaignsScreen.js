import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { COLORS, resolveMediaUrl } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { getCampagnes, getCampaignRegistrationStatus, joinCampagne } from '../../services/api'

export default function CampaignsScreen() {
  const [items, setItems] = useState([])
  const [registrations, setRegistrations] = useState({})
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const data = await getCampagnes()
    const rawCampaigns = data.campagnes || data.data?.campagnes || data.data || data || []
    const campaigns = Array.isArray(rawCampaigns) ? rawCampaigns : []
    setItems(campaigns)
    const statuses = await Promise.allSettled(campaigns.map(async (item) => {
      const id = item.id || item._id
      if (!id) return null
      const result = await getCampaignRegistrationStatus(id)
      return [id, Boolean(result.isInscribed)]
    }))
    setRegistrations(Object.fromEntries(statuses.filter((result) => result.status === 'fulfilled' && result.value).map((result) => result.value)))
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

  async function participate(id) {
    if (registrations[id]) return
    try {
      await joinCampagne(id)
      setRegistrations((current) => ({ ...current, [id]: true }))
      Alert.alert('Inscription confirmee', 'Votre participation est enregistree.')
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Réessayez.'
      if (String(message).toLowerCase().includes('déjà inscrit') || String(message).toLowerCase().includes('deja inscrit')) {
        setRegistrations((current) => ({ ...current, [id]: true }))
        Alert.alert('Déjà inscrit', 'Votre participation à cette campagne est déjà enregistrée.')
        return
      }
      Alert.alert('Inscription impossible', message)
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Campagnes" subtitle="Participer aux actions locales" />
      <FlatList
        data={items}
        keyExtractor={(item, index) => String(item.id || item._id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image || item.image_url ? <Image source={{ uri: resolveMediaUrl(item.image || item.image_url) }} style={styles.image} /> : null}
            <Text style={styles.title}>{item.titre || item.title || 'Campagne'}</Text>
            <Text numberOfLines={4} style={styles.text}>{item.description || 'Action communautaire Signal Moi.'}</Text>
            <Text style={styles.meta}>{item.lieu || item.location || 'Sédhiou'}{item.dateDebut || item.date_debut ? ` · Dès le ${String(item.dateDebut || item.date_debut).slice(0, 10)}` : ''}</Text>
            <PrimaryButton title={registrations[item.id || item._id] ? 'Participation confirmée' : 'Participer'} disabled={registrations[item.id || item._id]} onPress={() => participate(item.id || item._id)} />
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune campagne chargee.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  list: { padding: 20, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 10
  },
  image: { width: '100%', height: 155, borderRadius: 13, backgroundColor: '#edf2f1' },
  title: { color: COLORS.ink, fontSize: 18, fontWeight: '900' },
  text: { color: COLORS.muted, lineHeight: 21 },
  meta: { color: COLORS.primary, fontWeight: '800' },
  empty: { color: COLORS.muted, textAlign: 'center', padding: 18 }
})
