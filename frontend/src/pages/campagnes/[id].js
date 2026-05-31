import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { motion } from 'framer-motion'
import { API_BASE } from '../../config/api'

const getImageUrl = (url) => {
  if (!url) return null
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`
}

export default function DetailCampagne() {
  const router = useRouter()
  const { id } = router.query
  const [campagne, setCampagne] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isInscribed, setIsInscribed] = useState(false)
  const [inscribed, setInscribed] = useState([])
  const [authToken, setAuthToken] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setAuthToken(token)

    if (id) {
      fetchCampagne()
      // call checkInscription after ensuring we read token directly
      if (token) {
        checkInscription(token)
      }
    }
  }, [id])

  const fetchCampagne = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/campagnes/${id}`
      )
      const data = await response.json()
      if (response.ok) {
        setCampagne(data)
      } else {
        setError('Campagne non trouvée')
      }
      setLoading(false)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur lors du chargement')
      setLoading(false)
    }
  }

  const checkInscription = async () => {
    const token = authToken || localStorage.getItem('token')
    if (!token) return
    try {
      const response = await fetch(
        `${API_BASE}/api/campagnes/${id}/inscrit`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setIsInscribed(data.isInscribed)
      }
    } catch (err) {
      console.error('Erreur vérification inscription:', err)
    }
  }

  const handleInscrire = async () => {
    const token = authToken || localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/campagnes/${id}/inscrire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        setMessage('✅ Inscription réussie!')
        setIsInscribed(true)
        // Recharger le nombre d'inscrits
        fetchCampagne()
        setTimeout(() => setMessage(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur serveur')
    }
  }

  const handleDesinscrire = async () => {
    const token = authToken || localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/campagnes/${id}/inscrire`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        setMessage('✅ Désinscription réussie')
        setIsInscribed(false)
        fetchCampagne()
        setTimeout(() => setMessage(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la désinscription')
      }
    } catch (err) {
      console.error('Erreur:', err)
      setError('Erreur serveur')
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      formation: '🎓',
      activite: '🏃',
      sensibilisation: '📢',
      marche: '🚶',
      conference: '🎤',
      autre: '🔸'
    }
    return icons[type] || '??'
  }

  const getTypeLabel = (type) => {
    const labels = {
      formation: 'Formation',
      activite: 'Activité',
      sensibilisation: 'Sensibilisation',
      marche: 'Marche',
      conference: 'Conférence',
      autre: 'Autre'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </>
    )
  }

  if (!campagne) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Campagne non trouvée</p>
          </div>
        </div>
      </>
    )
  }

  const capaciteRestante = campagne.capacite_max - (campagne.nombre_inscrits || 0)
  const isPleine = capaciteRestante <= 0
  const isTerminee = new Date(campagne.date_fin) < new Date()

  return (
    <>
      <Head>
        <title>{campagne.titre} - Signal-Moi</title>
        <meta name="description" content={campagne.description} />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 pt-20">
        {/* Messages */}
        {message && (
          <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-green-100 text-green-800 p-4 rounded-lg shadow-lg z-50">
            {message}
          </div>
        )}
        {error && (
          <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-100 text-red-800 p-4 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}

        {/* Hero */}
        <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => router.back()}
              className="mb-4 text-green-100 hover:text-white"
            >
              ← Retour
            </button>
            <h1 className="text-4xl font-bold mb-2">{campagne.titre}</h1>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getTypeIcon(campagne.type)}</span>
              <span className="text-green-100">{getTypeLabel(campagne.type)}</span>
            </div>
          </div>
        </section>

        {/* Contenu principal */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Image et Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2"
            >
              {/* Image de la campagne */}
              {campagne.image_url && (
                <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
                  <img 
                    src={getImageUrl(campagne.image_url)} 
                    alt={campagne.titre}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      console.error('Erreur chargement image:', campagne.image_url);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {campagne.description}
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <div className="font-semibold text-gray-900">Dates</div>
                      <div className="text-gray-600">
                        {new Date(campagne.date_debut).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {' - '}
                        {new Date(campagne.date_fin).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <div className="font-semibold text-gray-900">Lieu</div>
                      <div className="text-gray-600">{campagne.lieu}</div>
                    </div>
                  </div>

                  {isTerminee && (
                    <div className="bg-gray-100 border-l-4 border-gray-400 p-4 rounded">
                      <p className="text-gray-700">
                        <span className="font-semibold">Cette campagne est terminée</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Encadré d'inscription */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-green-600">
                    {campagne.nombre_inscrits || 0}
                  </div>
                  <div className="text-gray-600">
                    inscrits sur {campagne.capacite_max}
                  </div>
                  <div className="mt-2 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-600 h-full transition-all duration-300"
                      style={{
                        width: `${((campagne.nombre_inscrits || 0) / campagne.capacite_max) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                {isPleine && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4 text-red-700 text-center font-semibold">
                    Campagne complète
                  </div>
                )}

                {!isTerminee ? (
                  <>
                    {!authToken ? (
                      <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        Se connecter pour s'inscrire
                      </button>
                    ) : isInscribed ? (
                      <button
                        onClick={handleDesinscrire}
                        className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
                      >
                        ✓ Inscrit • Se désinscrire
                      </button>
                    ) : (
                      <button
                        onClick={handleInscrire}
                        disabled={isPleine}
                        className={`w-full py-3 rounded-lg transition font-semibold ${
                          isPleine
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        S'inscrire
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-center text-gray-600 font-semibold">
                    Campagne terminée
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500 text-center">
                    Places disponibles: <span className="font-semibold text-gray-700">
                      {Math.max(0, capaciteRestante)}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
