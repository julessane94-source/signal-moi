import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { COLORS } from '../../config/env'
import PrimaryButton from '../../components/PrimaryButton'
import ScreenHeader from '../../components/ScreenHeader'
import VictimActions from '../../components/VictimActions'
import {
  createCollaboratorCampaign,
  createPlaidoyer,
  followCase,
  getCampaignRegistrants,
  getCollaboratorCampaigns,
  getCollaboratorSignalements,
  getPlaidoyerSignatures,
  getPlaidoyers
} from '../../services/api'

export default function CollaboratorWorkScreen() {
  const [tab, setTab] = useState('signalements')
  const [signalements, setSignalements] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [plaidoyers, setPlaidoyers] = useState([])
  const [details, setDetails] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const load = useCallback(async () => {
    const [s, c, p] = await Promise.allSettled([
      getCollaboratorSignalements(),
      getCollaboratorCampaigns(),
      getPlaidoyers()
    ])
    if (s.status === 'fulfilled') setSignalements(s.value.signalements || s.value.data || s.value || [])
    if (c.status === 'fulfilled') setCampaigns(c.value.campaigns || c.value.campagnes || c.value.data || c.value || [])
    if (p.status === 'fulfilled') setPlaidoyers(p.value.plaidoyers || p.value.data || p.value || [])
  }, [])

  useEffect(() => { load().catch(() => {}) }, [load])

  async function refresh() {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  async function submitCreate() {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Donnez un titre.')
      return
    }
    try {
      if (tab === 'campaigns') {
        const today = new Date()
        const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        await createCollaboratorCampaign({
          titre: title,
          description,
          type: 'sensibilisation',
          dateDebut: today.toISOString().slice(0, 10),
          dateFin: nextMonth.toISOString().slice(0, 10),
          lieu: 'Sedhiou',
          capaciteMax: 100
        })
      } else if (tab === 'plaidoyers') {
        await createPlaidoyer({ titre: title, description, categorie: 'general', objectif_signatures: 1000 })
      }
      setTitle('')
      setDescription('')
      Alert.alert('Creation effectuee', 'Element cree avec succes.')
      await load()
    } catch (error) {
      Alert.alert('Creation impossible', error.response?.data?.message || 'Verifiez les champs.')
    }
  }

  async function loadDetails(type, item) {
    const id = item.id || item._id
    if (!id) return
    try {
      const data = type === 'campaign'
        ? await getCampaignRegistrants(id)
        : await getPlaidoyerSignatures(id)
      setDetails((current) => ({ ...current, [id]: data.inscrits || data.signatures || data.data || data || [] }))
    } catch (error) {
      Alert.alert('Details indisponibles', error.response?.data?.message || 'Reessayez.')
    }
  }

  const data = tab === 'signalements' ? signalements : tab === 'campaigns' ? campaigns : plaidoyers

  return (
    <View style={styles.container}>
      <ScreenHeader title="Travail collaborateur" subtitle="Dossiers, campagnes, plaidoyers" />
      <View style={styles.tabs}>
        <Tab label="Signalements" active={tab === 'signalements'} onPress={() => setTab('signalements')} />
        <Tab label="Campagnes" active={tab === 'campaigns'} onPress={() => setTab('campaigns')} />
        <Tab label="Plaidoyers" active={tab === 'plaidoyers'} onPress={() => setTab('plaidoyers')} />
      </View>
      {tab !== 'signalements' ? (
        <View style={styles.form}>
          <TextInput value={title} onChangeText={setTitle} placeholder="Titre" style={styles.input} />
          <TextInput value={description} onChangeText={setDescription} placeholder="Description" style={styles.input} />
          <PrimaryButton title={tab === 'campaigns' ? 'Creer une campagne' : 'Creer un plaidoyer'} onPress={submitCreate} />
        </View>
      ) : null}
      <FlatList
        data={data}
        keyExtractor={(item, index) => String(item.id || item._id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const id = item.id || item._id
          const itemDetails = details[id] || []
          return (
            <View style={styles.card}>
              <Text style={styles.title}>{item.titre || item.title || item.type || 'Dossier'}</Text>
              <Text numberOfLines={3} style={styles.text}>{item.description || item.localisation || 'Information Signal Moi'}</Text>
              {tab === 'signalements' ? (
                <>
                  <VictimActions item={item} compact />
                  <PrimaryButton title="Suivre" onPress={() => followCase(id)} />
                </>
              ) : (
                <>
                  <PrimaryButton title={tab === 'campaigns' ? 'Voir les inscrits' : 'Voir les signatures'} onPress={() => loadDetails(tab === 'campaigns' ? 'campaign' : 'plaidoyer', item)} />
                  {itemDetails.slice(0, 4).map((detail, index) => (
                    <Text key={index} style={styles.detail}>{detail.nom || detail.prenom || detail.email || JSON.stringify(detail)}</Text>
                  ))}
                </>
              )}
            </View>
          )
        }}
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
  tab: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '900' },
  tabTextActive: { color: '#fff' },
  form: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 14, gap: 10 },
  input: { minHeight: 48, borderRadius: 12, backgroundColor: '#f4f8f7', paddingHorizontal: 12 },
  list: { padding: 20, paddingTop: 0, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 10 },
  title: { color: COLORS.ink, fontSize: 17, fontWeight: '900' },
  text: { color: COLORS.muted, lineHeight: 21 },
  detail: { color: COLORS.primaryDark, fontWeight: '800' },
  empty: { color: COLORS.muted, textAlign: 'center', padding: 20 }
})
