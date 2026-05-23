import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { API_BASE } from '../../config/api'

export default function DashboardStats({ user }) {
  const [stats, setStats] = useState({
    totalSignalements: 0,
    resolvedSignalements: 0,
    activeCampagnes: 0,
    signedPetitions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const base = API_BASE

      const responses = await Promise.all([
        fetch(`${base}/api/signalements`, { headers }),
        fetch(`${base}/api/campagnes`, { headers }),
        fetch(`${base}/api/plaidoyers`, { headers })
      ])

      const [signalData, campData, plaidData] = await Promise.all(
        responses.map(r => r.json())
      )

      const signalements = Array.isArray(signalData) ? signalData : []
      const campagnes = Array.isArray(campData) ? campData : []
      const plaidoyers = Array.isArray(plaidData) ? plaidData : []

      setStats({
        totalSignalements: signalements.length,
        resolvedSignalements: signalements.filter(s => s.statut === 'traite').length,
        activeCampagnes: campagnes.length,
        signedPetitions: plaidoyers.filter(p => p.signed).length
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: '📋', label: 'Signalements', value: stats.totalSignalements, color: 'blue' },
    { icon: '✅', label: 'Résolus', value: stats.resolvedSignalements, color: 'green' },
    { icon: '🎯', label: 'Campagnes', value: stats.activeCampagnes, color: 'purple' },
    { icon: '✍️', label: 'Pétitions signées', value: stats.signedPetitions, color: 'indigo' }
  ]

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-24 animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      {statCards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`border rounded-xl p-4 ${colorClasses[card.color]}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
            <span className="text-3xl">{card.icon}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
