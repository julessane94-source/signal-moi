import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { Button, Card, Badge } from '../../components/ui'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import {
  DocumentTextIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function CitizenDashboard() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('signalements')
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [plaidoyers, setPlaidoyers] = useState([])
  const [signedPetitionIds, setSignedPetitionIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signingPetition, setSigningPetition] = useState(null)

  // ✅ FIX: Déclencher le fetch APRÈS que auth soit chargé ET user existe
  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    } else if (!authLoading && !user) {
      // Pas d'utilisateur connecté après chargement auth
      setLoading(false)
    }
  }, [authLoading, user])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setError('Veuillez vous reconnecter')
        setLoading(false)
        return
      }

      const headers = { 'Authorization': `Bearer ${token}` }
      
      const base = API_BASE
      const [signalRes, campRes, plaidRes, signedRes] = await Promise.all([
        fetch(`${base}/api/signalements`, { headers }),
        fetch(`${base}/api/campagnes`, { headers }),
        fetch(`${base}/api/plaidoyers`, { headers }),
        fetch(`${base}/api/plaidoyers/signed/user/${user.id}`, { headers })
      ])
      
      // Vérifier les réponses
      if (!signalRes.ok) {
        console.error('[Dashboard] Erreur signalements:', signalRes.status)
      }
      if (!campRes.ok) {
        console.error('[Dashboard] Erreur campagnes:', campRes.status)
      }
      if (!plaidRes.ok) {
        console.error('[Dashboard] Erreur plaidoyers:', plaidRes.status)
      }

      const signalData = signalRes.ok ? await signalRes.json() : []
      const campData = campRes.ok ? await campRes.json() : []
      const plaidData = plaidRes.ok ? await plaidRes.json() : []
      const signedData = signedRes.ok ? await signedRes.json() : []
      
      setSignalements(Array.isArray(signalData) ? signalData : [])
      setCampagnes(Array.isArray(campData) ? campData : [])
      setPlaidoyers(Array.isArray(plaidData) ? plaidData : [])
      setSignedPetitionIds(Array.isArray(signedData) ? signedData.map(p => p.id) : [])
    } catch (error) {
      console.error('[CitizenDashboard] Erreur fetch:', error)
      setError('Erreur lors du chargement des donnees. Verifiez votre connexion.')
      toast.error('Erreur reseau : impossible de charger les donnees')
      setSignalements([])
      setCampagnes([])
      setPlaidoyers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSignPetition = async (petitionId) => {
    setSigningPetition(petitionId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/plaidoyers/${petitionId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erreur lors de la signature')
      }

      // Ajouter a la liste des plaidoyers signes
      setSignedPetitionIds(prev => [...prev, petitionId])
      toast.success('Plaidoyer signe avec succes!')
    } catch (error) {
      console.error('Erreur signature:', error)
      toast.error(error.message || 'Impossible de signer le plaidoyer')
    } finally {
      setSigningPetition(null)
    }
  }

  const tabs = [
    { id: 'signalements', name: 'Mes signalements', icon: DocumentTextIcon },
    { id: 'campagnes', name: 'Campagnes', icon: CheckCircleIcon },
    { id: 'plaidoyers', name: 'Plaidoyers', icon: PencilSquareIcon },
    { id: 'profil', name: 'Mon profil', icon: UserGroupIcon }
  ]

  const getStatusBadge = (statut) => {
    const statusMap = {
      'nouveau': 'info',
      'en_cours': 'warning',
      'traite': 'success',
      'transfere': 'primary'
    }
    const textMap = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours',
      'traite': 'Traité',
      'transfere': 'Transféré'
    }
    return <Badge variant={statusMap[statut] || 'info'}>{textMap[statut] || statut}</Badge>
  }

  // ✅ Afficher le loader pendant le chargement de l'auth OU des données
  if (authLoading || loading) {
    return (
      <>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  // ✅ Afficher message d'erreur si problème auth
  if (!user) {
    return (
      <>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Erreur : Veuillez vous reconnecter</p>
            <Link href="/login">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
                Aller à la connexion
              </button>
            </Link>
          </div>
        </div>
      </>
    )
  }

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
            <h1 className="text-4xl font-bold text-gray-900">
              Espace Citoyen
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenue {user?.prenom} ! Votre voix compte.
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Link href="/citizen/signalement">
              <Button size="lg" icon={PlusIcon} className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg">
                🚨 Signaler un incident
              </Button>
            </Link>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {tabs.map((tab) => (
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
                {tab.name}
              </motion.button>
            ))}
          </div>

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
                  <p className="text-gray-500 mb-4">Aucun signalement pour le moment</p>
                  <Link href="/citizen/signalement">
                    <Button variant="primary" icon={PlusIcon}>
                      Créer mon premier signalement
                    </Button>
                  </Link>
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
                      <Card className="p-6 hover:shadow-lg transition cursor-pointer">
                        <Link href={`/citizen/signalement/${s.id}`}>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(s.statut)}
                                <span className="text-xs text-gray-400">
                                  {new Date(s.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900">{s.titre}</h3>
                              <p className="text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                <span>📍 {s.localisation}</span>
                                <span>📎 {s.fichiers?.length || 0} pièce(s)</span>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-indigo-600">Voir l'état</span>
                          </div>
                        </Link>
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
            >
              {campagnes.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500">Aucune campagne disponible</p>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campagnes.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="h-full p-6 flex flex-col hover:shadow-lg transition">
                        <h3 className="font-semibold text-lg text-gray-900">{c.titre}</h3>
                        <p className="text-gray-600 mt-2 flex-1">{c.description}</p>
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                          <div>📅 {new Date(c.dateDebut).toLocaleDateString()}</div>
                          <div>📍 {c.lieu}</div>
                        </div>
                        <Button variant="success" className="mt-4 w-full">
                          Participer à cette campagne
                        </Button>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Plaidoyers Tab */}
          {activeTab === 'plaidoyers' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {plaidoyers.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-6xl mb-4">✍️</div>
                  <p className="text-gray-500">Aucun plaidoyer disponible</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {plaidoyers.map((p, idx) => {
                    const isSigned = signedPetitionIds.includes(p.id)
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="p-6 hover:shadow-lg transition">
                          <h3 className="font-semibold text-lg text-gray-900">{p.titre}</h3>
                          <p className="text-gray-600 mt-2">{p.description}</p>
                          <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              📊 {p.signatures || 0}/{p.objectif_signatures || '?'} signatures
                            </span>
                            <button
                              onClick={() => handleSignPetition(p.id)}
                              disabled={signingPetition === p.id || isSigned}
                              className={`px-4 py-2 rounded font-medium ${
                                isSigned
                                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {isSigned ? '✓ Déjà signé' : signingPetition === p.id ? 'Signature en cours...' : 'Signer ce plaidoyer'}
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Profil Tab */}
          {activeTab === 'profil' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Prénom</p>
                    <p className="font-semibold text-gray-900">{user?.prenom}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Nom</p>
                    <p className="font-semibold text-gray-900">{user?.nom}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{user?.email}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="font-semibold text-gray-900">{user?.telephone}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Ville</p>
                    <p className="font-semibold text-gray-900">{user?.ville}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Quartier</p>
                    <p className="font-semibold text-gray-900">{user?.quartier}</p>
                  </div>
                </div>
                <Link href="/profile">
                  <Button className="mt-8">Modifier mon profil</Button>
                </Link>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
