import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import Navbar from '../../components/common/Navbar'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('signalements')
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [plaidoyers, setPlaidoyers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading && user) {
      fetchData()
    }
  }, [user, loading])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      
      const base = API_BASE
      const [signalRes, campRes, plaidRes] = await Promise.all([
        fetch(`${base}/api/signalements`, { headers }),
        fetch(`${base}/api/campagnes`, { headers }),
        fetch(`${base}/api/plaidoyers`, { headers })
      ])
      
      const signalData = await signalRes.json()
      const campData = await campRes.json()
      const plaidData = await plaidRes.json()
      
      setSignalements(Array.isArray(signalData) ? signalData : [])
      setCampagnes(Array.isArray(campData) ? campData : [])
      setPlaidoyers(Array.isArray(plaidData) ? plaidData : [])
    } catch (error) {
      console.error('Erreur:', error)
      setSignalements([])
      setCampagnes([])
      setPlaidoyers([])
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'signalements', name: 'Mes signalements', icon: '📋' },
    { id: 'campagnes', name: 'Campagnes', icon: '🎯' },
    { id: 'plaidoyers', name: 'Plaidoyers', icon: '✍️' },
    { id: 'profil', name: 'Mon profil', icon: '👤' }
  ]

  const getStatusBadge = (statut) => {
    const statusMap = {
      'nouveau': { color: 'bg-blue-100 text-blue-700', text: 'Nouveau' },
      'en_cours': { color: 'bg-yellow-100 text-yellow-700', text: 'En cours' },
      'traite': { color: 'bg-green-100 text-green-700', text: 'Traite' },
      'transfere': { color: 'bg-purple-100 text-purple-700', text: 'Transfere' }
    }
    const s = statusMap[statut] || statusMap['nouveau']
    return <span className={`px-2 py-1 text-xs rounded-full ${s.color}`}>{s.text}</span>
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Espace Citoyen</h1>
            <p className="text-gray-600">Bienvenue {user?.prenom} ! Votre voix compte.</p>
          </div>

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
                    <div className="text-red-100">Violence, vol, probleme d'eclairage, nid-de-poule...</div>
                  </div>
                </div>
                <div className="text-3xl">→</div>
              </div>
            </motion.button>
          </Link>

          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'signalements' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Evolution de mes signalements</h2>
              {signalements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">Aucun signalement pour le moment</p>
                  <Link href="/citizen/signalement" className="text-red-500 mt-2 inline-block">Creer mon premier signalement →</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {signalements.map(s => (
                    <div key={s.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusBadge(s.statut)}
                            <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="font-semibold text-lg">{s.titre}</h3>
                          <p className="text-gray-600 mt-1">{s.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span>📍 {s.localisation}</span>
                            <span>📎 {s.fichiers?.length || 0} piece(s) jointe(s)</span>
                          </div>
                        </div>
                        <Link href={`/citizen/signalement/${s.id}`}>
                          <button className="text-red-500 hover:text-red-600">Voir details →</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'campagnes' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">S'inscrire aux campagnes</h2>
              {campagnes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl"><p className="text-gray-500">Aucune campagne disponible</p></div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {campagnes.map(c => (
                    <div key={c.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                      <h3 className="font-semibold text-lg">{c.titre}</h3>
                      <p className="text-gray-600 mt-1">{c.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <div>📅 {new Date(c.dateDebut).toLocaleDateString()}</div>
                          <div>📍 {c.lieu}</div>
                        </div>
                        <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">S'inscrire →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'plaidoyers' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Signer des plaidoyers</h2>
              {plaidoyers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl"><p className="text-gray-500">Aucun plaidoyer disponible</p></div>
              ) : (
                <div className="space-y-4">
                  {plaidoyers.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="font-semibold text-lg">{p.titre}</h3>
                      <p className="text-gray-600 mt-1">{p.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-gray-500">📊 {p.signatures || 0} signatures</span>
                        <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition">✍️ Signer</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profil' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Mon profil</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><strong>Nom complet:</strong> {user?.prenom} {user?.nom}</div>
                <div><strong>Email:</strong> {user?.email}</div>
                <div><strong>Telephone:</strong> {user?.telephone}</div>
                <div><strong>Ville:</strong> {user?.ville}</div>
                <div><strong>Quartier:</strong> {user?.quartier}</div>
                <div><strong>Role:</strong> {user?.role}</div>
              </div>
              <Link href="/profile"><button className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition">Modifier mon profil</button></Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}