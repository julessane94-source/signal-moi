import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import { useSocket } from '../../context/SocketContext'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'

export default function PoliceDashboard() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [signalements, setSignalements] = useState([])
  const [selectedSignal, setSelectedSignal] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSignalements()
    
    // Recevoir notifications en temps reel
    if (socket) {
      socket.on('new_signalement_notification', (data) => {
        toast.warning(`🚨 Nouveau signalement: ${data.title}`)
        fetchSignalements()
      })
      
      socket.on('signalement_received', () => {
        fetchSignalements()
      })
    }
    
    return () => {
      if (socket) {
        socket.off('new_signalement_notification')
        socket.off('signalement_received')
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
    } finally {
      setLoading(false)
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
      toast.success(`Status mis a jour: ${statut}`)
      fetchSignalements()
      setSelectedSignal(null)
    } catch (error) {
      toast.error('Erreur lors de la mise a jour')
    }
  }

  const transferer = async (id, uniteId) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_BASE}/api/signalements/${id}/transfert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uniteId })
      })
      toast.success('Dossier transfere avec succes')
      fetchSignalements()
    } catch (error) {
      toast.error('Erreur lors du transfert')
    }
  }

  const getFilteredSignalements = () => {
    if (filter === 'all') return signalements
    return signalements.filter(s => s.statut === filter)
  }

  const priorityOrder = { 'urgente': 4, 'haute': 3, 'moyenne': 2, 'basse': 1 }

  const getPriorityColor = (prio) => {
    switch((prio || '').toLowerCase()) {
      case 'urgente': return 'bg-red-600 text-white'
      case 'haute': return 'bg-orange-500 text-white'
      case 'moyenne': return 'bg-yellow-400 text-black'
      case 'basse': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Retourne la liste triée par priorité (les plus urgents en premier)
  const getSortedFilteredSignalements = () => {
    return getFilteredSignalements().slice().sort((a, b) => {
      const pa = priorityOrder[(a.priorite || '').toLowerCase()] || 0
      const pb = priorityOrder[(b.priorite || '').toLowerCase()] || 0
      // plus haut = priorité plus élevée
      return pb - pa || new Date(b.createdAt) - new Date(a.createdAt)
    })
  }

  const getHighestPrioritySignalement = () => {
    const sorted = getSortedFilteredSignalements()
    return sorted.length > 0 ? sorted[0] : null
  }

  const getStatusColor = (statut) => {
    switch(statut) {
      case 'nouveau': return 'bg-red-100 text-red-700 border-red-200'
      case 'en_cours': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'traite': return 'bg-green-100 text-green-700 border-green-200'
      case 'transfere': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const stats = {
    nouveaux: signalements.filter(s => s.statut === 'nouveau').length,
    enCours: signalements.filter(s => s.statut === 'en_cours').length,
    traites: signalements.filter(s => s.statut === 'traite').length
  }

  if (loading) {
    return <div className="min-h-screen pt-16 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Sticky quick-action bar pour la police */}
        {getHighestPrioritySignalement() && (
          <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-800">Signalement prioritaire:</span>
                <span className="ml-3 text-sm text-gray-600">{getHighestPrioritySignalement().titre} — <span className="font-medium">{getHighestPrioritySignalement().priorite || '—'}</span></span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={async () => {
                  const top = getHighestPrioritySignalement()
                  if (!top) return
                  await updateStatus(top.id, 'en_cours')
                }} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Prendre en charge</button>
                <button onClick={() => {
                  const top = getHighestPrioritySignalement()
                  if (!top) return
                  if (top.latitude && top.longitude) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${top.latitude},${top.longitude}`, '_blank')
                  } else {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(top.localisation)}`, '_blank')
                  }
                }} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200">Itinéraire</button>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Espace Police / Gendarmerie</h1>
          <p className="text-gray-600 mb-8">Bienvenue {user?.prenom} {user?.nom}</p>

          {/* Statistiques */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{signalements.length}</div>
              <div className="text-gray-600">Total signalements</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.nouveaux}</div>
              <div className="text-gray-600">Nouveaux</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.enCours}</div>
              <div className="text-gray-600">En cours</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.traites}</div>
              <div className="text-gray-600">Traites</div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>Tous</button>
            <button onClick={() => setFilter('nouveau')} className={`px-4 py-2 rounded-lg ${filter === 'nouveau' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Nouveaux</button>
            <button onClick={() => setFilter('en_cours')} className={`px-4 py-2 rounded-lg ${filter === 'en_cours' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}>En cours</button>
            <button onClick={() => setFilter('traite')} className={`px-4 py-2 rounded-lg ${filter === 'traite' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Traites</button>
          </div>

          {/* Liste des signalements */}
          <div className="space-y-4">
            {getSortedFilteredSignalements().map(s => (
              <div key={s.id} className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-l-4 ${getStatusColor(s.statut)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(s.statut)}`}>
                        {s.statut || 'Nouveau'}
                      </span>
                      {/* Badge priorité */}
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(s.priorite)}`}> {s.priorite || '—'} </span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{s.type}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{s.titre}</h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>📍 {s.localisation}</span>
                      <span>📎 {s.fichiers?.length || 0} piece(s)</span>
                      <span>📅 {new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <button onClick={() => { setSelectedSignal(s) }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                      Traiter
                    </button>
                    <button onClick={async () => {
                      // action principale: se déclarer en intervention
                      await updateStatus(s.id, 'en_cours')
                    }} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                      Intervenir
                    </button>
                    <button onClick={() => {
                      // Ouvrir localisation: si lat/lng -> Google Maps, sinon recherche par adresse
                      if (s.latitude && s.longitude) {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${s.latitude},${s.longitude}`, '_blank')
                      } else {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.localisation)}`, '_blank')
                      }
                    }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                      Localiser
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de traitement */}
          {selectedSignal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Details du signalement</h2>
                    <button onClick={() => setSelectedSignal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                  </div>
                  
                  <div className="space-y-4">
                    <div><strong>Titre:</strong> {selectedSignal.titre}</div>
                    <div><strong>Description:</strong> <p className="whitespace-pre-wrap mt-1">{selectedSignal.description}</p></div>
                    <div><strong>Lieu:</strong> {selectedSignal.localisation}</div>
                    {selectedSignal.latitude && <div><strong>GPS:</strong> {selectedSignal.latitude}, {selectedSignal.longitude}</div>}
                    <div><strong>Signale par:</strong> {selectedSignal.estAnonyme ? 'Anonyme' : selectedSignal.user?.prenom}</div>
                    
                    {/* Fichiers joints */}
                    {selectedSignal.fichiers?.length > 0 && (
                      <div><strong>Preuves jointes:</strong>
                        <div className="flex gap-2 mt-2">
                          {selectedSignal.fichiers.map(f => (
                            <a key={f.id} href="#" className="text-indigo-600 underline text-sm">📎 {f.nomFichier}</a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Changer statut */}
                    <div className="pt-4 border-t">
                      <strong>Mettre a jour le statut:</strong>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateStatus(selectedSignal.id, 'en_cours')} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">En cours</button>
                        <button onClick={() => updateStatus(selectedSignal.id, 'traite')} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Traite</button>
                        <button onClick={() => updateStatus(selectedSignal.id, 'transfere')} className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600">Transférer</button>
                      </div>
                    </div>

                    {/* Contacter */}
                    {!selectedSignal.estAnonyme && selectedSignal.user && (
                      <div className="border-t pt-4">
                        <strong>Contacter la victime:</strong>
                        <div className="flex gap-2 mt-2">
                          <a href={`tel:${selectedSignal.user.telephone}`} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 inline-block">📞 Appeler</a>
                          <a href={`https://wa.me/${selectedSignal.user.telephone}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 inline-block">💬 WhatsApp</a>
                        </div>
                      </div>
                    )}

                    <button onClick={() => setSelectedSignal(null)} className="w-full bg-gray-500 text-white py-2 rounded-lg mt-4">Fermer</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}