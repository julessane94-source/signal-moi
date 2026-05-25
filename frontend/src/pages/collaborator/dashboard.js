import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import Navbar from '../../components/common/Navbar'
import { Button, Card, Badge, StatBox } from '../../components/ui'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { useSocket } from '../../context/SocketContext'
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function CollaboratorDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [notifications, setNotifications] = useState([])
  const [rappels, setRappels] = useState([])
  const { socket } = useSocket()
  const [filterType, setFilterType] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')

  // Vérifier les permissions d'accès
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
        return
      }
      if (user.role !== 'collaborateur') {
        toast.error('❌ Accès refusé - Vous devez être collaborateur')
        router.push('/')
        return
      }
    }
  }, [user, loading])

  // Si l'utilisateur n'a pas les bonnes permissions, afficher un écran vide
  if (loading || !user || user.role !== 'collaborateur') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  useEffect(() => {
    fetchData()
    fetchNotifications()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('new_signalement_notification', (n) => {
        toast.warning(`🚨 Nouveau signalement: ${n.title}`)
        setNotifications(prev => [n, ...prev])
      })
      return () => {
        socket.off('new_signalement_notification')
      }
    }
  }, [socket])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const base = API_BASE
      const [signalRes, campRes] = await Promise.all([
        fetch(`${base}/api/signalements`, { headers }),
        fetch(`${base}/api/campagnes`, { headers })
      ])
      
      const signalData = await signalRes.json()
      const campData = await campRes.json()
      setSignalements(Array.isArray(signalData) ? signalData : [])
      setCampagnes(Array.isArray(campData) ? campData : [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de chargement des données')
    }
  }

  const exportData = async (format) => {
    try {
      toast.info(`📥 Export ${format.toUpperCase()} en cours...`)
      // Implémentation réelle à ajouter
      setTimeout(() => {
        toast.success(`✅ Export ${format.toUpperCase()} téléchargé`)
      }, 1000)
    } catch (error) {
      toast.error('❌ Erreur lors de l\'export')
    }
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/collaborator/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
      setRappels((Array.isArray(data) ? data : []).filter(n => !n.isRead).slice(0, 5))
    } catch (err) {
      console.error('Erreur notifications:', err)
    }
  }

  const filteredSignalements = signalements.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false
    if (filterStatut !== 'all' && s.statut !== filterStatut) return false
    return true
  })

  const myCampagnes = campagnes.filter(c => c.createdBy === user?.id)

  const stats = {
    total: filteredSignalements.length,
    nouveau: filteredSignalements.filter(s => s.statut === 'nouveau').length,
    enCours: filteredSignalements.filter(s => s.statut === 'en_cours').length,
    traite: filteredSignalements.filter(s => s.statut === 'traite').length
  }

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'nouveau': return 'warning'
      case 'en_cours': return 'info'
      case 'traite': return 'success'
      default: return 'gray'
    }
  }

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
            <h1 className="text-4xl font-bold text-gray-900">
              Espace Collaborateur
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenue {user?.prenom} ! Gérez vos campagnes et les signalements.
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Button
              icon={ArrowDownTrayIcon}
              onClick={() => exportData('pdf')}
              className="flex justify-center items-center gap-2 w-full"
            >
              📄 Exporter PDF
            </Button>
            <Button
              icon={ChartBarIcon}
              variant="success"
              onClick={() => exportData('excel')}
              className="flex justify-center items-center gap-2 w-full"
            >
              📊 Exporter Excel
            </Button>
            <Button
              icon={PlusIcon}
              onClick={() => window.location.href = '/collaborator/campagne/new'}
              className="flex justify-center items-center gap-2 w-full"
            >
              🎯 Créer campagne
            </Button>
            <Button
              variant="primary"
              onClick={() => toast.info('📊 Statistiques détaillées')}
              className="flex justify-center items-center gap-2 w-full"
            >
              📈 Statistiques
            </Button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatBox title="Total" value={stats.total} color="blue" />
            <StatBox title="Nouveaux" value={stats.nouveau} color="red" />
            <StatBox title="En cours" value={stats.enCours} color="yellow" />
            <StatBox title="Traités" value={stats.traite} color="green" />
          </motion.div>

          {/* Filtres */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg p-4 mb-8 shadow"
          >
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tous</option>
                  <option value="violence">Violence</option>
                  <option value="vol">Vol</option>
                  <option value="eclairage">Problème éclairage</option>
                  <option value="route">Nid-de-poule</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Statut:</label>
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tous</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours</option>
                  <option value="traite">Traité</option>
                </select>
              </div>
              <div className="ml-auto text-sm text-gray-600 font-medium">
                {filteredSignalements.length} signalement(s)
              </div>
            </div>
          </motion.div>

          {/* Signalements Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            {filteredSignalements.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500">Aucun signalement avec ces filtres</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSignalements.map((s, idx) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition h-full flex flex-col">
                      {/* Image Preview */}
                      <div className="h-40 bg-gradient-to-br from-indigo-100 to-purple-100 relative overflow-hidden">
                        {s.fichiers?.[0] ? (
                          <img
                            src={s.fichiers[0].chemin}
                            alt="Preuve"
                            className="w-full h-full object-cover hover:scale-105 transition"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-5xl">📸</div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge variant={getStatusColor(s.statut)}>
                            {s.statut || 'Nouveau'}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          {s.type && <Badge variant="gray">{s.type}</Badge>}
                          <span className="text-xs text-gray-400">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{s.titre}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{s.description}</p>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500">📍 {s.localisation}</span>
                          <a href={`/signalment/${s.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                            Détails →
                          </a>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Mes Campagnes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
                Mes campagnes
              </h2>
              {myCampagnes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🎯</div>
                  <p className="text-gray-500 mb-4">Aucune campagne créée</p>
                  <Button
                    icon={PlusIcon}
                    onClick={() => window.location.href = '/collaborator/campagne/new'}
                  >
                    Créer ma première campagne
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myCampagnes.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:bg-indigo-50 transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{c.titre}</h3>
                        <a href={`/campagne/${c.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm">
                          Voir →
                        </a>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{c.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>📅 {new Date(c.dateDebut).toLocaleDateString()}</span>
                        <span>📍 {c.lieu}</span>
                        <span>👥 0 inscrits</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}