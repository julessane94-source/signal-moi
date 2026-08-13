import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { Button, Card, Badge, Modal, StatBox } from '../../components/ui'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { API_BASE } from '../../config/api'
import { notifyRealtimeEvent } from '../../utils/realtimeAlerts'
import {
  MapPinIcon as MapPin,
  DocumentTextIcon as DocumentText,
  ExclamationTriangleIcon as ExclamationTriangle,
  VideoCameraIcon as VideoCamera,
  ShieldCheckIcon as ShieldCheck,
  PaperClipIcon as PaperClip,
  CalendarDaysIcon as CalendarDays,
  PhoneIcon as Phone,
  EnvelopeIcon as Envelope,
  BellAlertIcon as BellAlert,
  QueueListIcon as QueueList,
  ArchiveBoxIcon as ArchiveBox,
  BuildingOffice2Icon as BuildingOffice2,
  UsersIcon as Users,
  IdentificationIcon as Identification,
  ClipboardDocumentCheckIcon as ClipboardCheck
} from '@heroicons/react/24/outline'

const normalizeRole = (role) => String(role || '').trim().toLowerCase()
const canAccessPoliceDashboard = (role) => ['admin', 'administrateur', 'commissariat', 'police', 'policier', 'gendarmerie', 'force_ordre'].includes(normalizeRole(role))
const isCommissariatRole = (role) => normalizeRole(role) === 'commissariat'

export default function PoliceDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { socket, unlockNotificationSound, requestNotificationPermission } = useSocket()
  const [signalements, setSignalements] = useState([])
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [policiers, setPoliciers] = useState([])
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedPoliceToTransfer, setSelectedPoliceToTransfer] = useState(null)
  const [transferingSignalId, setTransferingSignalId] = useState(null)
  const [liveRecordings, setLiveRecordings] = useState({})
  const [selectedLive, setSelectedLive] = useState(null)
  const [socketConnected, setSocketConnected] = useState(false)
  const [interventionLoading, setInterventionLoading] = useState({})
  const [alertsReady, setAlertsReady] = useState(false)
  const [livePlaybackUrls, setLivePlaybackUrls] = useState({})
  const [agentForm, setAgentForm] = useState({ prenom: '', nom: '', email: '', telephone: '', password: '' })
  const [creatingAgent, setCreatingAgent] = useState(false)
  const liveVideoChunksRef = useRef({})
  const livePlaybackUrlsRef = useRef({})
  const liveAlertedRef = useRef({})

  useEffect(() => {
    if (authLoading || !user || !canAccessPoliceDashboard(user.role)) return

    localStorage.setItem('signal_moi_police_alerts_enabled', 'true')

    const activatePoliceAlerts = async ({ notify = false } = {}) => {
      const [soundReady, permission] = await Promise.all([
        unlockNotificationSound?.(),
        requestNotificationPermission?.()
      ])
      const ready = Boolean(soundReady) || permission === 'granted'
      setAlertsReady(ready)
      if (notify && ready) {
        toast.success(permission === 'granted' ? 'Alertes police actives' : 'Son active. Autorisez les notifications du navigateur.')
      }
      return ready
    }

    const unlockPoliceAlerts = () => {
      activatePoliceAlerts()
    }

    activatePoliceAlerts()
    window.addEventListener('pointerdown', unlockPoliceAlerts)
    window.addEventListener('keydown', unlockPoliceAlerts)
    window.addEventListener('touchstart', unlockPoliceAlerts)
    window.addEventListener('focus', unlockPoliceAlerts)

    return () => {
      window.removeEventListener('pointerdown', unlockPoliceAlerts)
      window.removeEventListener('keydown', unlockPoliceAlerts)
      window.removeEventListener('touchstart', unlockPoliceAlerts)
      window.removeEventListener('focus', unlockPoliceAlerts)
    }
  }, [authLoading, user?.role, unlockNotificationSound, requestNotificationPermission])

  useEffect(() => {
    livePlaybackUrlsRef.current = livePlaybackUrls
  }, [livePlaybackUrls])

  const triggerLiveSoundAlert = async (data = {}) => {
    const alertKey = data.sessionId || data.id || `live-${Date.now()}`
    const lastAlert = liveAlertedRef.current[alertKey] || 0
    if (Date.now() - lastAlert < 15000) return
    liveAlertedRef.current[alertKey] = Date.now()

    await unlockNotificationSound?.()
    await requestNotificationPermission?.()
    setAlertsReady(true)
    notifyRealtimeEvent({
      role: user?.role,
      event: 'live_recording_started',
      payload: {
        ...data,
        isLiveRecording: true,
        titre: data.titre || data.title || 'Live citoyen en cours'
      },
      toast
    })
  }

  useEffect(() => {
    return () => {
      Object.values(livePlaybackUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      setLoading(false)
      return
    }
    if (!canAccessPoliceDashboard(user.role)) {
      toast.error('Acces reserve aux forces de securite')
      router.replace('/citizen/dashboard')
      setLoading(false)
      return
    }

    fetchSignalements()
    fetchPoliciers()
    fetchLiveSessions()
    const livePoll = setInterval(fetchLiveSessions, 2500)
    
    if (socket) {
      setSocketConnected(socket.connected)
      const handleConnect = () => setSocketConnected(true)
      const handleDisconnect = () => setSocketConnected(false)

      const handleNewSignalementNotification = (data) => {
        if (data.isLiveRecording) {
          triggerLiveSoundAlert(data)
          return
        }
        fetchSignalements()
      }
      
      const handleSignalementReceived = () => {
        fetchSignalements()
      }

      const handleLiveRecordingStarted = (data) => {
        triggerLiveSoundAlert(data)
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            status: 'recording'
          }
        }))
      }

      const handleLiveRecordingLocation = (data) => {
        if (!data.sessionId) return
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            sessionId: data.sessionId,
            status: prev[data.sessionId]?.status || 'recording'
          }
        }))
      }

      const handleLiveRecordingFrame = (data) => {
        if (!data.sessionId) return
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            sessionId: data.sessionId,
            frame: data.frame,
            frameAt: data.frameAt,
            status: prev[data.sessionId]?.status || 'recording'
          }
        }))
      }

      const handleLiveRecordingChunk = (data) => {
        if (!data.sessionId || !data.chunk) return
        if (!liveVideoChunksRef.current[data.sessionId]) {
          liveVideoChunksRef.current[data.sessionId] = []
        }
        liveVideoChunksRef.current[data.sessionId].push(data.chunk)
        Promise.all(liveVideoChunksRef.current[data.sessionId].map(dataUrlToBlob))
          .then((blobs) => {
            const mimeType = data.mimeType || blobs[0]?.type || 'video/webm'
            const playbackBlob = new Blob(blobs, { type: mimeType })
            const playbackUrl = URL.createObjectURL(playbackBlob)
            setLivePlaybackUrls(prev => {
              if (prev[data.sessionId]) URL.revokeObjectURL(prev[data.sessionId])
              return { ...prev, [data.sessionId]: playbackUrl }
            })
          })
          .catch((error) => console.warn('Lecture live impossible:', error))
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            sessionId: data.sessionId,
            chunk: undefined,
            videoChunkCount: liveVideoChunksRef.current[data.sessionId].length,
            videoMimeType: data.mimeType || prev[data.sessionId]?.videoMimeType || 'video/webm',
            status: prev[data.sessionId]?.status || 'recording'
          }
        }))
      }

      const handleLiveRecordingStopped = (data) => {
        if (!data.sessionId) return
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            sessionId: data.sessionId,
            status: 'stopped'
          }
        }))
      }

      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('new_signalement_notification', handleNewSignalementNotification)
      socket.on('signalement_received', handleSignalementReceived)
      socket.on('live_recording_started', handleLiveRecordingStarted)
      socket.on('live_recording_location', handleLiveRecordingLocation)
      socket.on('live_recording_frame', handleLiveRecordingFrame)
      socket.on('live_recording_chunk', handleLiveRecordingChunk)
      socket.on('live_recording_stopped', handleLiveRecordingStopped)

      return () => {
        clearInterval(livePoll)
        socket.off('connect', handleConnect)
        socket.off('disconnect', handleDisconnect)
        socket.off('new_signalement_notification', handleNewSignalementNotification)
        socket.off('signalement_received', handleSignalementReceived)
        socket.off('live_recording_started', handleLiveRecordingStarted)
        socket.off('live_recording_location', handleLiveRecordingLocation)
        socket.off('live_recording_frame', handleLiveRecordingFrame)
        socket.off('live_recording_chunk', handleLiveRecordingChunk)
        socket.off('live_recording_stopped', handleLiveRecordingStopped)
      }
    }
    
    return () => {
      clearInterval(livePoll)
    }
  }, [socket, user, authLoading, filter])

  const fetchSignalements = async () => {
    try {
      const token = localStorage.getItem('token')
      const archiveParam = filter === 'archives' ? '&archive=true' : ''
      const res = await fetch(`${API_BASE}/api/signalements?limit=120${archiveParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setSignalements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur de chargement des signalements')
    } finally {
      setLoading(false)
    }
  }

  const fetchPoliciers = async () => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = isCommissariatRole(user?.role) ? '/api/law-enforcement/agents' : '/api/signalements/policiers'
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      const rawAgents = Array.isArray(data) ? data : (data.agents || [])
      const policiersList = Array.isArray(rawAgents)
        ? rawAgents.filter(u => u.id !== user?.id)
        : []
      setPoliciers(policiersList)
    } catch (error) {
      console.error('Erreur chargement policiers:', error)
    }
  }

  const handleAgentFormChange = (e) => {
    const { name, value } = e.target
    setAgentForm(prev => ({ ...prev, [name]: value }))
  }

  const createAgent = async (e) => {
    e.preventDefault()
    if (!isCommissariatRole(user?.role)) return
    setCreatingAgent(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/law-enforcement/agents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(agentForm)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Creation impossible')
      toast.success('Agent cree et rattache au commissariat')
      setAgentForm({ prenom: '', nom: '', email: '', telephone: '', password: '' })
      fetchPoliciers()
    } catch (error) {
      toast.error(error.message || 'Impossible de creer cet agent')
    } finally {
      setCreatingAgent(false)
    }
  }

  const mergeLiveSessions = (sessions = []) => {
    if (!Array.isArray(sessions)) return
    setLiveRecordings(prev => {
      const next = { ...prev }
      sessions.forEach((live) => {
        if (!live?.sessionId) return
        next[live.sessionId] = {
          ...next[live.sessionId],
          ...live,
          status: live.status || next[live.sessionId]?.status || 'recording'
        }
      })
      return next
    })
  }

  const fetchLiveSessions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await fetch(`${API_BASE}/api/signalements/live-sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      mergeLiveSessions(data.sessions || [])
    } catch (error) {
      console.warn('Erreur chargement lives:', error)
    }
  }

  const updateStatus = async (id, statut, { silent = false } = {}) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/signalements/${id}/statut`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Mise a jour impossible')
      }
      const data = await res.json().catch(() => ({}))
      if (!silent) toast.success(`Statut mis a jour: ${statut}`)
      fetchSignalements()
      setSelectedSignal(null)
      return data.signalement || null
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise a jour')
      throw error
    }
  }

  const handleIntervention = async (signal) => {
    if (!signal?.id || interventionLoading[signal.id]) return
    setInterventionLoading(prev => ({ ...prev, [signal.id]: true }))
    try {
      await unlockNotificationSound?.()
      await requestNotificationPermission?.()
      const updatedSignal = await updateStatus(signal.id, 'en_cours', { silent: true })
      const nextSignal = { ...signal, ...(updatedSignal || {}), statut: 'en_cours' }
      setSelectedSignal(nextSignal)
      toast.success('Intervention demarree. Le dossier est marque en cours.')
    } catch (error) {
      console.error('Intervention impossible:', error)
    } finally {
      setInterventionLoading(prev => {
        const next = { ...prev }
        delete next[signal.id]
        return next
      })
    }
  }

  const transferer = async (signalId, policeId) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/signalements/${signalId}/transfert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ police_id: policeId })
      })
      if (!res.ok) throw new Error('Erreur transfere')
      
      // Aussi mettre a jour le statut a 'transfere'
      await fetch(`${API_BASE}/api/signalements/${signalId}/statut`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: 'transfere' })
      })
      
      toast.success('Dossier transfere avec succes')
      setShowTransferModal(false)
      setSelectedPoliceToTransfer(null)
      setTransferingSignalId(null)
      setSelectedSignal(null)
      fetchSignalements()
    } catch (error) {
      console.error('Erreur transfere:', error)
      toast.error('Erreur lors du transfere')
    }
  }

  const getFilteredSignalements = () => {
    if (filter === 'all') return signalements
    if (filter === 'archives') return signalements
    return signalements.filter(s => s.statut === filter)
  }

  const priorityOrder = { 'urgente': 4, 'haute': 3, 'moyenne': 2, 'basse': 1 }

  const getPriorityColor = (prio) => {
    const prioBasse = (prio || '').toLowerCase()
    switch(prioBasse) {
      case 'urgente': return 'red'
      case 'haute': return 'orange'
      case 'moyenne': return 'yellow'
      case 'basse': return 'green'
      default: return 'gray'
    }
  }

  const getSortedFilteredSignalements = () => {
    return getFilteredSignalements().slice().sort((a, b) => {
      const pa = priorityOrder[(a.priorite || '').toLowerCase()] || 0
      const pb = priorityOrder[(b.priorite || '').toLowerCase()] || 0
      const typeCompare = String(a.type || '').localeCompare(String(b.type || ''), 'fr')
      return typeCompare || pb - pa || new Date(b.createdAt) - new Date(a.createdAt)
    })
  }

  const getVerificationTone = (verification) => {
    const level = verification?.niveau
    if (level === 'fiable') return { label: 'Fiable', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    if (level === 'suspect') return { label: 'Suspect', className: 'bg-red-50 text-red-700 border-red-200' }
    return { label: 'A verifier', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  }

  const getHourGroup = (signalement) => {
    const date = new Date(signalement.createdAt || signalement.updatedAt || Date.now())
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' - ' +
      date.toLocaleTimeString('fr-FR', { hour: '2-digit' }) + '00'
  }

  const getSignalGroupKey = (signalement) => `${signalement.type || 'autre'}-${getHourGroup(signalement)}`

  const getHighestPrioriteSignalement = () => {
    const sorted = getSortedFilteredSignalements()
    return sorted.length > 0 ? sorted[0] : null
  }

  const getStatusVariant = (statut) => {
    switch(statut) {
      case 'nouveau': return 'warning'
      case 'en_cours': return 'info'
      case 'traite': return 'success'
      case 'transfere': return 'primary'
      case 'fausse_alerte': return 'danger'
      default: return 'gray'
    }
  }

  const stats = {
    total: signalements.length,
    nouveaux: signalements.filter(s => s.statut === 'nouveau').length,
    enCours: signalements.filter(s => s.statut === 'en_cours').length,
    traites: signalements.filter(s => s.statut === 'traite').length
  }

  const topSignal = filter === 'archives' ? null : getHighestPrioriteSignalement()
  const liveRecordingsList = Object.values(liveRecordings)
    .filter(item => item && item.status === 'recording')
    .sort((a, b) => new Date(b.startedAt || b.updatedAt || 0) - new Date(a.startedAt || a.updatedAt || 0))
  const lastLive = Object.values(liveRecordings)
    .filter(Boolean)
    .sort((a, b) => new Date(b.frameAt || b.updatedAt || b.startedAt || b.stoppedAt || 0) - new Date(a.frameAt || a.updatedAt || a.startedAt || a.stoppedAt || 0))[0]
  const activeLive = selectedLive ? liveRecordings[selectedLive.sessionId] || selectedLive : liveRecordingsList[0]
  const commissariatName = user?.quartier || user?.commissariat || 'Commissariat central de Sedhiou'
  const isCommissariat = isCommissariatRole(user?.role)
  const openAgentCases = signalements.filter(s => ['nouveau', 'en_cours', 'transfere'].includes(s.statut)).length
  const agentInterfaceCards = [
    {
      title: 'Mes interventions',
      value: openAgentCases,
      detail: 'Dossiers a prendre ou a suivre',
      icon: QueueList,
      tone: 'border-sky-100 bg-sky-50 text-sky-700'
    },
    {
      title: 'Urgences terrain',
      value: signalements.filter(s => ['urgente', 'haute'].includes((s.priorite || '').toLowerCase())).length,
      detail: 'A traiter en priorite',
      icon: BellAlert,
      tone: 'border-red-100 bg-red-50 text-red-700'
    },
    {
      title: 'Dossiers finalises',
      value: stats.traites,
      detail: 'Interventions cloturees',
      icon: ArchiveBox,
      tone: 'border-emerald-100 bg-emerald-50 text-emerald-700'
    }
  ]
  const agentQuickActions = [
    { label: 'Dossiers a prendre', value: 'nouveau', icon: QueueList, tone: 'bg-slate-950 text-white hover:bg-slate-800' },
    { label: 'Interventions', value: 'en_cours', icon: ClipboardCheck, tone: 'bg-amber-500 text-white hover:bg-amber-600' },
    { label: 'Archives terrain', value: 'traite', icon: ArchiveBox, tone: 'bg-emerald-600 text-white hover:bg-emerald-700' }
  ]
  const agentsCommissariat = [user, ...policiers]
    .filter(Boolean)
    .filter((agent, index, list) => list.findIndex((item) => item?.id === agent?.id) === index)
  const agentsMemeCommissariat = agentsCommissariat.filter((agent) => {
    const zone = agent?.quartier || agent?.commissariat || 'Commissariat central de Sedhiou'
    return String(zone).toLowerCase() === String(commissariatName).toLowerCase()
  })

  const dataUrlToBlob = async (dataUrl) => {
    const response = await fetch(dataUrl)
    return response.blob()
  }

  const downloadLiveFrame = (live) => {
    if (!live?.frame) {
      toast.info('Aucune image live a enregistrer pour le moment')
      return
    }
    const a = document.createElement('a')
    a.href = live.frame
    a.download = `live-police-${live.sessionId || Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const downloadLiveVideo = async (live) => {
    const chunks = liveVideoChunksRef.current[live?.sessionId] || []
    if (!chunks.length) {
      downloadLiveFrame(live)
      return
    }
    try {
      const blobs = await Promise.all(chunks.map(dataUrlToBlob))
      const mimeType = live.videoMimeType || blobs[0]?.type || 'video/webm'
      const blob = new Blob(blobs, { type: mimeType })
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `live-police-complet-${live.sessionId || Date.now()}.${extension}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Video live complete enregistree sur cet ordinateur')
    } catch (error) {
      console.error('Erreur enregistrement video live:', error)
      toast.error('Impossible de reconstruire la video complete')
    }
  }

  if (!authLoading && (!user || !canAccessPoliceDashboard(user.role))) {
    return (
      <div className="min-h-screen bg-slate-100 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-950">Acces reserve</h1>
          <p className="mt-2 text-sm text-slate-600">Cet espace est uniquement accessible aux comptes police, gendarmerie ou administrateur.</p>
        </div>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-slate-100 pt-20 pb-12">
        {/* Alert bar pour signalement prioritaire */}
        {topSignal && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-20 z-40 border-y border-red-200 bg-red-600 text-white shadow-lg px-4 py-4 mb-8"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <ExclamationTriangle className="h-6 w-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{topSignal.titre}</p>
                  <p className="text-red-100 text-sm">Priorite: {topSignal.priorite || 'Normal'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleIntervention(topSignal)}
                  disabled={!!interventionLoading[topSignal.id]}
                  className="text-red-600 hover:bg-red-50"
                >
                  {interventionLoading[topSignal.id] ? 'En cours...' : 'Intervenir'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (topSignal.latitude && topSignal.longitude) {
                      window.open(`https://www.google.com/maps/?q=${topSignal.latitude},${topSignal.longitude}`, '_blank')
                    } else {
                      window.open(`https://www.google.com/maps/search/${encodeURIComponent(topSignal.localisation)}`, '_blank')
                    }
                  }}
                  className="text-red-600 hover:bg-red-50"
                >
                  Localiser
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 overflow-hidden rounded-[2rem] border text-white shadow-2xl ${
              isCommissariat
                ? 'border-slate-200 bg-slate-950'
                : 'border-sky-300/20 bg-gradient-to-br from-sky-950 via-blue-900 to-slate-950'
            }`}
          >
            <div className="grid min-w-0 gap-6 p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)] lg:p-8">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
                    {isCommissariat ? 'Espace commissariat' : 'Interface agent'}
                  </p>
                  <h1 className="mt-2 text-3xl font-black leading-tight text-white md:text-5xl">
                    {isCommissariat ? 'Coordination commissariat' : 'Poste agent terrain'}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                    {isCommissariat
                      ? `${user?.prenom || ''} ${user?.nom || ''} · ${commissariatName}`
                      : `${user?.prenom || ''} ${user?.nom || ''} · ${commissariatName}`}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{commissariatName}</span>
                    {isCommissariat ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">{agentsMemeCommissariat.length || 1} agent(s) rattache(s)</span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">Compte agent</span>
                    )}
                    <span className={`rounded-full px-3 py-1 ${socketConnected ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'}`}>
                      {socketConnected ? 'Temps reel actif' : 'Connexion live en attente'}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const soundReady = await unlockNotificationSound?.()
                        const permission = await requestNotificationPermission?.()
                        const ready = Boolean(soundReady) || permission === 'granted'
                        setAlertsReady(ready)
                        localStorage.setItem('signal_moi_police_alerts_enabled', 'true')
                        toast.success(permission === 'granted' ? 'Alertes police actives' : 'Son active. Autorisez les notifications du navigateur.')
                      }}
                      className={`rounded-full px-3 py-1 transition ${alertsReady ? 'bg-emerald-300 text-emerald-950 hover:bg-emerald-200' : 'bg-white text-slate-950 hover:bg-slate-100'}`}
                    >
                      {alertsReady ? 'Alertes toujours actives' : 'Activer les alertes'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-xs font-medium text-slate-300">A traiter</p>
                  <p className="mt-1 text-3xl font-black text-white">{stats.nouveaux + stats.enCours}</p>
                </div>
                <div className="rounded-2xl border border-red-300/20 bg-red-500/15 p-4">
                  <p className="text-xs font-medium text-red-100">Prioritaires</p>
                  <p className="mt-1 text-3xl font-black text-red-100">{signalements.filter(s => ['urgente', 'haute'].includes((s.priorite || '').toLowerCase())).length}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (liveRecordingsList.length > 0) setSelectedLive(liveRecordingsList[0])
                    else toast.info('Aucun live citoyen en cours')
                  }}
                  className="rounded-2xl border border-indigo-300/20 bg-indigo-500/15 p-4 text-left transition hover:bg-indigo-500/25"
                >
                  <p className="text-xs font-medium text-indigo-100">Lives</p>
                  <p className="mt-1 text-3xl font-black text-indigo-100">{liveRecordingsList.length}</p>
                  <p className="mt-1 text-xs font-semibold text-indigo-200">{socketConnected ? 'Voir le live' : 'Socket hors ligne'}</p>
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 grid gap-4 lg:grid-cols-3"
          >
            {(isCommissariat ? [
              {
                title: 'File commissariat',
                value: stats.nouveaux + stats.enCours,
                detail: 'Dossiers a qualifier ou suivre',
                icon: QueueList,
                tone: 'border-blue-100 bg-blue-50 text-blue-700'
              },
              {
                title: 'Alertes critiques',
                value: signalements.filter(s => ['urgente', 'haute'].includes((s.priorite || '').toLowerCase())).length,
                detail: 'Priorite haute ou urgente',
                icon: BellAlert,
                tone: 'border-red-100 bg-red-50 text-red-700'
              },
              {
                title: 'Archives commissariat',
                value: filter === 'archives' ? signalements.length : stats.traites,
                detail: 'Traites ou fausses alertes',
                icon: ArchiveBox,
                tone: 'border-emerald-100 bg-emerald-50 text-emerald-700'
              }
            ] : agentInterfaceCards).map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className={`rounded-[1.5rem] border p-5 shadow-sm ${item.tone}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide">{item.title}</p>
                      <p className="mt-2 text-4xl font-black">{item.value}</p>
                      <p className="mt-1 text-sm font-semibold opacity-80">{item.detail}</p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Icon className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>

          {isCommissariat ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-900 text-white">
                    <BuildingOffice2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">Coordination operationnelle</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{commissariatName}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Agents, dossiers et interventions.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Agents rattaches</p>
                    <h2 className="text-lg font-black text-slate-950">{agentsMemeCommissariat.length || 1} agent(s)</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  {agentsMemeCommissariat.slice(0, 4).map((agent) => (
                    <div key={agent.id || agent.email} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{agent.prenom} {agent.nom}</p>
                        <p className="truncate text-xs text-slate-500">{agent.email || agent.telephone || 'Agent commissariat'}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-black text-blue-700">
                        {agent.id === user?.id ? 'Vous' : 'Agent'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"
            >
              <div className="overflow-hidden rounded-[1.5rem] border border-sky-100 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-sky-700 to-blue-950 p-5 text-white">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                      <Identification className="h-8 w-8" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">Carte agent</p>
                      <h2 className="mt-1 truncate text-2xl font-black">{user?.prenom} {user?.nom}</h2>
                      <p className="mt-1 text-sm font-semibold text-sky-100">{commissariatName}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <p className="text-xs font-black uppercase text-sky-700">Statut</p>
                      <p className="mt-1 text-lg font-black text-slate-950">Disponible</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-black uppercase text-slate-500">Rôle</p>
                      <p className="mt-1 text-lg font-black text-slate-950">Agent terrain</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-slate-600">
                    Interventions et suivi terrain.
                  </p>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Mission terrain</p>
                    <h2 className="text-xl font-black text-slate-950">Tableau d’intervention</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                    <MapPin className="h-6 w-6" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {agentQuickActions.map((action) => {
                    const ActionIcon = action.icon
                    const value = action.value === 'nouveau' ? stats.nouveaux : action.value === 'en_cours' ? stats.enCours : stats.traites
                    return (
                      <button
                        key={action.value}
                        type="button"
                        onClick={() => setFilter(action.value)}
                        className={`group relative overflow-hidden rounded-2xl p-5 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${action.tone}`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="rounded-xl bg-white/15 p-2 transition group-hover:scale-110 group-hover:rotate-3"><ActionIcon className="h-6 w-6" /></span>
                          <span className="rounded-xl bg-black/10 px-3 py-1 text-2xl font-black">{value}</span>
                        </div>
                        <p className="text-sm font-black">{action.label}</p>
                        <p className="mt-1 text-xs font-semibold opacity-75">Ouvrir la liste →</p>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Priorité actuelle</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                    Traitez d’abord les urgences.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {isCommissariatRole(user?.role) && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Gestion du commissariat</p>
                  <h2 className="text-2xl font-black text-slate-950">Créer un agent rattaché</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    L'agent sera automatiquement affecté à {commissariatName}.
                  </p>
                </div>
              </div>
              <form onSubmit={createAgent} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <input
                  name="prenom"
                  value={agentForm.prenom}
                  onChange={handleAgentFormChange}
                  placeholder="Prénom"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <input
                  name="nom"
                  value={agentForm.nom}
                  onChange={handleAgentFormChange}
                  placeholder="Nom"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <input
                  type="email"
                  name="email"
                  value={agentForm.email}
                  onChange={handleAgentFormChange}
                  placeholder="Email"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <input
                  name="telephone"
                  value={agentForm.telephone}
                  onChange={handleAgentFormChange}
                  placeholder="Téléphone"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <input
                  type="password"
                  name="password"
                  value={agentForm.password}
                  onChange={handleAgentFormChange}
                  placeholder="Mot de passe"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <button
                  type="submit"
                  disabled={creatingAgent}
                  className="rounded-xl bg-blue-900 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingAgent ? 'Création...' : 'Créer agent'}
                </button>
              </form>
            </motion.div>
          )}

          {liveRecordingsList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 overflow-hidden rounded-[1.75rem] border border-red-200 bg-white shadow-xl"
            >
              <div className="flex flex-col gap-3 border-b border-red-100 bg-red-50 p-5 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/20">
                  <VideoCamera className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900">Enregistrements video en direct</h2>
                  <p className="text-sm text-red-700">
                    {socketConnected ? 'Un citoyen filme actuellement une preuve avec localisation active.' : 'Connexion temps reel en cours...'}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-2">
                {liveRecordingsList.map((live) => (
                  <div key={live.sessionId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ring-1 ring-red-100">
                    <div className="bg-slate-950">
                      {live.frame ? (
                        <img src={live.frame} alt="Apercu video en direct" className="h-56 w-full object-cover" />
                      ) : (
                        <div className="flex h-56 items-center justify-center text-sm text-slate-300">
                          En attente de l apercu video...
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="danger">EN DIRECT</Badge>
                        {live.type && <Badge variant="gray">{live.type}</Badge>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{live.titre || 'Signalement urgent'}</p>
                        {live.citizenName && <p className="text-sm text-gray-600">Signalant: {live.citizenName}</p>}
                      </div>
                      <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
                        <p className="font-semibold">Localisation</p>
                        <p>{live.localisation || 'Localisation en cours de recuperation...'}</p>
                        {live.latitude && live.longitude && (
                          <p className="mt-1 text-xs text-indigo-700">
                            GPS: {parseFloat(live.latitude).toFixed(5)}, {parseFloat(live.longitude).toFixed(5)}
                          </p>
                        )}
                        <p className="mt-2 text-xs font-semibold text-indigo-700">
                          Video recue: {live.videoChunkCount || 0} fragment(s)
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Button size="sm" variant="danger" icon={VideoCamera} onClick={() => setSelectedLive(live)}>Voir le live</Button>
                        <Button size="sm" variant="secondary" icon={PaperClip} onClick={() => downloadLiveVideo(live)} disabled={!live.frame && !live.videoChunkCount}>Enregistrer</Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={MapPin}
                          onClick={() => {
                            if (live.latitude && live.longitude) {
                              window.open(`https://www.google.com/maps/?q=${live.latitude},${live.longitude}`, '_blank')
                            } else if (live.localisation) {
                              window.open(`https://www.google.com/maps/search/${encodeURIComponent(live.localisation)}`, '_blank')
                            }
                          }}
                          disabled={!live.latitude && !live.longitude && !live.localisation}
                        >
                          Localiser
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {!liveRecordingsList.length && lastLive?.frame && (
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Derniere image live recue</p>
                  <p className="text-xs text-slate-500">
                    {lastLive.frameAt ? new Date(lastLive.frameAt).toLocaleTimeString('fr-FR') : 'Heure inconnue'} - le direct peut etre termine.
                  </p>
                </div>
                <Button size="sm" variant="secondary" icon={VideoCamera} onClick={() => setSelectedLive(lastLive)}>
                  Voir la derniere image
                </Button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
          >
            <StatBox
              title="Total signalements"
              value={stats.total}
              color="blue"
            />
            <StatBox
              title="Nouveaux"
              value={stats.nouveaux}
              color="red"
            />
            <StatBox
              title="En cours"
              value={stats.enCours}
              color="yellow"
            />
            <StatBox
              title="Traites"
              value={stats.traites}
              color="green"
            />
          </motion.div>

          {/* Filtres */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            {[
              { value: 'all', label: 'Tous' },
              { value: 'nouveau', label: 'Nouveaux' },
              { value: 'en_cours', label: 'En cours' },
              { value: 'archives', label: 'Archives' }
            ].map(f => (
              <Button
                key={f.value}
                variant={filter === f.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </motion.div>

          {/* Signalements List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {getSortedFilteredSignalements().length === 0 ? (
              <Card className="p-12 text-center">
                <DocumentText className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                <p className="text-gray-500">Aucun signalement pour ce filtre</p>
              </Card>
            ) : (
              getSortedFilteredSignalements().map((s, idx, list) => {
                const groupKey = getSignalGroupKey(s)
                const previousGroupKey = idx > 0 ? getSignalGroupKey(list[idx - 1]) : null
                const showGroupHeader = groupKey !== previousGroupKey
                const verificationTone = getVerificationTone(s.verification)

                return (
                  <div key={s.id} className="space-y-3">
                    {showGroupHeader && (
                      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-sm">
                        <span className="text-sm font-black uppercase">{s.type || 'autre'}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{getHourGroup(s)}</span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="relative overflow-hidden border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6">
                    <div className={`absolute inset-y-0 left-0 w-1.5 ${['urgente', 'haute'].includes((s.priorite || '').toLowerCase()) ? 'bg-red-600' : s.statut === 'en_cours' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={getStatusVariant(s.statut)}>
                            {s.statut || 'Nouveau'}
                          </Badge>
                          <Badge variant={getPriorityColor(s.priorite)}>
                            {s.priorite || 'Normal'}
                          </Badge>
                          {s.type && <Badge variant="gray">{s.type}</Badge>}
                          {s.verification && (
                            <span className={`rounded-full border px-3 py-1 text-xs font-black ${verificationTone.className}`}>
                              {verificationTone.label} {s.verification.score}%
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900">{s.titre}</h3>
                        <p className="text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                        {s.verification?.raisons?.length > 0 && s.verification.niveau !== 'fiable' && (
                          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                            Verification: {s.verification.raisons.slice(0, 2).join(' • ')}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> {s.localisation}
                          </span>
                          {s.fichiers?.length > 0 && (
                            <span><PaperClip className="h-4 w-4" /> {s.fichiers.length} piece(s)</span>
                          )}
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 lg:w-36 lg:grid-cols-1">
                        <Button
                          size="sm"
                          icon={DocumentText}
                          onClick={() => {
                            console.log('Ouverture details signal:', s);
                            setSelectedSignal(s);
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleIntervention(s)}
                          disabled={!!interventionLoading[s.id]}
                        >
                          {interventionLoading[s.id] ? 'En cours...' : 'Intervenir'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={MapPin}
                          onClick={() => {
                            if (s.latitude && s.longitude) {
                              window.open(`https://www.google.com/maps/?q=${s.latitude},${s.longitude}`, '_blank')
                            } else {
                              window.open(`https://www.google.com/maps/search/${encodeURIComponent(s.localisation)}`, '_blank')
                            }
                          }}
                        >
                          Localiser
                        </Button>
                      </div>
                    </div>
                      </Card>
                    </motion.div>
                  </div>
                )
              })
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal Details */}
      <Modal
        isOpen={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
        title="Details du signalement"
        size="lg"
      >
        {selectedSignal && (
          <div className="space-y-6">
            
            {/* INFO CITOYEN - Section distincte en haut */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Informations du signalant</p>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">
                  {`${selectedSignal.user?.prenom || 'Inconnu'} ${selectedSignal.user?.nom || ''}`}
                  {selectedSignal.estAnonyme && <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">anonyme public</span>}
                </p>
                {selectedSignal.user?.telephone && (
                  <p className="flex items-center gap-2 text-sm text-gray-700"><Phone className="h-4 w-4" /> {selectedSignal.user.telephone}</p>
                )}
                {selectedSignal.user?.email && (
                  <p className="flex items-center gap-2 text-sm text-gray-700"><Envelope className="h-4 w-4" /> {selectedSignal.user.email}</p>
                )}
                {selectedSignal.user?.localisation && (
                  <p className="flex items-center gap-2 text-sm text-gray-700"><MapPin className="h-4 w-4" /> {selectedSignal.user.localisation}</p>
                )}
              </div>
            </div>

            {/* Details du signalement */}
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">{selectedSignal.titre}</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-base">{selectedSignal.description}</p>
            </div>

            {/* Statut, Priorite, Type */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusVariant(selectedSignal.statut)}>
                Status: {selectedSignal.statut}
              </Badge>
              <Badge variant={getPriorityColor(selectedSignal.priorite)}>
                Priorite: {selectedSignal.priorite || 'Normal'}
              </Badge>
              {selectedSignal.type && <Badge variant="gray">Type: {selectedSignal.type}</Badge>}
            </div>

            {selectedSignal.verification && (
              <div className={`rounded-xl border p-4 ${getVerificationTone(selectedSignal.verification).className}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black">Indice anti-fausse alerte: {getVerificationTone(selectedSignal.verification).label}</p>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-black">{selectedSignal.verification.score}%</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm font-semibold">
                  {selectedSignal.verification.raisons.map((reason) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Localisation - avec bouton Localiser */}
            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">{selectedSignal.localisation}</p>
                    {selectedSignal.latitude && (
                      <p className="text-xs text-gray-600 mt-1">
                        GPS: {parseFloat(selectedSignal.latitude).toFixed(4)}, {parseFloat(selectedSignal.longitude).toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={MapPin}
                  onClick={() => {
                    if (selectedSignal.latitude && selectedSignal.longitude) {
                      window.open(`https://www.google.com/maps/?q=${selectedSignal.latitude},${selectedSignal.longitude}`, '_blank')
                    } else {
                      window.open(`https://www.google.com/maps/search/${encodeURIComponent(selectedSignal.localisation)}`, '_blank')
                    }
                  }}
                >
                  Localiser
                </Button>
              </div>
            </div>

            {/* Fichiers et Preuves - Section secondaire en bas */}
            {selectedSignal.fichiers?.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3 text-gray-700">Preuves jointes ({selectedSignal.fichiers.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedSignal.fichiers.map((f, i) => {
                    const isImage = f.mime_type?.startsWith('image/') || f.type?.startsWith('image/')
                    const isVideo = f.mime_type?.startsWith('video/') || f.type?.startsWith('video/')
                    const isAudio = f.mime_type?.startsWith('audio/') || f.type?.startsWith('audio/')
                    // Normaliser le chemin: enlever les slashes en debut et fin, et les chemins absolus
                    const rawPath = f.url || f.chemin || `/api/signalements/fichiers/${f.id}`
                    let fileUrl = rawPath
                    if (rawPath.startsWith('/api/')) fileUrl = `${API_BASE}${rawPath}`
                    else if (rawPath.startsWith('api/')) fileUrl = `${API_BASE}/${rawPath}`
                    else if (rawPath.startsWith('/uploads/')) fileUrl = `${API_BASE}${rawPath}`
                    else if (rawPath.startsWith('uploads/')) fileUrl = `${API_BASE}/${rawPath}`
                    return (
                      <a
                        key={i}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                        title={f.nom_fichier || f.nomFichier}
                      >
                        {isImage ? (
                          <div className="relative bg-gray-100 h-32">
                            <img
                              src={fileUrl}
                              alt={f.nom_fichier || f.nomFichier}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#64748b;background:#f3f4f6;">PREUVE</div>'
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                              <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition">Ouvrir</span>
                            </div>
                          </div>
                        ) : isVideo ? (
                          <div className="relative bg-black h-32">
                            <video src={fileUrl} controls className="h-full w-full object-cover" />
                          </div>
                        ) : isAudio ? (
                          <div className="bg-cyan-50 h-32 flex flex-col items-center justify-center gap-3 p-3">
                            <PaperClip className="h-7 w-7 text-cyan-700" />
                            <audio src={fileUrl} controls className="w-full" />
                          </div>
                        ) : (
                          <div className="bg-gray-100 h-32 flex items-center justify-center group-hover:bg-gray-200 transition">
                            <PaperClip className="h-8 w-8 text-slate-400" />
                          </div>
                        )}
                        <div className="p-2 bg-gray-50 text-center border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 truncate">{f.nom_fichier || f.nomFichier}</p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contacter la victime - Section Actions */}
            {selectedSignal.user?.telephone && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3 text-gray-700">Contacter la victime</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => window.open(`tel:${selectedSignal.user.telephone}`)}
                  >
                    Appeler
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      const phone = selectedSignal.user.telephone.replace(/\D/g, '')
                      window.open(`https://wa.me/${phone}`)
                    }}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {/* Mettre a jour le statut */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-900 mb-3">Mettre a jour le statut</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => handleIntervention(selectedSignal)}
                  disabled={!!interventionLoading[selectedSignal.id]}
                >
                  {interventionLoading[selectedSignal.id] ? 'En cours...' : 'En cours'}
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => updateStatus(selectedSignal.id, 'traite')}
                >
                  Traite
                </Button>
                {isCommissariat && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setTransferingSignalId(selectedSignal.id)
                      setShowTransferModal(true)
                    }}
                  >
                    Transferer
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => updateStatus(selectedSignal.id, 'fausse_alerte')}
                >
                  Fausse alerte
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedLive}
        onClose={() => setSelectedLive(null)}
        title="Live citoyen en temps reel"
        size="2xl"
      >
        {activeLive && (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-xl bg-slate-950">
              {livePlaybackUrls[activeLive.sessionId] ? (
                <video
                  key={livePlaybackUrls[activeLive.sessionId]}
                  src={livePlaybackUrls[activeLive.sessionId]}
                  autoPlay
                  controls
                  playsInline
                  className="h-[28rem] w-full bg-black object-contain"
                />
              ) : activeLive.frame ? (
                <img
                  key={activeLive.frameAt || activeLive.frame}
                  src={activeLive.frame}
                  alt="Video en direct du citoyen"
                  className="h-[28rem] w-full object-contain bg-black"
                />
              ) : (
                <div className="flex h-[28rem] items-center justify-center text-slate-300">
                  En attente du flux video...
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant={activeLive.status === 'recording' ? 'danger' : 'gray'}>
                    {activeLive.status === 'recording' ? 'EN DIRECT' : 'TERMINE'}
                  </Badge>
                  {activeLive.type && <Badge variant="gray">{activeLive.type}</Badge>}
                </div>
                <h3 className="text-lg font-bold text-slate-950">{activeLive.titre || 'Signalement urgent'}</h3>
                {activeLive.description && <p className="mt-2 text-sm text-slate-600">{activeLive.description}</p>}
                {activeLive.citizenName && <p className="mt-3 text-sm font-medium text-slate-700">Signalant: {activeLive.citizenName}</p>}
                {activeLive.frameAt && (
                  <p className="mt-2 text-xs text-slate-500">
                    Derniere image recue: {new Date(activeLive.frameAt).toLocaleTimeString('fr-FR')}
                  </p>
                )}
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  Video recue: {activeLive.videoChunkCount || 0} fragment(s)
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Audio live: {livePlaybackUrls[activeLive.sessionId] ? 'disponible dans le lecteur' : 'en attente de fragments video/audio'}
                </p>
              </div>

              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950">
                <p className="font-bold">Localisation</p>
                <p className="mt-2">{activeLive.localisation || 'Localisation en cours...'}</p>
                {activeLive.latitude && activeLive.longitude && (
                  <p className="mt-2 text-xs">
                    GPS: {parseFloat(activeLive.latitude).toFixed(5)}, {parseFloat(activeLive.longitude).toFixed(5)}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  icon={MapPin}
                  className="mt-4"
                  disabled={!activeLive.latitude && !activeLive.longitude && !activeLive.localisation}
                  onClick={() => {
                    if (activeLive.latitude && activeLive.longitude) {
                      window.open(`https://www.google.com/maps/?q=${activeLive.latitude},${activeLive.longitude}`, '_blank')
                    } else if (activeLive.localisation) {
                      window.open(`https://www.google.com/maps/search/${encodeURIComponent(activeLive.localisation)}`, '_blank')
                    }
                  }}
                >
                  Ouvrir la carte
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={PaperClip}
                  className="mt-3"
                  disabled={!activeLive.frame && !activeLive.videoChunkCount}
                  onClick={() => downloadLiveVideo(activeLive)}
                >
                  Enregistrer la video complete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Transfert */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false)
          setSelectedPoliceToTransfer(null)
        }}
        title="Transferer le dossier"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Selectionnez l'agent du commissariat qui doit recevoir ce dossier :
          </p>
          
          {policiers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Aucun autre officier disponible
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {policiers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPoliceToTransfer(p.id)}
                  className={`w-full p-3 text-left border-2 rounded-lg transition ${
                    selectedPoliceToTransfer === p.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {p.prenom} {p.nom}
                  </div>
                  <div className="text-sm text-gray-500">{p.email}</div>
                  <div className="mt-1 text-xs font-semibold text-blue-700">{p.quartier || 'Commissariat central de Sedhiou'}</div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setShowTransferModal(false)
                setSelectedPoliceToTransfer(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              disabled={!selectedPoliceToTransfer}
              onClick={() => {
                if (selectedPoliceToTransfer && transferingSignalId) {
                  transferer(transferingSignalId, selectedPoliceToTransfer)
                }
              }}
            >
              Transferer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
