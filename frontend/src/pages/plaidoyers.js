import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { API_BASE } from '../config/api'

export default function PlaidoyersPage() {
  const [plaidoyers, setPlaidoyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPlaidoyers()
  }, [])

  const fetchPlaidoyers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/plaidoyers`)
      if (!res.ok) {
        setError('Impossible de récupérer les plaidoyers')
        setLoading(false)
        return
      }
      const data = await res.json()
      setPlaidoyers(Array.isArray(data) ? data : [])
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
        <title>Plaidoyers - Signal-Moi</title>
      </Head>

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Plaidoyers</h1>
            <p className="text-sm text-gray-600">Liste des plaidoyers publics</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-red-700">{error}</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {plaidoyers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">Aucun plaidoyer pour le moment</div>
              ) : (
                plaidoyers.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow p-6">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="font-semibold text-xl text-gray-900">{p.titre}</h3>
                        <p className="text-sm text-gray-500">{p.categorie || 'Sans catégorie'}</p>
                      </div>
                      <p className="text-sm text-gray-700 overflow-hidden">{p.description}</p>
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <span>🖊️ {p.nombre_signatures_total || 0} signatures</span>
                        <span>🎯 Objectif&nbsp;: {p.objectif_signatures || '—'}</span>
                      </div>
                      <div className="mt-2">
                        <Link href={`/plaidoyers/${p.id}`}>
                          <a className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                            Voir le plaidoyer
                          </a>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
