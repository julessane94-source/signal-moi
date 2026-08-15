import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { COLORS, resolveMediaUrl } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { getCampagnes, joinCampagne } from '../../services/api'

export default function CampaignsScreen() {
  const [items, setItems] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const data = await getCampagnes()
    setItems(data.campagnes || data.data?.campagnes || data.data || data || [])
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
    try {
      await joinCampagne(id)
      Alert.alert('Inscription confirmee', 'Votre participation est enregistree.')
      await load()
    } catch (error) {
      Alert.alert('Inscription impossible', error.response?.data?.message || 'Reessayez.')
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
            <PrimaryButton title="Participer" onPress={() => participate(item.id || item._id)} />
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
