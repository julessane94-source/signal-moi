import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import Navbar from '../../components/common/Navbar'
import Link from 'next/link'
import { motion } from 'framer-motion'
import DashboardStats from '../../components/dashboard/DashboardStats'
import DashboardSignalements from '../../components/dashboard/DashboardSignalements'
import DashboardCampagnes from '../../components/dashboard/DashboardCampagnes'
import DashboardPlaidoyers from '../../components/dashboard/DashboardPlaidoyers'
import DashboardMessages from '../../components/dashboard/DashboardMessages'

export default function CitizenDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('signalements')
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [plaidoyers, setPlaidoyers] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  // 🔧 BUGFIX: Utiliser useEffect correctement avec authLoading
  useEffect(() => {
    // Attendre que l'auth soit chargé ET que user existe
    if (!authLoading && user && user.id) {
      console.log('[DASHBOARD] Chargement des données pour:', user.email)
      fetchData()
    }
  }, [authLoading, user?.id])

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('[DASHBOARD] Pas de token trouvé')
        return
      }
      
      const headers = { 'Authorization': `Bearer ${token}` }
      const base = API_BASE
      
      console.log('[DASHBOARD] Récupération des données depuis:', base)
      
      const [signalRes, campRes, plaidRes] = await Promise.all([
        fetch(`${base}/api/signalements`, { headers }),
        fetch(`${base}/api/campagnes`, { headers }),
        fetch(`${base}/api/plaidoyers`, { headers })
      ])
      
      // Vérifier les réponses
      if (!signalRes.ok) {
        console.error('[DASHBOARD] Erreur GET /api/signalements:', signalRes.status)
      }
      if (!campRes.ok) {
        console.error('[DASHBOARD] Erreur GET /api/campagnes:', campRes.status)
      }
      if (!plaidRes.ok) {
        console.error('[DASHBOARD] Erreur GET /api/plaidoyers:', plaidRes.status)
      }
      
      const signalData = signalRes.ok ? await signalRes.json() : []
      const campData = campRes.ok ? await campRes.json() : []
      const plaidData = plaidRes.ok ? await plaidRes.json() : []
      
      console.log('[DASHBOARD] Données reçues:', {
        signalements: signalData.length,
        campagnes: campData.length,
        plaidoyers: plaidData.length
      })
      
      setSignalements(Array.isArray(signalData) ? signalData : [])
      setCampagnes(Array.isArray(campData) ? campData : [])
      setPlaidoyers(Array.isArray(plaidData) ? plaidData : [])
    } catch (error) {
      console.error('[DASHBOARD] Erreur fetchData:', error)
      setSignalements([])
      setCampagnes([])
      setPlaidoyers([])
    } finally {
      setDataLoading(false)
    }
  }

  const tabs = [
    { id: 'signalements', name: 'Mes signalements', icon: '📋' },
    { id: 'campagnes', name: 'Campagnes', icon: '🎯' },
    { id: 'plaidoyers', name: 'Plaidoyers', icon: '✍️' },
    { id: 'messages', name: 'Messages', icon: '💬' },
    { id: 'profil', name: 'Mon profil', icon: '👤' }
  ]

  // Afficher le chargement d'auth
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600">Vérification de votre identité...</p>
          </div>
        </div>
      </>
    )
  }

  // Rediriger si pas authentifié
  if (!user || !user.id) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Veuillez vous connecter</p>
          </div>
        </div>
      </>
    )
  }

  // Afficher le chargement des données
  if (dataLoading && signalements.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Espace Citoyen</h1>
            <p className="text-gray-600 mt-2">Bienvenue {user?.prenom} ! Votre voix compte.</p>
          </div>

          {/* Call to Action - Create Report */}
          <Link href="/citizen/signalement">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg mb-8 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-6xl">🚨</div>
                  <div className="text-left">
                    <div className="text-2xl font-bold">Faire un signalement</div>
                    <div className="text-red-100">Violence, vol, problème d\'éclairage, nid-de-poule...</div>
                  </div>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </motion.button>
          </Link>

          {/* Statistics */}
          {activeTab === 'signalements' && <DashboardStats user={user} />}

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'signalements' && (
              <>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Évolution de mes signalements</h2>
                <DashboardSignalements signalements={signalements} />
              </>
            )}

            {activeTab === 'campagnes' && (
              <>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">S\'inscrire aux campagnes</h2>
                <DashboardCampagnes campagnes={campagnes} />
              </>
            )}

            {activeTab === 'plaidoyers' && (
              <>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Signer des pétitions</h2>
                <DashboardPlaidoyers plaidoyers={plaidoyers} />
              </>
            )}

            {activeTab === 'messages' && (
              <>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Vos messages</h2>
                <DashboardMessages />
              </>
            )}

            {activeTab === 'profil' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">Mon profil</h2>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <p className="text-sm text-gray-600">Nom complet</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.prenom} {user?.nom}</p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.telephone || '—'}</p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <p className="text-sm text-gray-600">Ville</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.ville || '—'}</p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <p className="text-sm text-gray-600">Quartier</p>
                    <p className="text-lg font-semibold text-gray-900">{user?.quartier || '—'}</p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <p className="text-sm text-gray-600">Rôle</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{user?.role}</p>
                  </div>
                </div>
                <Link href="/profile">
                  <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium">
                    Modifier mon profil
                  </button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
}
