import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function SignalementsPublic() {
  const [signalements, setSignalements] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSignalements()
  }, [])

  const fetchSignalements = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signalements/public`)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Signalements - Signal-Moi</title>
      </Head>

      <main className="min-h-screen bg-slate-50 pt-16">
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-700 to-purple-700 text-white py-20">
          <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.22),_transparent_25%)]" />
          <div className="relative max-w-6xl mx-auto px-4 text-center">
            <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-200 mb-6">Signalements publics</span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Transparence locale, action citoyenne</h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed">
              Explorez les incidents signalés par votre communauté, suivez les évolutions et encouragez le changement là où il est le plus nécessaire.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <a className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
                  📩 Nous contacter
                </a>
              </Link>
              <Link href="/">
                <a className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                  ↩️ Retour à l'accueil
                </a>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300 mb-3">Transparence et sécurité</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Voir les signalements, suivre l’évolution</h2>
            <p className="mx-auto max-w-3xl text-slate-300 leading-relaxed">
              Explorez les signalements locaux, filtrez par catégorie et visualisez les incidents qui comptent pour votre quartier.
            </p>
          </div>
        </section>

        <section className="py-8 bg-white border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-full transition ${
                    filter === type ? 'bg-indigo-600 text-white shadow-soft' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              <div className="text-center py-12 bg-white rounded-xl">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500">Aucun signalement dans cette categorie</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSignalements.map((s, i) => (
                  <div key={s.id} className="section-card overflow-hidden hover:shadow-xl transition">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          s.statut === 'traite' ? 'bg-green-100 text-green-700' :
                          s.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {s.statut === 'traite' ? 'Resolu' :
                           s.statut === 'en_cours' ? 'En cours' : 'Nouveau'}
                        </span>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <Link href="/citizen/signalement">
                          <a className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                            Voir le signalement
                          </a>
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

        <section className="py-16 bg-indigo-600">
          <div className="max-w-4xl mx-auto text-center px-4">
            <div className="section-card bg-white p-10 text-slate-900">
              <h2 className="text-3xl font-bold mb-4">Vous avez vu un incident ?</h2>
              <p className="text-slate-600 mb-6">Signalement rapide, simple et anonyme</p>
              <Link href="/citizen/signalement">
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
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