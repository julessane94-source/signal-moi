import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function DashboardSignalements({ signalements }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')

  const filtered = useMemo(() => {
    return signalements.filter(s => {
      const matchSearch = s.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = filterStatus === 'tous' || s.statut === filterStatus
      return matchSearch && matchStatus
    })
  }, [signalements, searchTerm, filterStatus])

  const getStatusBadge = (statut) => {
    const statusMap = {
      'nouveau': { color: 'bg-blue-100 text-blue-700', text: 'Nouveau' },
      'en_cours': { color: 'bg-yellow-100 text-yellow-700', text: 'En cours' },
      'traite': { color: 'bg-green-100 text-green-700', text: 'Traité' },
      'transfere': { color: 'bg-purple-100 text-purple-700', text: 'Transféré' }
    }
    const s = statusMap[statut] || statusMap['nouveau']
    return <span className={`px-3 py-1 text-xs font-medium rounded-full ${s.color}`}>{s.text}</span>
  }

  const statusOptions = [
    { value: 'tous', label: 'Tous les statuts' },
    { value: 'nouveau', label: 'Nouveau' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'traite', label: 'Traité' },
    { value: 'transfere', label: 'Transféré' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Rechercher un signalement..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-500">Aucun signalement trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s, idx) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(s.statut)}
                    <span className="text-xs text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800">{s.titre}</h3>
                  <p className="text-gray-600 mt-1 line-clamp-2">{s.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>📍 {s.localisation}</span>
                    <span>📎 {s.fichiers?.length || 0} pièce(s)</span>
                  </div>
                </div>
                <Link href={`/citizen/signalement/${s.id}`}>
                  <button className="text-red-500 hover:text-red-600 font-medium whitespace-nowrap ml-4">
                    Voir détails →
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
