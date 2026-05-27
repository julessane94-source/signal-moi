import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function SignalementsPublic() {
  const [signalements, setSignalements] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})

  useEffect(() => {
    fetchSignalements()
  }, [])

  const fetchSignalements = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signalements/public`)
      const data = await response.json()
      setSignalements(data)
      
      // Calculer les stats
      const types = {}
      data.forEach(s => { types[s.type] = (types[s.type] || 0) + 1 })
      setStats(types)
      
      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      violence: '??',
      vol: '??',
      probleme_eclairage: '??',
      nid_de_poule: '???',
      incendie: '??',
      accident: '??',
      bruit: '??',
      autre: '??'
    }
    return icons[type] || '??'
  }

  const getTypeLabel = (type) => {
    const labels = {
      violence: 'Violence',
      vol: 'Vol',
      probleme_eclairage: '?clairage',
      nid_de_poule: 'Nid-de-poule',
      incendie: 'Incendie',
      accident: 'Accident',
      bruit: 'Nuissance',
      autre: 'Autre'
    }
    return labels[type] || type
  }

  const filteredSignalements = signalements.filter(s => 
    filter === 'all' || s.type === filter
  )

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
        <title>Signalements - Signal-Moi</title>
        <meta name="description" content="Consultez les signalements citoyens" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Signalements citoyens</h1>
            <p className="text-xl text-indigo-100">
              D?couvrez les incidents signal?s dans votre r?gion
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full transition ${
                  filter === 'all' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tous ({signalements.length})
              </button>
              {Object.entries(stats).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-full transition flex items-center gap-2 ${
                    filter === type 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>{getTypeIcon(type)}</span>
                  <span>{getTypeLabel(type)} ({count})</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Liste des signalements */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            {filteredSignalements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <div className="text-6xl mb-4">??</div>
                <p className="text-gray-500">Aucun signalement dans cette cat?gorie</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSignalements.map((signalement, index) => (
                  <motion.div
                    key={signalement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                          {getTypeIcon(signalement.type)} {getTypeLabel(signalement.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(signalement.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{signalement.titre}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {signalement.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">?? {signalement.localisation}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          signalement.statut === 'traite' ? 'bg-green-100 text-green-700' :
                          signalement.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {signalement.statut === 'traite' ? '? R?solu' :
                           signalement.statut === 'en_cours' ? '? En cours' : '?? Nouveau'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-indigo-600">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-white mb-4">Vous avez vu un incident ?</h2>
            <p className="text-indigo-100 mb-6">Signalement est rapide, simple et anonyme</p>
            <Link href="/citizen/signalement">
              <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition">
                ?? Faire un signalement
              </button>
            </Link>
          </div>
        </section>
      </main>

    </>
  )
}