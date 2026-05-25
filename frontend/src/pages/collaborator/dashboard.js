import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900">Espace Collaborateur</h1>
        <p className="text-gray-600 mt-2">Bienvenue {user?.prenom}! Dashboard collaborateur.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">📄 Export PDF</button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">📊 Export Excel</button>
          <button onClick={() => router.push('/collaborator/campagne/new')} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">🎯 Créer campagne</button>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">📈 Statistiques</button>
        </div>
      </div>
    </div>
  )
}

