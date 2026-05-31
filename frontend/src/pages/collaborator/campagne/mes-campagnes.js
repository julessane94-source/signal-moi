import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { API_BASE } from '../../../config/api'
import { motion } from 'framer-motion'

export default function MesCampagnes() {
  const router = useRouter()
  const [campagnes, setCampagnes] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token')
    setToken(t)
    fetchCampagnes()
  }, [])

  const fetchCampagnes = async () => {
    try {
      const t = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/collaborator/campaigns`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {}
      })
      const data = await res.json()
      // Adapter les champs pour l'affichage
      const list = Array.isArray(data) ? data.map(c => ({
        id: c.id,
        titre: c.titre,
        description: c.description,
        type: c.type,
        date_debut: c.dateDebut || c.date_debut,
        date_fin: c.dateFin || c.date_fin,
        lieu: c.lieu,
        nombre_inscrits: c.nombre_inscrits || 0,
        capacite_max: c.capacite_max || c.capaciteMax || 100,
        created_at: c.createdAt || c.created_at
      })) : []
      setCampagnes(list)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
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

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Mes Campagnes - Signal-Moi</title>
      </Head>

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Campagnes et inscriptions
              </h1>
              <p className="text-gray-600">
                Gérez vos campagnes et consultez les listes d'inscrits
              </p>
            </div>
            <Link href="/collaborator/campagne/new">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                ➕ Nouvelle campagne
              </button>
            </Link>
          </div>

          {/* Liste des campagnes */}
          {campagnes.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {campagnes.map((campagne, idx) => (
                <motion.div
                  key={campagne.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
                >
                  <div className="p-6">
                    {/* Titre et type */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getTypeIcon(campagne.type)}</span>
                          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
                            {getTypeLabel(campagne.type)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {campagne.titre}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {campagne.description}
                    </p>

                    {/* Infos */}
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          {new Date(campagne.date_debut).toLocaleDateString('fr-FR')}
                          {' - '}
                          {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{campagne.lieu}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>👥</span>
                        <span>
                          {campagne.nombre_inscrits || 0} / {campagne.capacite_max}
                        </span>
                      </div>
                    </div>

                    {/* Barre progression */}
                    <div className="mb-6">
                      <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-green-600 h-full transition-all"
                          style={{
                            width: `${((campagne.nombre_inscrits || 0) / campagne.capacite_max) * 100}%`
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {campagne.capacite_max - (campagne.nombre_inscrits || 0)} place
                        {campagne.capacite_max - (campagne.nombre_inscrits || 0) !== 1 ? 's' : ''} restante
                      </div>
                    </div>

                    {/* Boutons */}
                    <div className="flex gap-2">
                      <Link href={`/collaborator/campagne/inscrits?id=${campagne.id}`}>
                        <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold">
                          👥 Voir inscrits
                        </button>
                      </Link>
                      <Link href={`/campagnes/${campagne.id}`}>
                        <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-sm font-semibold">
                          🔗 Détails
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg mb-6">Aucune campagne pour le moment</p>
              <Link href="/collaborator/campagne/new">
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                  ➕ Créer une campagne
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
