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

      <main data-reveal className="advocacy-page min-h-screen bg-slate-50 pt-16">
        <section className="page-hero-animated relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 py-16 text-white sm:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.23),_transparent_30%)]" />
          <div className="hero-copy-enter relative mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.26em] text-emerald-200">Mobilisation citoyenne</p>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight md:text-5xl">Plaidoyers en action</h1>
            <p className="mx-auto mb-8 mt-5 max-w-3xl text-base leading-7 text-slate-200 md:text-lg">
              Explorez les plaidoyers publics qui récoltent des signatures et mobilisent la communauté pour faire bouger les choses.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                📩 Nous contacter
              </Link>
              <Link href="/signalements" className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">
                📢 Voir les signalements
              </Link>
            </div>
            <div className="card-stagger mx-auto mt-9 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              {[
                ['Signer', 'Soutenez une cause locale'],
                ['Mobiliser', 'Faites circuler les idées'],
                ['Agir', 'Suivez les avancées']
              ].map(([title, text], index) => (
                <div key={title} style={{ '--card-index': index }} className="interactive-card rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-200">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Causes à soutenir</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Les plaidoyers de la communauté</h2>
            </div>
            {!loading && !error && <p className="text-sm font-medium text-slate-500">{plaidoyers.length} plaidoyer{plaidoyers.length > 1 ? 's' : ''} publié{plaidoyers.length > 1 ? 's' : ''}</p>}
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-800">{error}</div>
          ) : (
            <div className="card-stagger grid md:grid-cols-2 gap-6">
              {plaidoyers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm md:col-span-2">Aucun plaidoyer pour le moment</div>
              ) : (
                plaidoyers.map((p, index) => (
                  <article key={p.id} style={{ '--card-index': index }} className="interactive-card overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{p.categorie || 'Mobilisation citoyenne'}</span>
                        <h3 className="mt-3 text-xl font-bold text-slate-900">{p.titre}</h3>
                      </div>
                      <p className="overflow-hidden text-sm leading-6 text-slate-600">{p.description}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <span className="rounded-2xl bg-slate-50 p-3 font-medium text-slate-700">🖊️ {p.nombre_signatures_total || 0} signatures</span>
                        <span className="rounded-2xl bg-slate-50 p-3 font-medium text-slate-700">🎯 Objectif&nbsp;: {p.objectif_signatures || '—'}</span>
                      </div>
                      <div className="mt-2">
                        <Link href={`/plaidoyers/${p.id}`}>
                          <a className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                            Voir le plaidoyer
                          </a>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </main>
    </>
  )
}
