import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
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
    }
  })
  
  const [signalements, setSignalements] = useState([])
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
      <Navbar />
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
                          {Array.isArray(s.fichiers) && s.fichiers[0] && (
                            <img src={s.fichiers[0]} alt="aperçu" className="w-20 h-20 object-cover rounded-lg" />
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Configuration Tab */}
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

                  <Button onClick={saveConfig} variant="primary">
                    Sauvegarder la configuration
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

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
          {/* En-tete */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            {activeTab === 'users' && (
              <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                + Creer utilisateur
              </button>
            )}
          </div>

          {/* Onglets */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button onClick={() => setActiveTab('users')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>👥 Utilisateurs</button>
              <button onClick={() => setActiveTab('signalements')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'signalements' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>📋 Signalements</button>
              <button onClick={() => setActiveTab('config')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'config' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>⚙️ Configuration</button>
              <button onClick={() => setActiveTab('stats')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'stats' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>📊 Supervision</button>
              <button onClick={() => setActiveTab('profile')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500'}`}>👤 Mon profil</button>
            </nav>
          </div>

          {/* Onglet Utilisateurs - Gestion complete */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Utilisateur</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Role</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4"><div className="font-medium">{u.prenom} {u.nom}</div><div className="text-sm text-gray-500">{u.telephone}</div></td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4"><select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="border rounded px-2 py-1 text-sm"><option value="citoyen">Citoyen</option><option value="police">Police</option><option value="collaborateur">Collaborateur</option><option value="admin">Admin</option></select></td>
                      <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => { setEditingUser(u); setFormData(u); setShowModal(true); }} className="text-indigo-600">✏️</button><button onClick={() => resetPassword(u.id)} className="text-yellow-600">🔑</button><button onClick={() => deleteUser(u.id)} className="text-red-600">🗑️</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Onglet Signalements - liste détaillée */}
          {activeTab === 'signalements' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Signalements</h2>
              {signalements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">Aucun signalement disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {signalements.map(s => (
                    <div key={s.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</span>
                            <span className="text-sm text-gray-600">Par: {s.author?.prenom} {s.author?.nom}</span>
                          </div>
                          <h3 className="font-semibold text-lg">{s.titre}</h3>
                          <p className="text-gray-600 mt-1">{s.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span>📍 {s.localisation}</span>
                            <span>📎 {Array.isArray(s.fichiers) ? s.fichiers.length : Object.keys(s.fichiers || {}).length} pièce(s) jointe(s)</span>
                            {s.author?.telephone && (
                              <a href={`https://wa.me/${s.author.telephone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="ml-2 text-green-600">WhatsApp</a>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Statut: {s.statut}</div>
                          <div className="mt-3 flex items-center gap-2">
                            <button className="text-indigo-600">Voir détail</button>
                            {Array.isArray(s.fichiers) && s.fichiers[0] && (
                              <img src={s.fichiers[0]} alt="aperçu" className="w-16 h-12 object-cover rounded-md ml-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onglet Configuration du site */}
          {activeTab === 'config' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Configuration du site</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Titre du site</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={siteConfig.siteName} onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Email de contact</label><input type="email" className="w-full border rounded-lg px-3 py-2" value={siteConfig.contactEmail} onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Telephone</label><input type="tel" className="w-full border rounded-lg px-3 py-2" value={siteConfig.contactPhone} onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Adresse</label><textarea className="w-full border rounded-lg px-3 py-2" rows="2" value={siteConfig.address} onChange={e => setSiteConfig({...siteConfig, address: e.target.value})} /></div>
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Page Contact</h3>
                  <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={siteConfig.contactPage?.title || ''} onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, title: e.target.value}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Contenu</label><textarea className="w-full border rounded-lg px-3 py-2" rows="4" value={siteConfig.contactPage?.content || ''} onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, content: e.target.value}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Images (URLs, séparées par des virgules)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={(siteConfig.contactPage?.images || []).join(',')} onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Vidéos (URLs, séparées par des virgules)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={(siteConfig.contactPage?.videos || []).join(',')} onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, videos: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} /></div>
                </div>
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Page A propos</h3>
                  <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={siteConfig.aboutPage?.title || ''} onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, title: e.target.value}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Contenu</label><textarea className="w-full border rounded-lg px-3 py-2" rows="6" value={siteConfig.aboutPage?.content || ''} onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, content: e.target.value}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Images (URLs, séparées par des virgules)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={(siteConfig.aboutPage?.images || []).join(',')} onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Vidéos (URLs, séparées par des virgules)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={(siteConfig.aboutPage?.videos || []).join(',')} onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, videos: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} /></div>
                </div>
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Page Accueil</h3>
                  <div><label className="block text-sm font-medium mb-1">Titre</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={siteConfig.homePage?.title || ''} onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, title: e.target.value}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Hero text</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={siteConfig.homePage?.heroText || ''} onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, heroText: e.target.value}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Contenu</label><textarea className="w-full border rounded-lg px-3 py-2" rows="4" value={siteConfig.homePage?.content || ''} onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, content: e.target.value}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Images (URLs, séparées par des virgules)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={(siteConfig.homePage?.images || []).join(',')} onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} /></div>
                  <div className="mt-2"><label className="block text-sm font-medium mb-1">Vidéos (URLs, séparées par des virgules)</label><input type="text" className="w-full border rounded-lg px-3 py-2" value={(siteConfig.homePage?.videos || []).join(',')} onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, videos: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}})} /></div>
                </div>
                <button onClick={saveConfig} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Sauvegarder</button>
              </div>
            </div>
          )}

          {/* Onglet Supervision */}
          {activeTab === 'stats' && (
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{statsData.totalUsers}</div><div className="text-gray-600">Utilisateurs</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{statsData.totalSignalements}</div><div className="text-gray-600">Signalements</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-indigo-600">{statsData.totalCampagnes}</div><div className="text-gray-600">Campagnes</div></div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center"><div className="text-3xl font-bold text-green-600">{statsData.activeUsers}</div><div className="text-gray-600">Actifs</div></div>
            </div>
          )}

          {/* Onglet Mon profil */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Mon profil</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><strong>Prenom:</strong> {user.prenom}</div><div><strong>Nom:</strong> {user.nom}</div>
                <div><strong>Email:</strong> {user.email}</div><div><strong>Telephone:</strong> {user.telephone}</div>
                <div><strong>Ville:</strong> {user.ville}</div><div><strong>Quartier:</strong> {user.quartier}</div>
                <div><strong>Role:</strong> {user.role}</div>
              </div>
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg">Modifier mon profil</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal creation/modification utilisateur */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editingUser ? 'Modifier' : 'Creer'} un utilisateur</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Prenom" className="w-full border rounded px-3 py-2" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} required />
              <input type="text" placeholder="Nom" className="w-full border rounded px-3 py-2" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required />
              <input type="email" placeholder="Email" className="w-full border rounded px-3 py-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              <input type="tel" placeholder="Telephone" className="w-full border rounded px-3 py-2" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} required />
              {!editingUser && <input type="password" placeholder="Mot de passe" className="w-full border rounded px-3 py-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />}
              <input type="text" placeholder="Ville" className="w-full border rounded px-3 py-2" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} required />
              <input type="text" placeholder="Quartier" className="w-full border rounded px-3 py-2" value={formData.quartier} onChange={e => setFormData({...formData, quartier: e.target.value})} required />
              <select className="w-full border rounded px-3 py-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="citoyen">Citoyen</option><option value="police">Police</option><option value="collaborateur">Collaborateur</option><option value="admin">Admin</option></select>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditingUser(null); }} className="flex-1 border rounded py-2">Annuler</button><button type="submit" className="flex-1 bg-indigo-600 text-white rounded py-2">{editingUser ? 'Modifier' : 'Creer'}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
