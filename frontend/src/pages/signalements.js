import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function SignalementsPublic() {
  const [signalements, setSignalements] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSignalements()
    // Rafraîchir les signalements toutes les 30 secondes
    const interval = setInterval(fetchSignalements, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSignalements = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signalements/public?limit=80`)
      const data = await response.json()
      setSignalements(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setSignalements([])
      setLoading(false)
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      violence: '🔪',
      vol: '💰',
      probleme_eclairage: '💡',
      nid_de_poule: '🕳️',
      incendie: '🔥',
      accident: '🚗',
      autre: '📌'
    }
    return icons[type] || '📍'
  }

  const getTypeLabel = (type) => {
    const labels = {
      violence: 'Violence',
      vol: 'Vol',
      probleme_eclairage: 'Eclairage',
      nid_de_poule: 'Nid-de-poule',
      incendie: 'Incendie',
      accident: 'Accident',
      autre: 'Autre'
    }
    return labels[type] || type
  }

  const filteredSignalements = signalements.filter(s => filter === 'all' || s.type === filter)
  const types = ['all', 'violence', 'vol', 'probleme_eclairage', 'nid_de_poule']

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Signalements - Signal-Moi</title>
      </Head>

      <main className="signalements-page min-h-screen bg-slate-50 pt-16">
        <section className="signalements-hero page-hero-animated relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.28),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.25),_transparent_30%)]" />
          <div className="hero-copy-enter relative max-w-6xl mx-auto px-4 text-center">
            <span className="signalements-kicker inline-flex rounded-full border border-emerald-200/20 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.26em] text-emerald-100 mb-6">Signalements publics</span>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight md:text-5xl">Transparence locale, action citoyenne</h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed">
              Explorez les incidents signalés par votre communauté, suivez les évolutions et encouragez le changement là où il est le plus nécessaire.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  📩 Nous contacter
                </Link>
              <Link href="/" className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">
                  ↩️ Retour à l'accueil
                </Link>
            </div>
          </div>
        </section>

        <section className="signalements-intro bg-slate-900 text-white py-10 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm uppercase tracking-[0.26em] text-emerald-300 mb-3">Transparence et sécurité</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Voir les signalements, suivre l’évolution</h2>
            <p className="mx-auto max-w-3xl text-slate-300 leading-relaxed">
              Explorez les signalements locaux, filtrez par catégorie et visualisez les incidents qui comptent pour votre quartier.
            </p>
          </div>
        </section>

        <section className="signalements-filters border-b border-slate-200 bg-white py-7">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`signalement-filter px-4 py-2 rounded-full transition ${
                    filter === type ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/15' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {type === 'all' ? 'Tous' : `${getTypeIcon(type)} ${getTypeLabel(type)}`}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            {filteredSignalements.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-14 text-center shadow-sm">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500">Aucun signalement dans cette categorie</p>
              </div>
            ) : (
              <div className="card-stagger grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSignalements.map((s, i) => (
                  <div key={s.id} style={{ '--card-index': i }} className="signalement-card interactive-card section-card overflow-hidden border-slate-200 bg-white hover:shadow-xl transition">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="signalement-type flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                          {getTypeIcon(s.type)} {getTypeLabel(s.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-xl text-slate-900 mb-3">{s.titre}</h3>
                      <p className="text-gray-600 text-sm mb-3">{s.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">📍 {s.localisation}</span>
                        <span className={`signalement-status px-2 py-1 rounded-full text-xs ${
                          s.statut === 'traite' ? 'bg-green-100 text-green-700' :
                          s.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {s.statut === 'traite' ? 'Resolu' :
                           s.statut === 'en_cours' ? 'En cours' : 'Nouveau'}
                        </span>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <Link href={`/citizen/signalement/${s.id}`} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
                            Voir le signalement
                          </Link>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {s.signatures ? `${s.signatures} signatures` : 'Pas de signature'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="signalements-cta bg-gradient-to-r from-emerald-700 to-teal-700 py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <div className="section-card bg-white p-10 text-slate-900">
              <h2 className="text-3xl font-bold mb-4">Vous avez vu un incident ?</h2>
              <p className="text-slate-600 mb-6">Signalement rapide, simple et anonyme</p>
              <Link href="/citizen/signalement">
                <button className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition">
                  🚨 Faire un signalement
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

    </>
  )
}
