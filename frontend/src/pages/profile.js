import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'
import { Button, Card, FormField, Input } from '../components/ui'
import { motion } from 'framer-motion'
import Head from 'next/head'
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CameraIcon,
  CheckIcon,
  ChartBarIcon,
  CalendarIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState({
    totalSignalements: 0,
    resolvedSignalements: 0,
    pendingSignalements: 0
  })
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    ville: '',
    quartier: '',
    genre: '',
    date_naissance: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [profileErrors, setProfileErrors] = useState({})

  useEffect(() => {
    if (user) {
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        telephone: user.telephone || '',
        ville: user.ville || '',
        quartier: user.quartier || '',
        genre: user.genre || '',
        date_naissance: user.date_naissance ? user.date_naissance.split('T')[0] : ''
      })
      // Fetch user statistics
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/my-signalements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalSignalements: data.stats.total || 0,
          resolvedSignalements: data.stats.traite || 0,
          pendingSignalements: data.stats.en_cours || 0
        })
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await updateProfile(formData)
      setMessage('Profil mis à jour avec succès')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Erreur lors de la mise à jour')
    }
    setLoading(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!passwordData.newPassword) errors.newPassword = 'Nouveau mot de passe requis'
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Les mots de passe ne correspondent pas'
    }
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }
    setLoading(true)
    setMessage('')
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setMessage('Mot de passe changé avec succès')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      })
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Erreur lors du changement de mot de passe')
    }
    setLoading(false)
  }

  const tabs = [
    { id: 'profile', name: 'Mon profil', icon: UserCircleIcon },
    { id: 'stats', name: 'Statistiques', icon: ChartBarIcon },
    { id: 'password', name: 'Sécurité', icon: KeyIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon }
  ]

  // Calculated age
  const getAge = () => {
    if (!formData.date_naissance) return null
    const birthDate = new Date(formData.date_naissance)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <>
      <Head>
        <title>Mon Profil - Signal-Moi</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden mb-8 shadow-lg">
              {/* Gradient Background */}
              <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              {/* Profile Info */}
              <div className="px-6 pb-8 md:pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20">
                  {/* Avatar */}
                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl shadow-xl flex items-center justify-center border-4 border-white"
                    >
                      <span className="text-5xl font-bold text-white">
                        {user?.prenom?.[0]?.toUpperCase()}{user?.nom?.[0]?.toUpperCase()}
                      </span>
                    </motion.div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute bottom-2 right-2 bg-indigo-600 text-white p-3 rounded-xl shadow-md hover:bg-indigo-700 transition"
                    >
                      <CameraIcon className="h-5 w-5" />
                    </motion.button>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 pb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                      {user?.prenom} {user?.nom}
                    </h1>
                    <p className="text-gray-600 text-lg mb-4">{user?.email}</p>
                    
                    {/* Role & Quick Links */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-sm font-semibold shadow-sm">
                        {user?.role === 'admin' ? '👨‍💼 Administrateur' : 
                         user?.role === 'police' ? '👮 Police' :
                         user?.role === 'collaborateur' ? '🤝 Collaborateur' :
                         '👤 Citoyen'}
                      </span>
                      {user?.role !== 'citoyen' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => {
                            const dashboardUrl = user?.role === 'admin' ? '/admin/dashboard' :
                                              user?.role === 'police' ? '/police/dashboard' :
                                              '/collaborator/dashboard'
                            window.location.href = dashboardUrl
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
                        >
                          📊 Tableau de bord
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Statistics Cards (only for citizens and collaborators) */}
          {(user?.role === 'citoyen' || user?.role === 'collaborateur') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              {[
                { 
                  label: 'Total de signalements', 
                  value: stats.totalSignalements, 
                  icon: '📍',
                  color: 'from-blue-500 to-cyan-500'
                },
                { 
                  label: 'Signalements résolus', 
                  value: stats.resolvedSignalements, 
                  icon: '✅',
                  color: 'from-green-500 to-emerald-500'
                },
                { 
                  label: 'Signalements en cours', 
                  value: stats.pendingSignalements, 
                  icon: '⏳',
                  color: 'from-yellow-500 to-orange-500'
                }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Card className="p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                        <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      </div>
                      <div className={`text-4xl p-4 bg-gradient-to-br ${stat.color} rounded-xl text-white shadow-lg`}>
                        {stat.icon}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMessage('')
                }}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50 rounded-t-lg'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                message.includes('succès')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <CheckIcon className="h-5 w-5" />
              {message}
            </motion.div>
          )}

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  <span className="inline-flex items-center gap-2">
                    <UserCircleIcon className="h-7 w-7 text-indigo-600" />
                    Informations personnelles
                  </span>
                </h2>
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IdentificationIcon className="h-5 w-5 text-indigo-600" />
                      Identité
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
                      <FormField label="Prénom" error={profileErrors.prenom}>
                        <Input
                          name="prenom"
                          placeholder="Jean"
                          value={formData.prenom}
                          onChange={handleProfileChange}
                          icon={UserCircleIcon}
                          error={!!profileErrors.prenom}
                        />
                      </FormField>
                      <FormField label="Nom" error={profileErrors.nom}>
                        <Input
                          name="nom"
                          placeholder="Dupont"
                          value={formData.nom}
                          onChange={handleProfileChange}
                          icon={UserCircleIcon}
                          error={!!profileErrors.nom}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5 text-indigo-600" />
                      Contact
                    </h3>
                    <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
                      <FormField label="Email" helperText="Non modifiable">
                        <Input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          icon={EnvelopeIcon}
                          className="bg-gray-100"
                        />
                      </FormField>
                      <FormField label="Téléphone">
                        <Input
                          type="tel"
                          name="telephone"
                          placeholder="+237 6xx xxx xxx"
                          value={formData.telephone}
                          onChange={handleProfileChange}
                          icon={PhoneIcon}
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-indigo-600" />
                      Informations supplémentaires
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
                      <FormField label="Date de naissance">
                        <Input
                          type="date"
                          name="date_naissance"
                          value={formData.date_naissance}
                          onChange={handleProfileChange}
                          icon={CalendarIcon}
                        />
                      </FormField>
                      <FormField label="Genre">
                        <select
                          name="genre"
                          value={formData.genre}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </FormField>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5 text-indigo-600" />
                      Localisation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
                      <FormField label="Ville">
                        <Input
                          name="ville"
                          placeholder="Yaoundé"
                          value={formData.ville}
                          onChange={handleProfileChange}
                          icon={MapPinIcon}
                        />
                      </FormField>
                      <FormField label="Quartier">
                        <Input
                          name="quartier"
                          placeholder="Centre-ville"
                          value={formData.quartier}
                          onChange={handleProfileChange}
                          icon={MapPinIcon}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col md:flex-row gap-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button type="submit" loading={loading} className="w-full">
                        ✓ Enregistrer les modifications
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </Card>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <Card className="p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  <span className="inline-flex items-center gap-2">
                    <ChartBarIcon className="h-7 w-7 text-indigo-600" />
                    Vos statistiques
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Member Since */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">Membre depuis</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {user?.created_at ? new Date(user?.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>

                  {/* Age */}
                  {getAge() && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                      <p className="text-gray-600 text-sm font-medium mb-2">Âge</p>
                      <p className="text-3xl font-bold text-purple-900">{getAge()} ans</p>
                    </div>
                  )}

                  {/* Total Signalements */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">Signalements créés</p>
                    <p className="text-3xl font-bold text-green-900">{stats.totalSignalements}</p>
                  </div>

                  {/* Resolved */}
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
                    <p className="text-gray-600 text-sm font-medium mb-2">Signalements résolus</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.resolvedSignalements}</p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="text-indigo-900 text-sm">
                    <span className="font-semibold">💡 Conseil:</span> Continuez à signaler les problèmes dans votre quartier pour améliorer votre communauté!
                  </p>
                </div>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'password' && (
              <Card className="p-6 md:p-8 shadow-lg max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  <span className="inline-flex items-center gap-2">
                    <KeyIcon className="h-7 w-7 text-indigo-600" />
                    Changer le mot de passe
                  </span>
                </h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <p className="text-amber-900 text-sm">
                      🔒 <strong>Conseil de sécurité:</strong> Utilisez un mot de passe fort avec au moins 8 caractères, incluant des majuscules, minuscules et chiffres.
                    </p>
                  </div>

                  <FormField label="Mot de passe actuel" error={passwordErrors.currentPassword} required>
                    <Input
                      type="password"
                      name="currentPassword"
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      icon={KeyIcon}
                      error={!!passwordErrors.currentPassword}
                    />
                  </FormField>

                  <FormField label="Nouveau mot de passe" error={passwordErrors.newPassword} required helperText="Minimum 8 caractères">
                    <Input
                      type="password"
                      name="newPassword"
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      icon={KeyIcon}
                      error={!!passwordErrors.newPassword}
                    />
                  </FormField>

                  <FormField label="Confirmer le mot de passe" error={passwordErrors.confirmNewPassword} required>
                    <Input
                      type="password"
                      name="confirmNewPassword"
                      placeholder="••••••••"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      icon={KeyIcon}
                      error={!!passwordErrors.confirmNewPassword}
                    />
                  </FormField>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" loading={loading} className="w-full">
                      ✓ Changer le mot de passe
                    </Button>
                  </motion.div>
                </form>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {[
                  {
                    icon: EnvelopeIcon,
                    title: 'Notifications par email',
                    description: 'Recevoir des alertes par email sur vos signalements',
                    enabled: true
                  },
                  {
                    icon: BellIcon,
                    title: 'Notifications push',
                    description: 'Recevoir des notifications dans le navigateur',
                    enabled: true
                  },
                  {
                    icon: MapPinIcon,
                    title: 'Nouveaux signalements proches',
                    description: 'Être alerté des nouveaux signalements près de vous',
                    enabled: false
                  }
                ].map((notif, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-100 rounded-xl">
                            <notif.icon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                            <p className="text-sm text-gray-600">{notif.description}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            const dashboardUrl = user?.role === 'admin' ? '/admin/dashboard' :
                                              user?.role === 'police' ? '/police/dashboard' :
                                              '/collaborator/dashboard'
                            window.location.href = dashboardUrl
                          }}
                        >
                          📊 Tableau de bord
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMessage('')
                }}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
                message.includes('succès')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <CheckIcon className="h-5 w-5" />
              {message}
            </motion.div>
          )}

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Informations personnelles</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Prénom" error={profileErrors.prenom}>
                      <Input
                        name="prenom"
                        placeholder="Jean"
                        value={formData.prenom}
                        onChange={handleProfileChange}
                        icon={UserCircleIcon}
                        error={!!profileErrors.prenom}
                      />
                    </FormField>
                    <FormField label="Nom" error={profileErrors.nom}>
                      <Input
                        name="nom"
                        placeholder="Dupont"
                        value={formData.nom}
                        onChange={handleProfileChange}
                        icon={UserCircleIcon}
                        error={!!profileErrors.nom}
                      />
                    </FormField>
                  </div>

                  <FormField label="Email" helperText="Non modifiable">
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      icon={EnvelopeIcon}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Téléphone">
                      <Input
                        type="tel"
                        name="telephone"
                        placeholder="+237 6xx xxx xxx"
                        value={formData.telephone}
                        onChange={handleProfileChange}
                        icon={PhoneIcon}
                      />
                    </FormField>
                    <FormField label="Ville">
                      <Input
                        name="ville"
                        placeholder="Yaoundé"
                        value={formData.ville}
                        onChange={handleProfileChange}
                        icon={MapPinIcon}
                      />
                    </FormField>
                  </div>

                  <FormField label="Quartier">
                    <Input
                      name="quartier"
                      placeholder="Centre-ville"
                      value={formData.quartier}
                      onChange={handleProfileChange}
                      icon={MapPinIcon}
                    />
                  </FormField>

                  <div className="pt-4 flex gap-3">
                    <Button type="submit" loading={loading}>
                      Enregistrer les modifications
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'password' && (
              <Card className="p-8 max-w-md">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Changer le mot de passe</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <FormField label="Mot de passe actuel" error={passwordErrors.currentPassword} required>
                    <Input
                      type="password"
                      name="currentPassword"
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      icon={KeyIcon}
                      error={!!passwordErrors.currentPassword}
                    />
                  </FormField>

                  <FormField label="Nouveau mot de passe" error={passwordErrors.newPassword} required helperText="Minimum 8 caractères">
                    <Input
                      type="password"
                      name="newPassword"
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      icon={KeyIcon}
                      error={!!passwordErrors.newPassword}
                    />
                  </FormField>

                  <FormField label="Confirmer le mot de passe" error={passwordErrors.confirmNewPassword} required>
                    <Input
                      type="password"
                      name="confirmNewPassword"
                      placeholder="••••••••"
                      value={passwordData.confirmNewPassword}
                      onChange={handlePasswordChange}
                      icon={KeyIcon}
                      error={!!passwordErrors.confirmNewPassword}
                    />
                  </FormField>

                  <Button type="submit" loading={loading} className="w-full">
                    Changer le mot de passe
                  </Button>
                </form>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {[
                  {
                    icon: EnvelopeIcon,
                    title: 'Notifications par email',
                    description: 'Recevoir des alertes par email'
                  },
                  {
                    icon: BellIcon,
                    title: 'Notifications push',
                    description: 'Recevoir des notifications dans le navigateur'
                  },
                  {
                    icon: UserCircleIcon,
                    title: 'Nouveaux signalements',
                    description: 'Être alerté des nouveaux signalements près de vous'
                  }
                ].map((notif, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <notif.icon className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                            <p className="text-sm text-gray-600">{notif.description}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
