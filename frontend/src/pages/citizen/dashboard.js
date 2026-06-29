import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { Button, Card, Badge } from '../../components/ui'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import {
  DocumentTextIcon as DocumentText,
  CheckCircleIcon as CheckCircle,
  PencilSquareIcon as PencilSquare,
  UserGroupIcon as UserGroup,
  PlusIcon as Plus,
  MapPinIcon as MapPin
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
  const [joiningCampaign, setJoiningCampaign] = useState(null)
  const [joinedCampaignIds, setJoinedCampaignIds] = useState([])
  const [locationStatus, setLocationStatus] = useState('idle')
  const [lastLocationLabel, setLastLocationLabel] = useState('')

  // ✅ FIX: Déclencher le fetch APRÈS que auth soit chargé ET user existe
  useEffect(() => {
    if (!authLoading && user) {
      fetchData()
    } else if (!authLoading && !user) {
      // Pas d'utilisateur connecté après chargement auth
      setLoading(false)
    }
  }, [authLoading, user])

  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        requestCitizenLocation({ silent: true })
      }, 700)

      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((status) => {
          if (status.state === 'denied') {
            setLocationStatus('denied')
          }
          status.onchange = () => {
            if (status.state === 'granted' || status.state === 'prompt') {
              requestCitizenLocation({ silent: true })
            } else if (status.state === 'denied') {
              setLocationStatus('denied')
            }
          }
        }).catch(() => {})
      }

      return () => clearTimeout(timer)
    }
  }, [authLoading, user?.id])

  const requestCitizenLocation = ({ silent = false } = {}) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unsupported')
      if (!silent) toast.error('Votre navigateur ne prend pas en charge la localisation GPS')
      return
    }

    setLocationStatus('requesting')
    navigator.geolocation.getCurrentPosition((position) => {
      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: new Date().toISOString()
      }
      localStorage.setItem('signal_moi_last_location', JSON.stringify(payload))
      setLastLocationLabel(`${payload.latitude.toFixed(5)}, ${payload.longitude.toFixed(5)}`)
      setLocationStatus('granted')
      if (!silent) toast.success('Position GPS partagee avec Signal-Moi')
    }, (error) => {
      setLocationStatus(error.code === 1 ? 'denied' : 'failed')
      if (!silent) {
        toast.info('Autorisez la localisation dans les parametres du navigateur, puis cliquez encore sur Partager ma position')
      }
    }, {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 0
    })
  }

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
      const [signalRes, campRes, plaidRes, signedRes, inscriptionsRes] = await Promise.all([
        fetch(`${base}/api/signalements?limit=80`, { headers }),
        fetch(`${base}/api/campagnes?limit=50`, { headers }),
        fetch(`${base}/api/plaidoyers`, { headers }),
        fetch(`${base}/api/plaidoyers/signed/user/${user.id}`, { headers }),
        fetch(`${base}/api/citizen/inscriptions`, { headers })
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
      const inscriptionsPayload = inscriptionsRes.ok ? await inscriptionsRes.json() : []
      const inscriptionsData = Array.isArray(inscriptionsPayload) ? inscriptionsPayload : (inscriptionsPayload.inscriptions || [])
      
      setSignalements(Array.isArray(signalData) ? signalData : [])
      setCampagnes(Array.isArray(campData) ? campData : [])
      setPlaidoyers(Array.isArray(plaidData) ? plaidData : [])
      setSignedPetitionIds(Array.isArray(signedData) ? signedData.map(p => p.id) : [])
      setJoinedCampaignIds(Array.isArray(inscriptionsData) ? inscriptionsData.map(item => item.campagne_id || item.campagneId).filter(Boolean) : [])
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

  const handleJoinCampaign = async (campaignId) => {
    if (!campaignId) return
    setJoiningCampaign(campaignId)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/campagnes/${campaignId}/inscrire`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errorText = String(data.error || data.message || '').toLowerCase()
        if (res.status === 400 && (errorText.includes('inscrit') || errorText.includes('campagne'))) {
          setJoinedCampaignIds(prev => prev.includes(campaignId) ? prev : [...prev, campaignId])
          toast.info('Vous etes deja inscrit a cette campagne')
          return
        }
        throw new Error(data.error || data.message || 'Inscription impossible')
      }
      setJoinedCampaignIds(prev => prev.includes(campaignId) ? prev : [...prev, campaignId])
      toast.success('Inscription a la campagne reussie')
    } catch (error) {
      console.error('Erreur inscription campagne:', error)
      toast.error(error.message || 'Impossible de participer a cette campagne')
    } finally {
      setJoiningCampaign(null)
    }
  }

  const tabs = [
    { id: 'signalements', name: 'Mes signalements', icon: DocumentText },
    { id: 'campagnes', name: 'Campagnes', icon: CheckCircle },
    { id: 'plaidoyers', name: 'Plaidoyers', icon: PencilSquare },
    { id: 'profil', name: 'Mon profil', icon: UserGroup }
  ]

  const dashboardStats = [
    { label: 'Signalements', value: signalements.length, tone: 'text-red-700 bg-red-50 border-red-100' },
    { label: 'En cours', value: signalements.filter((item) => item.statut === 'en_cours').length, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
    { label: 'Traites', value: signalements.filter((item) => item.statut === 'traite').length, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Actions locales', value: campagnes.length + plaidoyers.length, tone: 'text-blue-700 bg-blue-50 border-blue-100' }
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
      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl"
          >
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-red-300">Espace citoyen</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                  Bonjour {user?.prenom || 'citoyen'}, suivez vos actions a Sedhiou.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                  Retrouvez vos signalements, campagnes et plaidoyers dans un tableau de bord clair, rapide a parcourir.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/citizen/signalement?alerte=1">
                  <Button size="lg" icon={Plus} className="w-full bg-red-600 text-white shadow-lg hover:bg-red-700 lg:w-auto">
                    Lancer l'alerte
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => requestCitizenLocation()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 lg:w-auto"
                >
                  <MapPin className="h-5 w-5" />
                  {locationStatus === 'granted' ? 'Position partagee' : locationStatus === 'requesting' ? 'Localisation...' : 'Partager ma position'}
                </button>
              </div>
            </div>
          </motion.div>

          {locationStatus !== 'granted' && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              {locationStatus === 'denied'
                ? 'GPS bloque par le navigateur. Ouvrez les parametres du site, autorisez la localisation, puis cliquez sur Partager ma position.'
                : 'Autorisez le GPS dans votre navigateur pour que la carte et la police recoivent votre vraie position, pas une ville approximative.'}
            </div>
          )}

          {locationStatus === 'granted' && lastLocationLabel && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
              Position GPS active: {lastLocationLabel}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {dashboardStats.map((stat) => (
              <div key={stat.label} className={`rounded-2xl border p-5 shadow-sm ${stat.tone}`}>
                <p className="text-sm font-semibold">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
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
          <div className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-950 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100'
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
                    <Button variant="primary" icon={Plus}>
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
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 shadow-sm">
                              Voir l'état
                            </span>
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
                  {campagnes.map((c, idx) => {
                    const campaignDate = c.dateDebut || c.date_debut
                    const isJoined = joinedCampaignIds.includes(c.id)
                    const isJoining = joiningCampaign === c.id
                    return (
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
                            <div>📅 {campaignDate ? new Date(campaignDate).toLocaleDateString('fr-FR') : 'Date a confirmer'}</div>
                            <div>📍 {c.lieu}</div>
                          </div>
                          <Button
                            variant={isJoined ? 'secondary' : 'success'}
                            disabled={isJoined || isJoining}
                            onClick={() => handleJoinCampaign(c.id)}
                            className="mt-4 w-full rounded-full px-5 py-3 shadow-lg hover:shadow-xl transition disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isJoined ? 'Deja inscrit' : isJoining ? 'Inscription...' : 'Participer a cette campagne'}
                          </Button>
                        </Card>
                      </motion.div>
                    )
                  })}
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
                            <Button
                              onClick={() => handleSignPetition(p.id)}
                              disabled={signingPetition === p.id || isSigned}
                              className={`w-full rounded-full font-semibold ${
                                isSigned
                                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {isSigned ? '✓ Déjà signé' : signingPetition === p.id ? 'Signature en cours...' : 'Signer ce plaidoyer'}
                            </Button>
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

