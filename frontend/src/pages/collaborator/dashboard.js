import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import { API_BASE } from '../../config/api'
import { toast } from 'react-toastify'

export default function CollaboratorDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'collaborateur') {
      router.push('/')
    }
  }, [user, loading, router])

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
  const [signalements, setSignalements] = useState([])
  const [loadingSignals, setLoadingSignals] = useState(true)
  const [followed, setFollowed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('followedCases') || '[]') } catch { return [] }
  })

  useEffect(() => {
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
  }, [])

  const toggleFollow = (id) => {
    const next = followed.includes(id) ? followed.filter(x => x !== id) : [...followed, id]
    setFollowed(next)
    try { localStorage.setItem('followedCases', JSON.stringify(next)) } catch (e){}
    toast.info(next.includes(id) ? 'Dossier suivi' : 'Suivi retiré')
  }

  const contact = (email) => {
    if (!email) { toast.error('Email non disponible') ; return }
    window.location.href = `mailto:${email}`
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Espace Collaborateur</h1>
          <p className="text-gray-600 mt-2">Bienvenue {user?.prenom}! Dashboard collaborateur.</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onClick={() => toast.info('Export PDF non implémenté')} className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">📄 Export PDF</button>
            <button onClick={() => toast.info('Export Excel non implémenté')} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">📊 Export Excel</button>
            <button onClick={() => router.push('/collaborator/campagne/new')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">🎯 Créer campagne</button>
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
        </div>
      </div>
    </>
  )
}

