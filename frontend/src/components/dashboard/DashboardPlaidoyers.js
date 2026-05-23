import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'

export default function DashboardPlaidoyers({ plaidoyers }) {
  const [signed, setSigned] = useState(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load signature status from localStorage
    const saved = localStorage.getItem('signedPetitions')
    if (saved) {
      setSigned(new Set(JSON.parse(saved)))
    }
  }, [])

  const handleSign = async (plaidoyerId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/plaidoyers/${plaidoyerId}/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const newSigned = new Set(signed)
        newSigned.add(plaidoyerId)
        setSigned(newSigned)
        localStorage.setItem('signedPetitions', JSON.stringify([...newSigned]))
        toast.success('Pétition signée avec succès!')
      } else {
        toast.error('Erreur lors de la signature')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercent = (current, target) => {
    if (!target) return 0
    return Math.min((current / target) * 100, 100)
  }

  return (
    <div>
      {plaidoyers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <div className="text-6xl mb-4">✍️</div>
          <p className="text-gray-500">Aucun plaidoyer disponible</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plaidoyers.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{p.titre}</h3>
                  <p className="text-gray-600 mt-1 text-sm">{p.description}</p>
                </div>
                {signed.has(p.id) && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full ml-2 whitespace-nowrap">
                    ✓ Signé
                  </span>
                )}
              </div>

              <div className="mt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">📊 Signatures</span>
                  <span className="text-sm font-medium text-gray-700">
                    {p.signatures || 0} / {p.targetSignatures || 'illimité'}
                  </span>
                </div>
                {p.targetSignatures && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercent(p.signatures || 0, p.targetSignatures)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {p.deadline && (
                <p className="text-xs text-gray-500 mb-4">
                  ⏰ Limite: {new Date(p.deadline).toLocaleDateString('fr-FR')}
                </p>
              )}

              <button
                onClick={() => handleSign(p.id)}
                disabled={signed.has(p.id) || loading}
                className={`w-full py-2 rounded-lg font-medium transition ${
                  signed.has(p.id)
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
              >
                {signed.has(p.id) ? '✓ Vous avez signé' : '✍️ Signer la pétition'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
