import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../../../components/common/Navbar'
import { API_BASE } from '../../../config/api'
import { useAuth } from '../../../context/AuthContext'

export default function MesPlaidoyers() {
  const { user } = useAuth()
  const [plaidoyers, setPlaidoyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchPlaidoyers()
  }, [user])

  const fetchPlaidoyers = async () => {
    try {
      const t = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/plaidoyers`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {}
      })
      if (!res.ok) {
        setError('Impossible de récupérer les plaidoyers')
        setLoading(false)
        return
      }
      const data = await res.json()
      // Filtrer par auteur
      const mine = Array.isArray(data) ? data.filter(p => p.auteur_id === user.id) : []
      setPlaidoyers(mine)
    } catch (err) {
      console.error(err)
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Mes plaidoyers</title>
      </Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Mes plaidoyers</h1>
            <p className="text-sm text-gray-600">Liste des plaidoyers que vous avez créés</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-700">{error}</div>
          ) : (
            <div className="space-y-4">
              {plaidoyers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">Aucun plaidoyer trouvé</div>
              ) : (
                <div className="grid gap-4">
                  {plaidoyers.map(p => (
                    <div key={p.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{p.titre}</h3>
                        <p className="text-sm text-gray-600">{p.categorie} — {p.nombre_signatures_total || 0} signatures</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/collaborator/plaidoyer/${p.id}/signatures`}>
                          <a className="bg-blue-600 text-white px-3 py-2 rounded">Voir signataires</a>
                        </Link>
                        <Link href={`/collaborator/plaidoyer/${p.id}`}>
                          <a className="bg-gray-200 px-3 py-2 rounded">Voir</a>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
