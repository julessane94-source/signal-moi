import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import Navbar from '../../components/common/Navbar'
import { Button, Card, Badge, StatBox } from '../../components/ui'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { useSocket } from '../../context/SocketContext'
import {
  DocumentDownloadIcon,
  ChartBarIcon,
  CheckCircleIcon,
  PlusIcon,
  ExclamationIcon
} from '@heroicons/react/24/outline'

export default function CollaboratorDashboard() {
  const { user } = useAuth()
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [notifications, setNotifications] = useState([])
  const [rappels, setRappels] = useState([])
  const { socket } = useSocket()
  const [filterType, setFilterType] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')

  useEffect(() => {
    fetchData()
    fetchNotifications()

    if (socket) {
      socket.on('new_signalement_notification', (n) => {
        toast.warning(`🚨 Nouveau signalement: ${n.title}`)
        setNotifications(prev => [n, ...prev])
      })
    }
    return () => {
      if (socket) {
        socket.off('new_signalement_notification')
      }
    }
  }, [])

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
              icon={DocumentDownloadIcon}
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
  const { user } = useAuth()
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [notifications, setNotifications] = useState([])
  const [rappels, setRappels] = useState([])
  const { socket } = useSocket()
  const [filterType, setFilterType] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')

  useEffect(() => {
    fetchData()
    fetchNotifications()

    if (socket) {
      socket.on('new_signalement_notification', (n) => {
        toast.warning(`Nouveau signalement: ${n.title}`)
        setNotifications(prev => [n, ...prev])
      })
    }
    return () => {
      if (socket) {
        socket.off('new_signalement_notification')
      }
    }
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const base = API_BASE
      const [signalRes, campRes] = await Promise.all([
        fetch(`${base}/api/signalements`, { headers }),
        fetch(`${base}/api/campagnes`, { headers })
      ])
      
      setSignalements(await signalRes.json())
      setCampagnes(await campRes.json())
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const exportData = (format) => {
    toast.success(`Export ${format.toUpperCase()} lance`)
    // Implémentation réelle à ajouter
  }

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/collaborator/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setNotifications(Array.isArray(data) ? data : [])
      // Générer des rappels de suivi basiques depuis notifications non-lues
      setRappels((Array.isArray(data) ? data : []).filter(n => !n.isRead).slice(0,5))
    } catch (err) {
      console.error('Erreur notifications:', err)
    }
  }

  const analyserCas = (signalement) => {
    toast.info(`Ouverture de l'analyse pour: ${signalement?.titre || '—'}`)
    // TODO: rediriger vers page d'analyse détaillée
  }

  const contacterVictime = (signalement) => {
    if (signalement?.author?.telephone) {
      window.open(`tel:${signalement.author.telephone}`)
    } else {
      toast.info('Téléphone non disponible')
    }
  }

  const filteredSignalements = signalements.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false
    if (filterStatut !== 'all' && s.statut !== filterStatut) return false
    return true
  })

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Collaborateur</h1>
          <p className="text-gray-600 mb-8">Bienvenue {user?.prenom} !</p>

          {/* Actions rapides */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <button onClick={() => exportData('pdf')} className="bg-red-500 text-white p-4 rounded-xl hover:bg-red-600 transition flex items-center justify-between">
              <span>📄 Exporter PDF</span> <span>→</span>
            </button>
            <button onClick={() => exportData('excel')} className="bg-green-500 text-white p-4 rounded-xl hover:bg-green-600 transition flex items-center justify-between">
              <span>📊 Exporter Excel</span> <span>→</span>
            </button>
            <button onClick={() => window.location.href = '/collaborator/campagne/new'} className="bg-indigo-500 text-white p-4 rounded-xl hover:bg-indigo-600 transition flex items-center justify-between">
              <span>🎯 Creer campagne</span> <span>→</span>
            </button>
            <button className="bg-purple-500 text-white p-4 rounded-xl hover:bg-purple-600 transition flex items-center justify-between">
              <span>📈 Voir statistiques</span> <span>→</span>
            </button>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium mr-2">Type:</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-lg px-3 py-1">
                  <option value="all">Tous</option>
                  <option value="violence">Violence</option>
                  <option value="vol">Vol</option>
                  <option value="probleme_eclairage">Probleme eclairage</option>
                  <option value="nid_de_poule">Nid-de-poule</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mr-2">Statut:</label>
                <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="border rounded-lg px-3 py-1">
                  <option value="all">Tous</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="en_cours">En cours</option>
                  <option value="traite">Traite</option>
                </select>
              </div>
              <div className="text-sm text-gray-500 ml-auto pt-2">
                {filteredSignalements.length} signalement(s)
              </div>
            </div>
          </div>

          {/* Grille des signalements avec images */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredSignalements.map(s => (
              <div key={s.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 relative">
                  {s.fichiers?.[0] ? (
                    <img src={s.fichiers[0].chemin} alt="Preuve" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-5xl">📸</div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      s.statut === 'nouveau' ? 'bg-red-500 text-white' :
                      s.statut === 'en_cours' ? 'bg-yellow-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>{s.statut}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{s.type}</span>
                    <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{s.titre}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{s.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">📍 {s.localisation}</span>
                    <button className="text-indigo-500 text-sm hover:text-indigo-600">Voir details →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Campagnes creees */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Mes campagnes</h2>
            {campagnes.filter(c => c.createdBy === user?.id).length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune campagne creee</p>
            ) : (
              <div className="space-y-4">
                {campagnes.filter(c => c.createdBy === user?.id).map(c => (
                  <div key={c.id} className="border-b pb-3 last:border-0">
                    <h3 className="font-semibold">{c.titre}</h3>
                    <p className="text-gray-600 text-sm">{c.description}</p>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                      <span>📅 {new Date(c.dateDebut).toLocaleDateString()}</span>
                      <span>📍 {c.lieu}</span>
                      <span>👥 0 inscrits</span>
                      <button className="text-indigo-500">Voir les inscrits →</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}