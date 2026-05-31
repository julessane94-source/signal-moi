import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from './src/components/common/Navbar'
import { API_BASE } from './src/config/api'

const getImageUrl = (url) => {
  if (!url) return null
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`
}

export default function Campagnes() {
  const [campagnes, setCampagnes] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampagnes()
  }, [])

  const fetchCampagnes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/campagnes`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setCampagnes(data)
      } else {
        console.warn('Réponse /api/campagnes inattendue, attendu un tableau :', data)
        setCampagnes([])
      }
      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
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

  const filteredCampagnes = campagnes.filter(c => 
    filter === 'all' || c.type === filter
  )

  const types = ['all', 'formation', 'activite', 'sensibilisation', 'marche', 'conference']

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Campagnes - Signal-Moi</title>
        <meta name="description" content="Participez aux campagnes citoyennes" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero */}
        <section className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white py-24">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Campagnes citoyennes</h1>
            <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto mb-8 leading-relaxed">
              Participez à des actions concrètes pour améliorer votre quartier — rejoignez, signalez, et partagez le changement.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button className="btn-success inline-flex items-center gap-2">
                ✨ Découvrir
              </button>
              <a href="/contact" className="btn-primary inline-flex items-center gap-2">
                📩 Contact
              </a>
            </div>
          </div>
        </section>

        {/* Filtres */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-full transition ${
                    filter === type 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type === 'all' ? '🔎 Toutes' : `${getTypeIcon(type)} ${getTypeLabel(type)}`}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Liste des campagnes */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            {filteredCampagnes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500">Aucune campagne pour le moment</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {filteredCampagnes.map((campagne, index) => (
                  <motion.div
                    key={campagne.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {getTypeIcon(campagne.type)} {getTypeLabel(campagne.type)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          new Date(campagne.date_debut) > new Date() 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {new Date(campagne.date_debut) > new Date() ? '⏳ À venir' : '✅ Terminé'}
                        </span>
                      </div>
                      {campagne.image_url && (
                        <div className="mb-4 overflow-hidden rounded-lg">
                          <img
                            src={getImageUrl(campagne.image_url)}
                            alt={campagne.titre}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{campagne.titre}</h3>
                      <p className="text-gray-600 mb-4">{campagne.description}</p>
                      
                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{campagne.date_debut ? new Date(campagne.date_debut).toLocaleDateString('fr-FR') : 'N/A'} - {campagne.date_fin ? new Date(campagne.date_fin).toLocaleDateString('fr-FR') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{campagne.lieu}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>👥</span>
                          <span>Capacité: {campagne.capacite_max ?? 'N/A'} personnes</span>
                        </div>
                      </div>
                      
                      <Link href={`/campagnes/${campagne.id}`}>
                        <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                          S'inscrire ?
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

    </>
  )
}