import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { Button, Card, Badge, Modal, StatBox } from '../../components/ui'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { API_BASE } from '../../config/api'
import {
  MapPinIcon as MapPin,
  DocumentTextIcon as DocumentText,
  ExclamationTriangleIcon as ExclamationTriangle,
  VideoCameraIcon as VideoCamera,
  ShieldCheckIcon as ShieldCheck,
  ClockIcon as Clock
} from '@heroicons/react/24/outline'

export default function PoliceDashboard() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [signalements, setSignalements] = useState([])
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [policiers, setPoliciers] = useState([])
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedPoliceToTransfer, setSelectedPoliceToTransfer] = useState(null)
  const [transferingSignalId, setTransferingSignalId] = useState(null)
  const [liveRecordings, setLiveRecordings] = useState({})

  useEffect(() => {
    fetchSignalements()
    fetchPoliciers()
    
    if (socket) {
      socket.on('new_signalement_notification', (data) => {
        toast.warning(`?? Nouveau signalement: ${data.title}`)
        fetchSignalements()
      })
      
      socket.on('signalement_received', () => {
        fetchSignalements()
      })

      socket.on('live_recording_started', (data) => {
        toast.warning(`Video en direct: ${data.titre || data.type}`)
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            status: 'recording'
          }
        }))
      })

      socket.on('live_recording_location', (data) => {
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            status: prev[data.sessionId]?.status || 'recording'
          }
        }))
      })

      socket.on('live_recording_frame', (data) => {
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            frame: data.frame,
            frameAt: data.frameAt,
            status: prev[data.sessionId]?.status || 'recording'
          }
        }))
      })

      socket.on('live_recording_stopped', (data) => {
        setLiveRecordings(prev => ({
          ...prev,
          [data.sessionId]: {
            ...prev[data.sessionId],
            ...data,
            status: 'stopped'
          }
        }))
      })
    }
    
    return () => {
      if (socket) {
        socket.off('new_signalement_notification')
        socket.off('signalement_received')
        socket.off('live_recording_started')
        socket.off('live_recording_location')
        socket.off('live_recording_frame')
        socket.off('live_recording_stopped')
      }
    }
  }, [socket])

  const fetchSignalements = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/signalements`, {
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
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      const policiersList = Array.isArray(data) 
        ? data.filter(u => u.role === 'police' && u.id !== user?.id) 
        : []
      setPoliciers(policiersList)
    } catch (error) {
      console.error('Erreur chargement policiers:', error)
    }
  }

  const updateStatus = async (id, statut) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_BASE}/api/signalements/${id}/statut`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut })
      })
      toast.success(`? Statut mis � jour: ${statut}`)
      fetchSignalements()
      setSelectedSignal(null)
    } catch (error) {
      toast.error('? Erreur lors de la mise � jour')
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
      if (!res.ok) throw new Error('Erreur transfert')
      
      // Aussi mettre � jour le statut � 'transfere'
      await fetch(`${API_BASE}/api/signalements/${signalId}/statut`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: 'transfere' })
      })
      
      toast.success('? Dossier transf�r� avec succ�s')
      setShowTransferModal(false)
      setSelectedPoliceToTransfer(null)
      setTransferingSignalId(null)
      setSelectedSignal(null)
      fetchSignalements()
    } catch (error) {
      console.error('Erreur transfert:', error)
      toast.error('? Erreur lors du transfert')
    }
  }

  const getFilteredSignalements = () => {
    if (filter === 'all') return signalements
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
      return pb - pa || new Date(b.createdAt) - new Date(a.createdAt)
    })
  }

  const getHighestPrioritySignalement = () => {
    const sorted = getSortedFilteredSignalements()
    return sorted.length > 0 ? sorted[0] : null
  }

  const getStatusVariant = (statut) => {
    switch(statut) {
      case 'nouveau': return 'warning'
      case 'en_cours': return 'info'
      case 'traite': return 'success'
      case 'transfere': return 'primary'
      default: return 'gray'
    }
  }

  const stats = {
    total: signalements.length,
    nouveaux: signalements.filter(s => s.statut === 'nouveau').length,
    enCours: signalements.filter(s => s.statut === 'en_cours').length,
    traites: signalements.filter(s => s.statut === 'traite').length
  }

  const topSignal = getHighestPrioritySignalement()
  const liveRecordingsList = Object.values(liveRecordings)
    .filter(item => item && item.status === 'recording')
    .sort((a, b) => new Date(b.startedAt || b.updatedAt || 0) - new Date(a.startedAt || a.updatedAt || 0))

  if (loading) {
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
      <div className="min-h-screen bg-slate-100 pt-20 pb-12">
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
                  <p className="text-red-100 text-sm">Priorit�: {topSignal.priorite || 'Normal'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateStatus(topSignal.id, 'en_cours')}
                  className="text-red-600 hover:bg-red-50"
                >
                  Intervenir
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
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-900">
              Centre de Coordination Police
            </h1>
            <p className="text-gray-600 mt-2">
              Bienvenue {user?.prenom} {user?.nom} - Gestion des signalements en temps r�el
            </p>
          </motion.div>

          {liveRecordingsList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-lg"
            >
              <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white">
                  <VideoCamera className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-900">Enregistrements vid�o en direct</h2>
                  <p className="text-sm text-red-700">Un citoyen filme actuellement une preuve avec localisation active.</p>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-2">
                {liveRecordingsList.map((live) => (
                  <div key={live.sessionId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-red-100">
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
                        <p>{live.localisation || 'Localisation en cours de r�cup�ration...'}</p>
                        {live.latitude && live.longitude && (
                          <p className="mt-1 text-xs text-indigo-700">
                            GPS: {parseFloat(live.latitude).toFixed(5)}, {parseFloat(live.longitude).toFixed(5)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
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
                        Voir la localisation
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
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
              title="Trait�s"
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
              { value: 'traite', label: 'Trait�s' }
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
                <div className="text-6xl mb-4">??</div>
                <p className="text-gray-500">Aucun signalement pour ce filtre</p>
              </Card>
            ) : (
              getSortedFilteredSignalements().map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-6 border border-slate-200 hover:shadow-lg transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={getStatusVariant(s.statut)}>
                            {s.statut || 'Nouveau'}
                          </Badge>
                          <Badge variant={getPriorityColor(s.priorite)}>
                            {s.priorite || 'Normal'}
                          </Badge>
                          {s.type && <Badge variant="gray">{s.type}</Badge>}
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900">{s.titre}</h3>
                        <p className="text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            ?? {s.localisation}
                          </span>
                          {s.fichiers?.length > 0 && (
                            <span>?? {s.fichiers.length} pi�ce(s)</span>
                          )}
                          <span>?? {new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          icon={DocumentText}
                          onClick={() => {
                            console.log('Ouverture d�tails signal:', s);
                            setSelectedSignal(s);
                          }}
                        >
                          D�tails
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => updateStatus(s.id, 'en_cours')}
                        >
                          Intervenir
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
              ))
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal D�tails */}
      <Modal
        isOpen={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
        title="D�tails du signalement"
        size="lg"
      >
        {selectedSignal && (
          <div className="space-y-6">
            
            {/* INFO CITOYEN - Section distincte en haut */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">?? Informations du signalant</p>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">
                  {selectedSignal.estAnonyme ? '?? Signalement anonyme' : `${selectedSignal.user?.prenom || 'Inconnu'} ${selectedSignal.user?.nom || ''}`}
                </p>
                {!selectedSignal.estAnonyme && selectedSignal.user?.telephone && (
                  <p className="text-sm text-gray-700">?? {selectedSignal.user.telephone}</p>
                )}
                {selectedSignal.user?.email && (
                  <p className="text-sm text-gray-700">?? {selectedSignal.user.email}</p>
                )}
                {selectedSignal.user?.localisation && (
                  <p className="text-sm text-gray-700">?? {selectedSignal.user.localisation}</p>
                )}
              </div>
            </div>

            {/* D�tails du signalement */}
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">{selectedSignal.titre}</h3>
              <p className="text-gray-700 whitespace-pre-wrap text-base">{selectedSignal.description}</p>
            </div>

            {/* Statut, Priorit�, Type */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusVariant(selectedSignal.statut)}>
                Status: {selectedSignal.statut}
              </Badge>
              <Badge variant={getPriorityColor(selectedSignal.priorite)}>
                Priorit�: {selectedSignal.priorite || 'Normal'}
              </Badge>
              {selectedSignal.type && <Badge variant="gray">Type: {selectedSignal.type}</Badge>}
            </div>

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
                <p className="text-sm font-semibold mb-3 text-gray-700">?? Preuves jointes ({selectedSignal.fichiers.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedSignal.fichiers.map((f, i) => {
                    const isImage = f.mime_type?.startsWith('image/') || f.type?.startsWith('image/')
                    // Normaliser le chemin: enlever les slashes en d�but et fin, et les chemins absolus
                    let normalizedPath = f.chemin || `uploads/signalements/${f.id}`
                    if (normalizedPath.startsWith('/')) normalizedPath = normalizedPath.substring(1)
                    const fileUrl = `${API_BASE}/${normalizedPath}`
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
                                e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;background:#f3f4f6;">??</div>'
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                              <span className="text-white text-xl opacity-0 group-hover:opacity-100 transition">??</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 h-32 flex items-center justify-center group-hover:bg-gray-200 transition">
                            <span className="text-2xl">??</span>
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
            {!selectedSignal.estAnonyme && selectedSignal.user?.telephone && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3 text-gray-700">?? Contacter la victime</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => window.open(`tel:${selectedSignal.user.telephone}`)}
                  >
                    ?? Appeler
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => {
                      const phone = selectedSignal.user.telephone.replace(/\D/g, '')
                      window.open(`https://wa.me/${phone}`)
                    }}
                  >
                    ?? WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {/* Mettre � jour le statut */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="font-semibold text-yellow-900 mb-3">Mettre � jour le statut</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => updateStatus(selectedSignal.id, 'en_cours')}
                >
                  En cours
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => updateStatus(selectedSignal.id, 'traite')}
                >
                  Trait�
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setTransferingSignalId(selectedSignal.id)
                    setShowTransferModal(true)
                  }}
                >
                  Transf�rer
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
        title="Transf�rer le dossier"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            S�lectionnez l'officier de police qui doit recevoir ce dossier :
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
                    ?? {p.prenom} {p.nom}
                  </div>
                  <div className="text-sm text-gray-500">{p.email}</div>
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
              Transf�rer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
