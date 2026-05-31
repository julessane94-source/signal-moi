import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, FormField, Input, Modal, DataTable, StatBox, Badge } from '../../components/ui'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'
import {
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const getImageUrl = (url) => {
  if (!url) return null
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen'
  })
  const [errors, setErrors] = useState({})
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [deleteReason, setDeleteReason] = useState('')
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null) // 'signalement' ou 'campagne'
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'Signal-Moi',
    contactEmail: 'contact@signal-moi.com',
    contactPhone: '+237 600 000 000',
    address: 'Yaounde, Cameroun',
    contactPage: {
      title: 'Contactez-nous',
      content: 'Pour toute question, contactez-nous.',
      images: [],
      videos: []
    },
    aboutPage: {
      title: 'A propos',
      content: 'Signal-Moi est une plateforme...',
      images: [],
      videos: []
    },
    homePage: {
      title: 'Accueil',
      heroText: 'Votre voix compte',
      content: 'Bienvenue sur Signal-Moi',
      images: [],
      videos: []
    },
    socialLinks: {
      facebook: '',
      whatsapp: '',
      twitter: '',
      instagram: ''
    }
    ,
    emergencyPolice: '',
    emergencyFire: ''
  })
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSignalements: 0,
    totalCampagnes: 0,
    activeUsers: 0
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      window.location.href = '/'
    }
    if (!loading && user?.role === 'admin') {
      fetchUsers()
      fetchSiteConfig()
      fetchStats()
    }
  }, [user, loading])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur fetchUsers:', error)
      toast.error('Erreur de chargement des utilisateurs')
    }
  }

  const fetchSiteConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/site-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSiteConfig(prev => ({
          ...prev,
          siteName: data.siteName || prev.siteName,
          contactEmail: data.contactEmail || prev.contactEmail,
          contactPhone: data.contactPhone || prev.contactPhone,
          address: data.address || prev.address,
          contactPage: data.contact_page || data.contactPage || prev.contactPage,
          aboutPage: data.about_page || data.aboutPage || prev.aboutPage,
          homePage: data.home_page || data.homePage || prev.homePage
          emergencyPolice: data.emergency_police || data.emergencyPolice || prev.emergencyPolice,
          emergencyFire: data.emergency_fire || data.emergencyFire || prev.emergencyFire
        }))
      }
    } catch (error) {
      console.error('Erreur fetchSiteConfig:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const [signalementsRes, campagnesRes] = await Promise.all([
        fetch(`${base}/api/admin/signalements`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${base}/api/campagnes`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      const signalementsData = signalementsRes.ok ? await signalementsRes.json() : []
      const campagnesData = campagnesRes.ok ? await campagnesRes.json() : []
      setSignalements(Array.isArray(signalementsData) ? signalementsData : [])
      setCampagnes(Array.isArray(campagnesData) ? campagnesData : [])
      setStats(prev => ({
        ...prev,
        totalSignalements: Array.isArray(signalementsData) ? signalementsData.length : 0,
        totalCampagnes: Array.isArray(campagnesData) ? campagnesData.length : 0
      }))
    } catch (error) {
      console.error('Erreur fetchStats:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.prenom) newErrors.prenom = 'Prénom requis'
    if (!formData.nom) newErrors.nom = 'Nom requis'
    if (!formData.email) newErrors.email = 'Email requis'
    if (!formData.telephone) newErrors.telephone = 'Téléphone requis'
    if (!editingUser && !formData.password) newErrors.password = 'Mot de passe requis'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const url = editingUser 
        ? `${base}/api/admin/users/${editingUser.id}`
        : `${base}/api/admin/users`
      const method = editingUser ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || 'Erreur lors de la création')
      }
      toast.success(editingUser ? '✅ Utilisateur modifié' : '✅ Utilisateur créé')
      setShowModal(false)
      setEditingUser(null)
      setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen' })
      setErrors({})
      fetchUsers()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Désactiver cet utilisateur ? Cette action est irréversible.')) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }
      toast.success('✅ Utilisateur désactivé')
      fetchUsers()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const resetPassword = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      await fetch(`${base}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('✅ Mot de passe réinitialisé à "Default123!"')
    } catch (error) {
      toast.error('❌ Erreur')
    }
  }

  const changeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      await fetch(`${base}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      toast.success('✅ Rôle modifié')
      fetchUsers()
    } catch (error) {
      toast.error('❌ Erreur')
    }
  }

  const deleteSignalement = async () => {
    if (!itemToDelete) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/signalements/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason || 'Signalement supprimé par l\'administrateur' })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }
      toast.success('✅ Signalement supprimé et notification envoyée')
      setItemToDelete(null)
      setDeleteReason('')
      setDeleteType(null)
      fetchStats()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const deleteCampagne = async () => {
    if (!itemToDelete) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/campagnes/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason || 'Campagne supprimée par l\'administrateur' })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }
      toast.success('✅ Campagne supprimée et notifications envoyées')
      setItemToDelete(null)
      setDeleteReason('')
      setDeleteType(null)
      fetchStats()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  // About page helpers: partners and team
  const addPartner = () => {
    setSiteConfig(prev => ({
      ...prev,
      aboutPage: {
        ...(prev.aboutPage || {}),
        partners: [...(prev.aboutPage?.partners || []), { name: '', url: '' }]
      }
    }))
  }

  const updatePartner = (idx, field, value) => {
    setSiteConfig(prev => {
      const partners = (prev.aboutPage?.partners || []).slice()
      partners[idx] = { ...(partners[idx] || {}), [field]: value }
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), partners } }
    })
  }

  const removePartner = (idx) => {
    setSiteConfig(prev => {
      const partners = (prev.aboutPage?.partners || []).slice()
      partners.splice(idx, 1)
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), partners } }
    })
  }

  const addTeamMember = () => {
    setSiteConfig(prev => ({
      ...prev,
      aboutPage: {
        ...(prev.aboutPage || {}),
        team: [...(prev.aboutPage?.team || []), { name: '', role: '' }]
      }
    }))
  }

  const updateTeamMember = (idx, field, value) => {
    setSiteConfig(prev => {
      const team = (prev.aboutPage?.team || []).slice()
      team[idx] = { ...(team[idx] || {}), [field]: value }
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), team } }
    })
  }

  const removeTeamMember = (idx) => {
    setSiteConfig(prev => {
      const team = (prev.aboutPage?.team || []).slice()
      team.splice(idx, 1)
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), team } }
    })
  }

  const saveConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const payload = {
        siteName: siteConfig.siteName,
        contactEmail: siteConfig.contactEmail,
        contactPhone: siteConfig.contactPhone,
        address: siteConfig.address,
        contactPage: siteConfig.contactPage,
        aboutPage: siteConfig.aboutPage,
        homePage: siteConfig.homePage
      }
      // Include social links if present
      if (siteConfig.socialLinks) payload.socialLinks = siteConfig.socialLinks

      // Ensure aboutPage contains partners/team arrays
      payload.aboutPage = payload.aboutPage || {}
      payload.aboutPage.partners = payload.aboutPage.partners || siteConfig.aboutPage?.partners || []
      payload.aboutPage.team = payload.aboutPage.team || siteConfig.aboutPage?.team || []

      const res = await fetch(`${base}/api/admin/site-config`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      toast.success('✅ Configuration sauvegardée')
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const statsData = {
    totalUsers: users.length,
    totalSignalements: stats.totalSignalements,
    totalCampagnes: stats.totalCampagnes,
    activeUsers: users.filter(u => u.is_active !== false).length
  }

  const openModal = (userData = null) => {
    if (userData) {
      setEditingUser(userData)
      setFormData(userData)
    } else {
      setEditingUser(null)
      setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen' })
    }
    setErrors({})
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <ChartBarIcon className="h-10 w-10 text-indigo-600" />
              Tableau de bord administrateur
            </h1>
            <p className="text-gray-600 mt-2">Gérez les utilisateurs, les signalements et la configuration du site</p>
          </motion.div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: ChartBarIcon },
              { id: 'users', label: 'Utilisateurs', icon: UserGroupIcon },
              { id: 'signalements', label: 'Signalements', icon: DocumentTextIcon },
              { id: 'campagnes', label: 'Campagnes', icon: ChartBarIcon },
              { id: 'config', label: 'Configuration', icon: CogIcon }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Dashboard Tab - Stats */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatBox
                  title="Total utilisateurs"
                  value={statsData.totalUsers}
                  color="indigo"
                  icon={UserGroupIcon}
                />
                <StatBox
                  title="Signalements"
                  value={statsData.totalSignalements}
                  color="red"
                  icon={DocumentTextIcon}
                />
                <StatBox
                  title="Campagnes actives"
                  value={statsData.totalCampagnes}
                  color="blue"
                  icon={ChartBarIcon}
                />
                <StatBox
                  title="Utilisateurs actifs"
                  value={statsData.activeUsers}
                  color="green"
                  icon={UserGroupIcon}
                />
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-end">
                <Button icon={PlusIcon} onClick={() => openModal()}>
                  Ajouter un utilisateur
                </Button>
              </div>

              <DataTable
                columns={[
                  { key: 'prenom', label: 'Prénom' },
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Rôle', render: (role) => <Badge variant="info">{role}</Badge> },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (_, user) => (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => openModal(user)}
                          className="p-2 hover:bg-indigo-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <PencilIcon className="h-4 w-4 text-indigo-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => resetPassword(user.id)}
                          className="p-2 hover:bg-yellow-50 rounded-lg transition"
                          title="Réinitialiser mot de passe"
                        >
                          <KeyIcon className="h-4 w-4 text-yellow-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Désactiver"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </motion.button>
                      </div>
                    )
                  }
                ]}
                data={users}
                emptyMessage="Aucun utilisateur trouvé"
              />
            </motion.div>
          )}

          {/* Signalements Tab */}
          {activeTab === 'signalements' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {signalements.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">Aucun signalement disponible</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {signalements.map((s, idx) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="p-6 hover:shadow-lg transition">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{s.titre}</h3>
                              <Badge variant="success">{s.statut}</Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{s.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>📍 {s.localisation}</span>
                              <span>👤 {s.author?.prenom} {s.author?.nom}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {Array.isArray(s.fichiers) && s.fichiers[0] && (
                              <img src={s.fichiers[0]} alt="aperçu" className="w-20 h-20 object-cover rounded-lg" />
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => {
                                setItemToDelete(s.id)
                                setDeleteType('signalement')
                                setDeleteReason('')
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                              title="Supprimer ce signalement"
                            >
                              <TrashIcon className="h-5 w-5 text-red-600" />
                            </motion.button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Campagnes Tab */}
          {activeTab === 'campagnes' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {campagnes.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">Aucune campagne disponible</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {campagnes.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="p-6 hover:shadow-lg transition">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{c.titre}</h3>
                              <Badge variant="info">{c.statut || 'active'}</Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{c.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>📅 Création: {new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                              <span>👤 {c.createur?.prenom} {c.createur?.nom}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getImageUrl(c.image_url || c.image) && (
                              <img src={getImageUrl(c.image_url || c.image)} alt="aperçu" className="w-20 h-20 object-cover rounded-lg" />
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => {
                                setItemToDelete(c.id)
                                setDeleteType('campagne')
                                setDeleteReason('')
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                              title="Supprimer cette campagne"
                            >
                              <TrashIcon className="h-5 w-5 text-red-600" />
                            </motion.button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'config' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration du site</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Nom du site">
                      <Input
                        value={siteConfig.siteName}
                        onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})}
                      />
                    </FormField>
                    <FormField label="Email de contact">
                      <Input
                        type="email"
                        value={siteConfig.contactEmail}
                        onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <FormField label="Numéro Police">
                      <Input
                        value={siteConfig.emergencyPolice}
                        onChange={e => setSiteConfig({...siteConfig, emergencyPolice: e.target.value})}
                        placeholder="Ex: +237 6XXXXXXXX"
                      />
                    </FormField>
                    <FormField label="Numéro Sapeurs‑pompiers">
                      <Input
                        value={siteConfig.emergencyFire}
                        onChange={e => setSiteConfig({...siteConfig, emergencyFire: e.target.value})}
                        placeholder="Ex: +237 6XXXXXXXX"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Téléphone">
                      <Input
                        value={siteConfig.contactPhone}
                        onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})}
                      />
                    </FormField>
                    <FormField label="Adresse">
                      <Input
                        value={siteConfig.address}
                        onChange={e => setSiteConfig({...siteConfig, address: e.target.value})}
                      />
                    </FormField>
                  </div>

                  {/* Pages éditables: Home, About, Contact */}
                  <div className="space-y-6 mt-6">
                    <h3 className="text-lg font-semibold">Accueil (Home Page)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Titre">
                        <Input
                          value={siteConfig.homePage?.title}
                          onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, title: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Contenu">
                        <textarea
                          value={siteConfig.homePage?.content}
                          onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, content: e.target.value}})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </FormField>
                    </div>

                    <h3 className="text-lg font-semibold">À propos (About Page)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Titre">
                        <Input
                          value={siteConfig.aboutPage?.title}
                          onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, title: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Contenu">
                        <textarea
                          value={siteConfig.aboutPage?.content}
                          onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, content: e.target.value}})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </FormField>
                      {/* Partners list */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Nos partenaires</h4>
                          <Button size="sm" onClick={addPartner}>Ajouter partenaire</Button>
                        </div>
                        <div className="space-y-2 mt-3">
                          {(siteConfig.aboutPage?.partners || []).map((p, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input placeholder="Nom" value={p.name || ''} onChange={e => updatePartner(idx, 'name', e.target.value)} />
                              <Input placeholder="URL" value={p.url || ''} onChange={e => updatePartner(idx, 'url', e.target.value)} />
                              <Button size="sm" variant="danger" onClick={() => removePartner(idx)}>Supprimer</Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team list */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Notre équipe</h4>
                          <Button size="sm" onClick={addTeamMember}>Ajouter membre</Button>
                        </div>
                        <div className="space-y-2 mt-3">
                          {(siteConfig.aboutPage?.team || []).map((m, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input placeholder="Nom" value={m.name || ''} onChange={e => updateTeamMember(idx, 'name', e.target.value)} />
                              <Input placeholder="Rôle" value={m.role || ''} onChange={e => updateTeamMember(idx, 'role', e.target.value)} />
                              <Button size="sm" variant="danger" onClick={() => removeTeamMember(idx)}>Supprimer</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold">Contact (Contact Page)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Titre">
                        <Input
                          value={siteConfig.contactPage?.title}
                          onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, title: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Contenu">
                        <textarea
                          value={siteConfig.contactPage?.content}
                          onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, content: e.target.value}})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Réseaux sociaux */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold">Réseaux sociaux</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Button size="sm" variant="secondary" onClick={() => {
                        const imported = {
                          contactPhone: '778851691',
                          contactEmail: 'contact@signal-moi.com/julessane94@gmail.com',
                          address: 'Sedhiou, Senegal',
                          contactPage: {
                            title: 'Contactez-nous',
                            content: `Pour toute question ou suggestion, n'hésitez pas à nous contacter. Notre équipe est disponible pour vous aider.`
                          },
                          socialLinks: {
                            facebook: 'https://www.fb.com/l/6lp1kJRRR',
                            whatsapp: '+221778851691',
                            twitter: '',
                            instagram: ''
                          }
                          // include emergency numbers
                          if (siteConfig.emergencyPolice) payload.emergencyPolice = siteConfig.emergencyPolice
                          if (siteConfig.emergencyFire) payload.emergencyFire = siteConfig.emergencyFire
                        }
                        setSiteConfig(prev => ({ ...prev, ...imported }))
                      }}>
                        Importer mes coordonnées
                      </Button>

                      <Button size="sm" variant="primary" onClick={async () => {
                        const imported = {
                          contactPhone: '778851691',
                          contactEmail: 'contact@signal-moi.com/julessane94@gmail.com',
                          address: 'Sedhiou, Senegal',
                          contactPage: {
                            title: 'Contactez-nous',
                            content: `Pour toute question ou suggestion, n'hésitez pas à nous contacter. Notre équipe est disponible pour vous aider.`
                          },
                          socialLinks: {
                            facebook: 'https://www.fb.com/l/6lp1kJRRR',
                            whatsapp: '+221778851691',
                            twitter: '',
                            instagram: ''
                          }
                        }
                        // Update UI immediately
                        setSiteConfig(prev => ({ ...prev, ...imported }))
                        // Save to backend using existing saveConfig logic but with payload
                        try {
                          const token = localStorage.getItem('token')
                          const base = API_BASE
                          const payload = {
                            siteName: siteConfig.siteName,
                            contactEmail: imported.contactEmail,
                            contactPhone: imported.contactPhone,
                            address: imported.address,
                            contactPage: imported.contactPage,
                            aboutPage: siteConfig.aboutPage,
                            homePage: siteConfig.homePage,
                            socialLinks: imported.socialLinks
                          }
                          const res = await fetch(`${base}/api/admin/site-config`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          })
                          if (!res.ok) {
                            const err = await res.json()
                            toast.error('Erreur sauvegarde: ' + (err.error || err.message || ''))
                            return
                          }
                          toast.success('✅ Coordonnées importées et sauvegardées')
                        } catch (e) {
                          console.error('Erreur import+save:', e)
                          toast.error('Erreur lors de la sauvegarde')
                        }
                      }}>
                        Importer et sauvegarder
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <FormField label="Facebook (URL)">
                        <Input
                          value={siteConfig.socialLinks?.facebook}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, facebook: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="WhatsApp (numéro)">
                        <Input
                          value={siteConfig.socialLinks?.whatsapp}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, whatsapp: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Twitter (URL)">
                        <Input
                          value={siteConfig.socialLinks?.twitter}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, twitter: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Instagram (URL)">
                        <Input
                          value={siteConfig.socialLinks?.instagram}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, instagram: e.target.value}})}
                        />
                      </FormField>
                    </div>

                    <div className="pt-4">
                      <Button onClick={() => saveConfig()} variant="primary">
                        Sauvegarder la configuration
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal Delete Confirmation */}
      <Modal
        isOpen={itemToDelete !== null}
        onClose={() => {
          setItemToDelete(null)
          setDeleteReason('')
          setDeleteType(null)
        }}
        title={deleteType === 'signalement' ? 'Supprimer un signalement' : 'Supprimer une campagne'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {deleteType === 'signalement' 
              ? 'Êtes-vous sûr de vouloir supprimer ce signalement ? L\'auteur recevra une notification.'
              : 'Êtes-vous sûr de vouloir supprimer cette campagne ? Tous les participants recevront une notification.'}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Raison de la suppression (optionnel)</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Expliquez pourquoi ce contenu est supprimé..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="3"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setItemToDelete(null)
                setDeleteReason('')
                setDeleteType(null)
              }}
              className="flex-1 border rounded py-2 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => deleteType === 'signalement' ? deleteSignalement() : deleteCampagne()}
              className="flex-1 bg-red-600 text-white rounded py-2 hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Create/Edit User */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingUser(null)
          setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen' })
          setErrors({})
        }}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Prénom" error={errors.prenom} required>
              <Input
                name="prenom"
                placeholder="Jean"
                value={formData.prenom}
                onChange={handleInputChange}
                error={!!errors.prenom}
              />
            </FormField>
            <FormField label="Nom" error={errors.nom} required>
              <Input
                name="nom"
                placeholder="Dupont"
                value={formData.nom}
                onChange={handleInputChange}
                error={!!errors.nom}
              />
            </FormField>
          </div>

          <FormField label="Email" error={errors.email} required>
            <Input
              type="email"
              name="email"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Téléphone" error={errors.telephone} required>
              <Input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                error={!!errors.telephone}
              />
            </FormField>
            <FormField label="Rôle">
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="citoyen">Citoyen</option>
                <option value="police">Police</option>
                <option value="collaborateur">Collaborateur</option>
                <option value="admin">Admin</option>
              </select>
            </FormField>
          </div>

          {!editingUser && (
            <FormField label="Mot de passe" error={errors.password} required>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
              />
            </FormField>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editingUser ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
