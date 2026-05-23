import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
from 'react-toastify'
import { API_BASE } from '../../config/api'

export default function DashboardCampagnes({ campagnes }) {
  const [enrolled, setEnrolled] = useState(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load enrollment status from localStorage
    const saved = localStorage.getItem('enrolledCampagnes')
    if (saved) {
      setEnrolled(new Set(JSON.parse(saved)))
    }
  }, [])

  const handleEnroll = async (campagneId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/campagnes/${campagneId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const newEnrolled = new Set(enrolled)
        newEnrolled.add(campagneId)
        setEnrolled(newEnrolled)
        localStorage.setItem('enrolledCampagnes', JSON.stringify([...newEnrolled]))
        toast.success('Inscription à la campagne réussie!')
      } else {
        toast.error('Erreur lors de l\'inscription')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {campagnes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-500">Aucune campagne disponible</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {campagnes.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-800 flex-1">{c.titre}</h3>
                {enrolled.has(c.id) && (
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full ml-2">
                    ✓ Inscrit
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1 mb-4">{c.description}</p>
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(c.dateDebut).toLocaleDateString('fr-FR')} → {new Date(c.dateFin).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{c.lieu}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span>{c.participants || 0} participant(s)</span>
                </div>
              </div>
              <button
                onClick={() => handleEnroll(c.id)}
                disabled={enrolled.has(c.id) || loading}
                className={`w-full py-2 rounded-lg font-medium transition ${
                  enrolled.has(c.id)
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {enrolled.has(c.id) ? '✓ Inscrit' : 'S\'inscrire'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
