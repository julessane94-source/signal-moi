import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { toast } from 'react-toastify'
import { io as socketIOClient } from 'socket.io-client'
import { motion } from 'framer-motion'
import Head from 'next/head'
import {
  DocumentTextIcon as DocumentText,
  CheckCircleIcon as CheckCircle,
  CogIcon as Cog,
  ExclamationTriangleIcon as ExclamationTriangle,
  HandThumbUpIcon as HandThumbsUp,
  UsersIcon as Users,
  ArrowRightIcon as ArrowRight,
  BookmarkIcon as Bookmark,
  SparklesIcon as Sparkles
} from '@heroicons/react/24/outline'

export default function CollaboratorDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Déclarer tous les states avant les retours conditionnels
  const [signalements, setSignalements] = useState([])
  const [loadingSignals, setLoadingSignals] = useState(true)
  const [followed, setFollowed] = useState([])
  const [followedList, setFollowedList] = useState([])
  const [stats, setStats] = useState({ totalSignalements: 0, totalCampaigns: 0, pendingNotifications: 0 })
  const [completeStats, setCompleteStats] = useState(null)
  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [recentPlaidoyers, setRecentPlaidoyers] = useState([])
  const socketRef = useRef(null)

  // TOUS les useEffect doivent être appelés AVANT les conditional returns
  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'collaborateur') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Only run effects if user is collaborateur
    if (!user || user.role !== 'collaborateur' || loading) return

    const fetchSignals = async () => {
      setLoadingSignals(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/collaborator/signalements`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        setSignalements(data || [])
      } catch (err) {
        console.error('Erreur fetch signalements:', err)
        toast.error('Impossible de récupérer les signalements')
      } finally {
        setLoadingSignals(false)
      }
    }
    fetchSignals()
    // fetch dashboard stats (counts)
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch(`${API_BASE}/api/collaborator/dashboard`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (r.ok) {
          const d = await r.json()
          setStats(d.stats || {})
        }
      } catch (e) {
        console.warn('fetchDashboard failed', e)
      }
    }
    fetchDashboard()

    const fetchCompleteStats = async () => {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch(`${API_BASE}/api/collaborator/statistics`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (r.ok) {
          const d = await r.json()
          setCompleteStats(d)
          setStats(prev => ({
            ...prev,
            totalSignalements: d.totals?.signalements ?? prev.totalSignalements,
            totalCampaigns: d.totals?.campagnes ?? prev.totalCampaigns
          }))
        }
      } catch (e) {
        console.warn('fetchCompleteStats failed', e)
      }
    }
    fetchCompleteStats()

    // fetch recent campaigns created by this collaborator
    const fetchMyCampaigns = async () => {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch(`${API_BASE}/api/collaborator/campaigns`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (r.ok) {
          const d = await r.json()
          setRecentCampaigns(d.slice(0,4) || [])
        }
      } catch (e) { console.warn('fetchMyCampaigns failed', e) }
    }
    fetchMyCampaigns()

    // fetch recent plaidoyers authored by this user
    const fetchMyPlaidoyers = async () => {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch(`${API_BASE}/api/plaidoyers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (r.ok) {
          const list = await r.json()
          const mine = Array.isArray(list) ? list.filter(p => p.auteur_id === user.id).slice(0,4) : []
          setRecentPlaidoyers(mine)
        }
      } catch (e) { console.warn('fetchMyPlaidoyers failed', e) }
    }
    fetchMyPlaidoyers()
    // fetch followed list from server
    const fetchFollowed = async () => {
      try {
        const token = localStorage.getItem('token')
        const r = await fetch(`${API_BASE}/api/collaborator/followed`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (r.ok) {
          const d = await r.json()
          setFollowedList(d || [])
          setFollowed((d || []).map(x => x.id))
        }
      } catch (e) {
        console.warn('fetchFollowed failed', e)
      }
    }
    fetchFollowed()

    // setup socket
    try {
      const token = localStorage.getItem('token')
      const socket = socketIOClient(API_BASE.replace(/^http/, 'ws'), { auth: { token } })
      socketRef.current = socket
      socket.on('connect', () => console.log('socket connected'))
      socket.on('followed_case_update', (payload) => {
        toast.info(payload.message || 'Mise à jour dossier')
        // Update local state for signalements if present
        setSignalements(prev => prev.map(s => s.id === payload.signalementId ? { ...s, statut: payload.nouveauStatut } : s))
      })
    } catch (e) {
      console.warn('socket init failed', e)
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'collaborateur') {
    return null
  }

  const toggleFollow = async (id) => {
    try {
      const token = localStorage.getItem('token')
      if (!followed.includes(id)) {
        const res = await fetch(`${API_BASE}/api/collaborator/follow`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ caseId: id })
        })
        if (!res.ok) throw new Error('failed')
        setFollowed(prev => [...prev, id])
        // refresh followed list
        const r = await fetch(`${API_BASE}/api/collaborator/followed`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (r.ok) { const d = await r.json(); setFollowedList(d || []) }
        toast.info('Dossier suivi')
      } else {
        const res = await fetch(`${API_BASE}/api/collaborator/follow/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!res.ok) throw new Error('failed')
        setFollowed(prev => prev.filter(x => x !== id))
        const r = await fetch(`${API_BASE}/api/collaborator/followed`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (r.ok) { const d = await r.json(); setFollowedList(d || []) }
        toast.info('Suivi retiré')
      }
    } catch (err) {
      console.error('toggleFollow error', err)
      toast.error('Impossible de modifier le suivi')
    }
  }

  const contact = (email) => {
    if (!email) { toast.error('Email non disponible') ; return }
    window.location.href = `mailto:${email}`
  }

  const exportCases = async (format = 'pdf') => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/collaborator/export/cases?format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'excel' ? 'dossiers_suivis.xlsx' : 'dossiers_suivis.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('export error', e)
      toast.error('Export impossible')
    }
  }

  const exportStatistics = async (format = 'excel') => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/collaborator/statistics/export?format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'pdf' ? 'statistiques_collaborateur.pdf' : 'statistiques_collaborateur.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('statistics export error', e)
      toast.error('Export statistiques impossible')
    }
  }

  return (
    <>
      <Head>
        <title>Espace Collaborateur - Signal-Moi</title>
      </Head>
      
      <div className="min-h-screen bg-slate-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* === HEADER AVEC SALUTATION === */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl"
          >
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Espace collaborateur</p>
                <h1 className="mt-2 text-3xl font-black md:text-5xl">
                  Bonjour {user?.prenom || 'collaborateur'}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
                  Pilotez les campagnes, suivez les dossiers importants et exportez les statistiques locales depuis un espace plus clair.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/collaborator/campagne/new">
                  <button className="rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 shadow-lg transition hover:bg-emerald-400">
                    Nouvelle campagne
                  </button>
                </Link>
                <Link href="/profile">
                  <button className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15">
                    Mon profil
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* === STATISTIQUES PRINCIPALES === */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8"
          >
            {[
              {
                label: 'Signalements assignés',
                value: stats.totalSignalements || 0,
                icon: DocumentText,
                gradient: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
                textColor: 'text-blue-600'
              },
              {
                label: 'Mes campagnes',
                value: stats.totalCampaigns || 0,
                icon: Sparkles,
                gradient: 'from-emerald-500 to-emerald-600',
                bgColor: 'bg-emerald-50',
                textColor: 'text-emerald-600'
              },
              {
                label: 'Notifications en attente',
                value: stats.pendingNotifications || 0,
                icon: ExclamationTriangle,
                gradient: 'from-amber-500 to-amber-600',
                bgColor: 'bg-amber-50',
                textColor: 'text-amber-600'
              }
            ].map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">{stat.label}</p>
                    <p className={`text-4xl font-black ${stat.textColor}`}>{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                </div>
              </motion.div>
              );
            })}
          </motion.div>

          {completeStats && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 grid gap-4 lg:grid-cols-3"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Statistiques completes</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  {Object.entries({
                    Nouveaux: completeStats.totals?.nouveaux,
                    'En cours': completeStats.totals?.enCours,
                    Traites: completeStats.totals?.traites,
                    '7 jours': completeStats.totals?.last7d,
                    GPS: completeStats.totals?.avecGps,
                    Anonymes: completeStats.totals?.anonymes
                  }).map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-slate-500">{label}</p>
                      <p className="text-xl font-bold text-slate-950">{value || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Types les plus signales</h3>
                <div className="mt-4 space-y-2 text-sm">
                  {Object.entries(completeStats.byType || {}).slice(0, 8).map(([label, value]) => (
                    <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span>{label}</span><strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-950">Zones concernees</h3>
                <div className="mt-4 space-y-2 text-sm">
                  {Object.entries(completeStats.byZone || {}).slice(0, 8).map(([label, value]) => (
                    <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="truncate pr-3">{label}</span><strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* === ACTIONS RAPIDES === */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-black text-slate-950 mb-5 flex items-center gap-2">
              <Cog className="h-7 w-7" /> Actions rapides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: '🎯',
                  label: 'Créer une campagne',
                  href: '/collaborator/campagne/new',
                  color: 'from-blue-600 to-blue-700',
                  bg: 'from-blue-50 to-blue-100'
                },
                {
                  icon: '📋',
                  label: 'Mes campagnes',
                  href: '/collaborator/campagne/mes-campagnes',
                  color: 'from-slate-600 to-slate-700',
                  bg: 'from-slate-50 to-slate-100'
                },
                {
                  icon: '✍️',
                  label: 'Créer un plaidoyer',
                  href: '/collaborator/plaidoyer/new',
                  color: 'from-teal-600 to-teal-700',
                  bg: 'from-teal-50 to-teal-100'
                },
                {
                  icon: '📝',
                  label: 'Mes plaidoyers',
                  href: '/collaborator/plaidoyer/mes-plaidoyers',
                  color: 'from-amber-600 to-amber-700',
                  bg: 'from-amber-50 to-amber-100'
                }
              ].map((action, idx) => (
                <motion.div key={idx} whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                  <Link href={action.href}>
                    <button className="w-full rounded-3xl border border-slate-200 bg-white px-6 py-5 text-left font-bold text-slate-950 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl text-white">{action.icon}</div>
                      <span>{action.label}</span>
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Boutons exports */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="font-black text-slate-950">Telechargements</h3>
                <p className="text-sm text-slate-500">Exportez les dossiers ou les statistiques pour vos rapports.</p>
              </div>
              <div className="flex gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportCases('pdf')}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                Dossiers PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportCases('excel')}
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Dossiers Excel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportStatistics('pdf')}
                className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-3 font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                Stats PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportStatistics('excel')}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                Stats Excel
              </motion.button>
              <Link href="/collaborator/statistics">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800 transition hover:bg-slate-100"
                >
                  Statistiques avancees
                </motion.button>
              </Link>
              </div>
            </div>
          </motion.div>

          {/* === CONTENU PRINCIPAL === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Colonne gauche: campagnes et plaidoyers */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Campagnes récentes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="h-6 w-6" /> Mes campagnes récentes
                    </h3>
                    <Link href="/collaborator/campagne/mes-campagnes" className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">
                        Voir tout
                      </Link>
                  </div>
                </div>
                <div className="p-6">
                  {recentCampaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucune campagne créée</p>
                      <Link href="/collaborator/campagne/new" className="inline-block mt-3 text-blue-600 font-semibold hover:underline">
                          Créer la première →
                        </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentCampaigns.map((c, idx) => (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 hover:border-blue-300 transition"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{c.titre}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              Lancée le {new Date(c.date_debut).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Link href={`/campagnes/${c.id}`}>
                            <a className="text-blue-600 hover:text-blue-700 font-semibold ml-4 flex items-center gap-1">
                              Voir <ArrowRight className="h-4 w-4" />
                            </a>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Plaidoyers récents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <HandThumbsUp className="h-6 w-6" /> Mes plaidoyers récents
                    </h3>
                    <Link href="/collaborator/plaidoyer/mes-plaidoyers" className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition">
                        Voir tout
                      </Link>
                  </div>
                </div>
                <div className="p-6">
                  {recentPlaidoyers.length === 0 ? (
                    <div className="text-center py-8">
                      <HandThumbsUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun plaidoyer créé</p>
                      <Link href="/collaborator/plaidoyer/new" className="inline-block mt-3 text-amber-600 font-semibold hover:underline">
                          Créer le premier →
                        </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentPlaidoyers.map((p, idx) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start justify-between p-4 bg-gradient-to-r from-amber-50 to-transparent rounded-xl border border-amber-100 hover:border-amber-300 transition"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{p.titre}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {p.categorie} • {p.nombre_signatures_total || 0} signatures
                            </p>
                          </div>
                          <Link href={`/plaidoyers/${p.id}`}>
                            <a className="text-amber-600 hover:text-amber-700 font-semibold ml-4 flex items-center gap-1">
                              Voir <ArrowRight className="h-4 w-4" />
                            </a>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

            </div>

            {/* Colonne droite: dossiers suivis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Bookmark className="h-6 w-6" /> Dossiers suivis
                </h3>
              </div>
              <div className="p-6">
                {followedList.length === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Vous ne suivez aucun dossier</p>
                    <p className="text-sm text-gray-400">Les dossiers que vous suivez apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {followedList.map((f) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100 hover:border-green-300 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 line-clamp-1">{f.titre}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                f.statut === 'traite' ? 'bg-green-100 text-green-700' :
                                f.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {f.statut || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Link href={`/citizen/signalement/${f.id}`}>
                            <a className="text-xs text-green-600 hover:text-green-700 font-semibold">Voir</a>
                          </Link>
                          <button
                            onClick={() => toggleFollow(f.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-semibold ml-auto"
                          >
                            Arrêter
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

          </div>

          {/* === SIGNALEMENTS ASSIGNÉS === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DocumentText className="h-7 w-7" /> Signalements assignés
            </h2>
            
            {loadingSignals ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Chargement des signalements...</p>
              </div>
            ) : signalements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <DocumentText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Aucun signalement assigné</p>
                <p className="text-gray-500 mt-2">Les signalements vous seront assignés au fur et à mesure</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {signalements.map((s, idx) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition overflow-hidden flex flex-col h-full"
                  >
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2"></div>
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1">{s.titre}</h3>
                        <span className="text-xs font-semibold text-gray-500 ml-2 flex-shrink-0">
                          {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 flex-1 line-clamp-3 mb-4">{s.description}</p>
                      
                      <div className="flex items-center gap-2 mb-4">
                        {s.author && (
                          <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                            👤 {s.author.prenom}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => contact(s.author?.email)}
                          className="w-full text-sm font-semibold py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-lg hover:from-indigo-100 hover:to-purple-100 transition border border-indigo-200"
                        >
                          📧 Contacter l'auteur
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleFollow(s.id)}
                          className={`w-full text-sm font-semibold py-2 rounded-lg transition ${
                            followed.includes(s.id)
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          {followed.includes(s.id) ? '✓ Suivi' : '+ Suivre ce dossier'}
                        </motion.button>
                        <Link href={`/citizen/signalement/${s.id}`}>
                          <a className="w-full text-center text-sm font-semibold py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition border border-gray-300">
                            Voir tous les détails →
                          </a>
                        </Link>
                      </div>
                    </div>
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

