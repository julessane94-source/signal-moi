import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button, Card, FormField, Input } from '../components/ui'
import { motion } from 'framer-motion'
import {
  UserCircleIcon as UserCircle,
  KeyIcon as Key,
  BellIcon as Bell,
  EnvelopeIcon as Envelope,
  PhoneIcon as Phone,
  MapPinIcon as MapPin,
  CameraIcon as Camera,
  CheckIcon as Check
} from '@heroicons/react/24/outline'

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    ville: '',
    quartier: ''
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
        quartier: user.quartier || ''
      })
    }
  }, [user])

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
    { id: 'profile', name: 'Mon profil', icon: UserCircle },
    { id: 'password', name: 'Sécurité', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell }
  ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden mb-8">
              {/* Gradient Background */}
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

              {/* Profile Info */}
              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl shadow-lg flex items-center justify-center border-4 border-white">
                      <span className="text-4xl font-bold text-white">
                        {user?.prenom?.[0]}{user?.nom?.[0]}
                      </span>
                    </div>
                    <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-lg shadow-md hover:bg-indigo-700 transition">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 pb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{user?.prenom} {user?.nom}</h1>
                    <p className="text-gray-600">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        {user?.role === 'admin' ? '👨‍💼 Administrateur' : 
                         user?.role === 'police' ? '👮 Police' :
                         user?.role === 'collaborateur' ? '🤝 Collaborateur' :
                         '👤 Citoyen'}
                      </span>
                      {user?.role !== 'citoyen' && (
                        <Button
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
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
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
                <TabIcon className="h-5 w-5" />
                <span>{tab.name}</span>
              </motion.button>
              )
            })}
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
              <Check className="h-5 w-5" />
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
                        icon={UserCircle}
                        error={!!profileErrors.prenom}
                      />
                    </FormField>
                    <FormField label="Nom" error={profileErrors.nom}>
                      <Input
                        name="nom"
                        placeholder="Dupont"
                        value={formData.nom}
                        onChange={handleProfileChange}
                        icon={UserCircle}
                        error={!!profileErrors.nom}
                      />
                    </FormField>
                  </div>

                  <FormField label="Email" helperText="Non modifiable">
                    <Input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      icon={Envelope}
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
                        icon={Phone}
                      />
                    </FormField>
                    <FormField label="Ville">
                      <Input
                        name="ville"
                        placeholder="Yaoundé"
                        value={formData.ville}
                        onChange={handleProfileChange}
                        icon={MapPin}
                      />
                    </FormField>
                  </div>

                  <FormField label="Quartier">
                    <Input
                      name="quartier"
                      placeholder="Centre-ville"
                      value={formData.quartier}
                      onChange={handleProfileChange}
                      icon={MapPin}
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
                      icon={Key}
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
                      icon={Key}
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
                      icon={Key}
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
                    icon: Envelope,
                    title: 'Notifications par email',
                    description: 'Recevoir des alertes par email'
                  },
                  {
                    icon: Bell,
                    title: 'Notifications push',
                    description: 'Recevoir des notifications dans le navigateur'
                  },
                  {
                    icon: UserCircle,
                    title: 'Nouveaux signalements',
                    description: 'Être alerté des nouveaux signalements près de vous'
                  }
                ].map((notif, idx) => {
                  const NotifIcon = notif.icon
                  return (
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
                            <NotifIcon className="h-6 w-6 text-indigo-600" />
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
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
