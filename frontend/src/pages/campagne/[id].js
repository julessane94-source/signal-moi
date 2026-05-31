import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../../components/common/Navbar'
import Link from 'next/link'
import { API_BASE } from '../../config/api'

const getImageUrl = (url) => {
  if (!url) return null
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`
}

export default function CampagneDetail() {
  const router = useRouter()
  const { id } = router.query
  const [campagne, setCampagne] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inscrit, setInscrit] = useState(false)
  const [inscriving, setInscribing] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchCampagne()
    checkInscription()
  }, [id])

  const fetchCampagne = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE}/api/campagnes/${id}`)
      if (!res.ok) throw new Error('Campagne non trouvée')
      const data = await res.json()
      setCampagne(data)
      setError(null)
    } catch (err) {
      console.error('Erreur fetch campagne:', err)
      setError('Impossible de charger la campagne')
    } finally {
      setLoading(false)
    }
  }

  const checkInscription = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`${API_BASE}/api/campagnes/${id}/inscrit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setInscrit(data.inscrit || false)
      }
    } catch (err) {
      console.error('Erreur vérification inscription:', err)
    }
  }

  const handleInscription = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setInscribing(true)
    try {
      const res = await fetch(`${API_BASE}/api/campagnes/${id}/inscrire`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (res.ok) {
        setInscrit(true)
        alert('✅ Inscription réussie à la campagne!')
      } else {
        const err = await res.json()
        alert('❌ ' + (err.error || 'Erreur inscription'))
      }
    } catch (err) {
      console.error(err)
      alert('❌ Erreur réseau')
    } finally {
      setInscribing(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  if (error || !campagne) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">⚠️ {error || 'Campagne non trouvée'}</h1>
            <Link href="/campagnes">
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                Retour aux campagnes
              </button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* En-tête */}
          <div className="mb-8">
            <Link href="/campagnes">
              <button className="text-indigo-600 hover:text-indigo-700 font-medium mb-4">
                ← Retour aux campagnes
              </button>
            </Link>
          </div>

          {/* Carte principale */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Image */}
            {campagne.image_url && (
              <div className="w-full h-96 overflow-hidden bg-gray-200">
                <img
                  src={getImageUrl(campagne.image_url)}
                  alt={campagne.titre}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Contenu */}
            <div className="p-8">
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{campagne.titre}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                    {campagne.type || 'N/A'}
                  </span>
                  <span>📅 {new Date(campagne.date_debut).toLocaleDateString('fr-FR')}</span>
                  {campagne.nombre_inscrits !== undefined && (
                    <span>👥 {campagne.nombre_inscrits} inscrits</span>
                  )}
                </div>
              </div>

              <div className="prose prose-lg max-w-none mb-8">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {campagne.description}
                </p>
              </div>

              {/* Détails */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">📍 Lieu</h3>
                  <p className="text-gray-700">{campagne.lieu || 'À définir'}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">📊 Capacité</h3>
                  <p className="text-gray-700">{campagne.capacite_max || 'Illimitée'} places</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">📅 Dates</h3>
                  <p className="text-gray-700">
                    Du {campagne.date_debut ? new Date(campagne.date_debut).toLocaleDateString('fr-FR') : 'N/A'}
                    {campagne.date_fin && ` au ${new Date(campagne.date_fin).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">✓ Statut</h3>
                  <p className="text-gray-700">
                    {campagne.est_actif ? '✅ Active' : '❌ Inactive'}
                  </p>
                </div>
              </div>

              {/* Bouton d'inscription */}
              <button
                onClick={handleInscription}
                disabled={inscrit || inscrving}
                className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                  inscrit
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {inscrit ? '✅ Inscrit à cette campagne' : inscrving ? 'Inscription...' : '🚀 S\'inscrire à la campagne'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
