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
          <div className="mb-8 rounded-3xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-700 p-10 text-white shadow-2xl shadow-fuchsia-500/20">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200 mb-3">Plaidoyers</p>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Plaidoyers en action</h1>
            <p className="text-base md:text-lg text-slate-100 max-w-3xl leading-relaxed mb-8">
              Explorez les plaidoyers publics qui récoltent des signatures et mobilisent la communauté pour faire bouger les choses.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  📩 Nous contacter
                </Link>
              <Link href="/signalements" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  📢 Voir les signalements
                </Link>
            </div>
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
