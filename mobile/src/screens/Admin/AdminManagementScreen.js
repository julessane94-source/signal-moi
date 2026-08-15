import React, { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import VictimActions from '../../components/VictimActions'
import PrimaryButton from '../../components/PrimaryButton'
import {
  createAdminUser, deleteAdminCampagne, deleteAdminSignalement, deleteAdminUser,
  getAdminCampagnes, getAdminSignalementTypes, getAdminSignalements, getAdminUsers,
  updateAdminUser, updateAdminUserSignalementTypes
} from '../../services/api'

const EMPTY_USER = { prenom: '', nom: '', email: '', telephone: '', password: '', ville: 'Sedhiou', quartier: '', role: 'citoyen', stationLatitude: '', stationLongitude: '' }
const RECIPIENT_ROLES = ['collaborateur', 'commissariat']
const ROLES = ['citoyen', 'collaborateur', 'commissariat', 'admin']

export default function AdminManagementScreen() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [signalementTypes, setSignalementTypes] = useState([])
  const [form, setForm] = useState(EMPTY_USER)
  const [selectedTypes, setSelectedTypes] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [u, s, c, types] = await Promise.allSettled([getAdminUsers(), getAdminSignalements(), getAdminCampagnes(), getAdminSignalementTypes()])
    if (u.status === 'fulfilled') setUsers(u.value.users || u.value.data || u.value || [])
    if (s.status === 'fulfilled') setSignalements(s.value.signalements || s.value.data || s.value || [])
    if (c.status === 'fulfilled') setCampagnes(c.value.campagnes || c.value.data || c.value || [])
    if (types.status === 'fulfilled') setSignalementTypes(types.value.types || types.value.data || types.value || [])
  }, [])

  useEffect(() => { load().catch(() => {}) }, [load])

  async function refresh() {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  function resetUserForm() {
    setForm(EMPTY_USER)
    setSelectedTypes([])
    setEditingId(null)
  }

  function changeTab(nextTab) {
    setTab(nextTab)
    if (nextTab !== 'users') resetUserForm()
  }

  function editUser(user) {
    setTab('users')
    setEditingId(user.id || user._id)
    setForm({
      prenom: user.prenom || '', nom: user.nom || '', email: user.email || '', telephone: user.telephone || '', password: '',
      ville: user.ville || 'Sedhiou', quartier: user.quartier || '', role: user.role || 'citoyen',
      stationLatitude: user.station_latitude || '', stationLongitude: user.station_longitude || ''
    })
    setSelectedTypes(Array.isArray(user.signalement_types) ? user.signalement_types : [])
  }

  function toggleType(code) {
    setSelectedTypes((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code])
  }

  async function saveUser() {
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim() || !form.telephone.trim() || (!editingId && !form.password)) {
      Alert.alert('Champs requis', 'Prénom, nom, email, téléphone et mot de passe à la création sont requis.')
      return
    }

    setSaving(true)
    try {
      const payload = { ...form, signalementTypes: selectedTypes }
      if (editingId) {
        const { password, ...updatePayload } = payload
        await updateAdminUser(editingId, updatePayload)
        if (RECIPIENT_ROLES.includes(String(form.role).toLowerCase())) await updateAdminUserSignalementTypes(editingId, selectedTypes)
        Alert.alert('Utilisateur mis à jour', 'Les coordonnées et droits de réception ont été enregistrés.')
      } else {
        await createAdminUser(payload)
        Alert.alert('Utilisateur créé', 'Le nouveau compte est prêt à se connecter.')
      }
      resetUserForm()
      await load()
    } catch (error) {
      Alert.alert('Enregistrement impossible', error.response?.data?.error || error.response?.data?.message || 'Vérifiez les informations saisies.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(type, id) {
    if (!id) return
    try {
      if (type === 'user') await deleteAdminUser(id)
      if (type === 'signalement') await deleteAdminSignalement(id)
      if (type === 'campagne') await deleteAdminCampagne(id)
      Alert.alert('Action effectuée', type === 'user' ? 'Le compte a été désactivé.' : 'L’élément a été supprimé.')
      await load()
    } catch (error) {
      Alert.alert('Action impossible', error.response?.data?.message || 'Réessayez.')
    }
  }

  const data = tab === 'users' ? users : tab === 'signalements' ? signalements : campagnes
  const isRecipient = RECIPIENT_ROLES.includes(String(form.role).toLowerCase())

  function UsersHeader() {
    if (tab !== 'users') return null
    return (
      <View style={styles.formCard}>
        <View style={styles.formHeading}>
          <View><Text style={styles.formTitle}>{editingId ? 'Modifier un utilisateur' : 'Créer un utilisateur'}</Text><Text style={styles.formSubtitle}>Informations, rôle et droits de réception.</Text></View>
          {editingId ? <Pressable onPress={resetUserForm}><Text style={styles.cancel}>Annuler</Text></Pressable> : null}
        </View>
        <View style={styles.twoColumns}><Field label="Prénom" value={form.prenom} onChangeText={(value) => setForm({ ...form, prenom: value })} /><Field label="Nom" value={form.nom} onChangeText={(value) => setForm({ ...form, nom: value })} /></View>
        <Field label="Email" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(value) => setForm({ ...form, email: value })} />
        <Field label="Téléphone" value={form.telephone} keyboardType="phone-pad" onChangeText={(value) => setForm({ ...form, telephone: value })} />
        {!editingId ? <Field label="Mot de passe initial" value={form.password} secureTextEntry onChangeText={(value) => setForm({ ...form, password: value })} /> : null}
        <View style={styles.twoColumns}><Field label="Ville" value={form.ville} onChangeText={(value) => setForm({ ...form, ville: value })} /><Field label="Quartier" value={form.quartier} onChangeText={(value) => setForm({ ...form, quartier: value })} /></View>
        <Text style={styles.fieldLabel}>Rôle</Text>
        <View style={styles.chips}>{ROLES.map((role) => <Chip key={role} label={role} selected={form.role === role} onPress={() => { setForm({ ...form, role }); if (!RECIPIENT_ROLES.includes(role)) setSelectedTypes([]) }} />)}</View>
        {form.role === 'commissariat' ? <View style={styles.twoColumns}><Field label="Latitude du commissariat" value={String(form.stationLatitude)} keyboardType="decimal-pad" onChangeText={(value) => setForm({ ...form, stationLatitude: value })} /><Field label="Longitude du commissariat" value={String(form.stationLongitude)} keyboardType="decimal-pad" onChangeText={(value) => setForm({ ...form, stationLongitude: value })} /></View> : null}
        {isRecipient ? <><Text style={styles.fieldLabel}>Types de signalements reçus</Text><Text style={styles.help}>Modifiables à tout moment pour ce {form.role}.</Text><View style={styles.chips}>{signalementTypes.map((item) => <Chip key={item.code} label={item.label || item.code} selected={selectedTypes.includes(item.code)} onPress={() => toggleType(item.code)} />)}</View></> : null}
        <PrimaryButton title={saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer le compte'} onPress={saveUser} disabled={saving} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Gestion admin" subtitle="Comptes, droits, signalements et campagnes" />
      <View style={styles.tabs}><Tab label="Utilisateurs" active={tab === 'users'} onPress={() => changeTab('users')} /><Tab label="Signalements" active={tab === 'signalements'} onPress={() => changeTab('signalements')} /><Tab label="Campagnes" active={tab === 'campagnes'} onPress={() => changeTab('campagnes')} /></View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => String(item.id || item._id || index)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListHeaderComponent={<UsersHeader />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <View style={styles.card}>
          <Text style={styles.title}>{item.titre || item.title || `${item.prenom || ''} ${item.nom || ''}`.trim() || item.email || 'Élément'}</Text>
          <Text style={styles.meta}>{item.role || item.type || item.statut || item.status || 'Signal Moi'}</Text>
          {tab === 'users' ? <Text style={styles.contact}>{[item.telephone, item.email, [item.quartier, item.ville].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</Text> : null}
          {tab === 'users' && Array.isArray(item.signalement_types) && item.signalement_types.length ? <Text style={styles.rights}>Reçoit : {item.signalement_types.join(', ')}</Text> : null}
          {tab === 'signalements' ? <VictimActions item={item} compact /> : null}
          {tab === 'users' ? <PrimaryButton title="Modifier le compte" onPress={() => editUser(item)} /> : null}
          <Pressable style={styles.deleteButton} onPress={() => remove(tab === 'users' ? 'user' : tab === 'signalements' ? 'signalement' : 'campagne', item.id || item._id)}><Ionicons name={tab === 'users' ? 'person-remove' : 'trash'} size={18} color="#fff" /><Text style={styles.deleteText}>{tab === 'users' ? 'Désactiver le compte' : 'Supprimer'}</Text></Pressable>
        </View>}
        ListEmptyComponent={<Text style={styles.empty}>Aucune donnée chargée.</Text>}
      />
    </View>
  )
}

function Field({ label, ...props }) { return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.input} placeholder={label} placeholderTextColor="#82909d" {...props} /></View> }
function Chip({ label, selected, onPress }) { return <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable> }
function Tab({ label, active, onPress }) { return <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}><Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text></Pressable> }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' }, tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 }, tab: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }, tabActive: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark }, tabText: { color: COLORS.muted, fontSize: 12, fontWeight: '900' }, tabTextActive: { color: '#fff' },
  list: { padding: 20, paddingTop: 0, gap: 12, paddingBottom: 32 }, formCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 11, marginBottom: 4 }, formHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }, formTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900' }, formSubtitle: { color: COLORS.muted, marginTop: 3, fontSize: 12 }, cancel: { color: COLORS.primaryDark, fontWeight: '900', padding: 4 },
  field: { flex: 1, gap: 5 }, fieldLabel: { color: COLORS.ink, fontSize: 12, fontWeight: '900' }, input: { minHeight: 45, borderRadius: 12, backgroundColor: '#f3f7f6', borderWidth: 1, borderColor: '#dce9e5', color: COLORS.ink, paddingHorizontal: 11 }, twoColumns: { flexDirection: 'row', gap: 10 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, backgroundColor: '#fff', paddingHorizontal: 11, paddingVertical: 8 }, chipSelected: { backgroundColor: COLORS.primaryDark, borderColor: COLORS.primaryDark }, chipText: { color: COLORS.muted, fontSize: 12, fontWeight: '800' }, chipTextSelected: { color: '#fff' }, help: { color: COLORS.muted, fontSize: 12, marginTop: -6 },
  card: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16, gap: 9 }, title: { color: COLORS.ink, fontSize: 17, fontWeight: '900' }, meta: { color: COLORS.primary, fontWeight: '900', textTransform: 'capitalize' }, contact: { color: COLORS.muted, lineHeight: 19 }, rights: { color: COLORS.primaryDark, fontSize: 12, fontWeight: '800' }, deleteButton: { minHeight: 44, borderRadius: 14, backgroundColor: COLORS.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, deleteText: { color: '#fff', fontWeight: '900' }, empty: { textAlign: 'center', color: COLORS.muted, padding: 20 }
})
