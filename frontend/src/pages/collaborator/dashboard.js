import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import { API_BASE } from '../../config/api'
import { toast } from 'react-toastify'
import { io as socketIOClient } from 'socket.io-client'

export default function CollaboratorDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  
  // Déclarer tous les states avant les retours conditionnels
  const [signalements, setSignalements] = useState([])
  const [loadingSignals, setLoadingSignals] = useState(true)
  const [followed, setFollowed] = useState([])
  const [followedList, setFollowedList] = useState([])
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Espace Collaborateur</h1>
          <p className="text-gray-600 mt-2">Bienvenue {user?.prenom}! Dashboard collaborateur.</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-6 gap-4">
            <button onClick={() => exportCases('pdf')} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">📄 Export PDF</button>
            <button onClick={() => exportCases('excel')} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">📊 Export Excel</button>
            <button onClick={() => router.push('/collaborator/campagne/new')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">🎯 Créer campagne</button>
            <button onClick={() => router.push('/collaborator/campagne/mes-campagnes')} className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900">📋 Mes campagnes</button>
            <button onClick={() => router.push('/collaborator/plaidoyer/new')} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700">✍️ Créer plaidoyer</button>
            <button onClick={() => router.push('/collaborator/plaidoyer/mes-plaidoyers')} className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700">📝 Mes plaidoyers</button>
            <button onClick={() => toast.info('Statistiques non implémentées dans cette vue')} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">📈 Statistiques</button>
          </div>

            <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Signalements assignés</h2>
            {loadingSignals ? (
              <div className="pt-8">Chargement des signalements...</div>
            ) : signalements.length === 0 ? (
              <div className="pt-8 text-gray-600">Aucun signalement assigné.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {signalements.map(s => (
                  <div key={s.id} className="bg-white rounded-lg shadow p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{s.titre}</h3>
                      <span className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 flex-1 mt-2 line-clamp-3">{s.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => contact(s.author?.email)} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded">Contacter la victime</button>
                        <a href={`/citizen/signalement/${s.id}`} className="text-sm text-indigo-600 hover:underline">Détails</a>
                      </div>
                      <div>
                        <button onClick={() => toggleFollow(s.id)} className={`px-3 py-1 rounded text-sm ${followed.includes(s.id) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                          {followed.includes(s.id) ? 'Suivi' : 'Suivre dossier'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

            <div className="mt-10">
              <h2 className="text-2xl font-semibold mb-4">Dossiers suivis</h2>
              {followedList.length === 0 ? (
                <div className="text-gray-600">Vous ne suivez aucun dossier.</div>
              ) : (
                <div className="space-y-3">
                  {followedList.map(f => (
                    <div key={f.id} className="bg-white rounded p-3 shadow flex items-center justify-between">
                      <div>
                        <div className="font-medium">{f.titre}</div>
                        <div className="text-sm text-gray-500">{f.statut || 'N/A'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={`/citizen/signalement/${f.id}`} className="text-indigo-600 hover:underline">Voir</a>
                        <button onClick={() => toggleFollow(f.id)} className="text-sm px-3 py-1 bg-red-50 rounded text-red-600">Ne plus suivre</button>
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

