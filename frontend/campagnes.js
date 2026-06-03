import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from './src/components/common/Navbar'
import { API_BASE } from './src/config/api'

const getImageUrl = (url) => {
  if (!url) return null
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`
}

export default function Campagnes() {
  const [campagnes, setCampagnes] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampagnes()
  }, [])

  const fetchCampagnes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/campagnes`)
      const data = await response.json()
      if (Array.isArray(data)) {
        setCampagnes(data)
      } else {
        console.warn('Réponse /api/campagnes inattendue, attendu un tableau :', data)
        setCampagnes([])
      }
      setLoading(false)
    } catch (error) {
      console.error('Erreur:', error)
      setLoading(false)
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      formation: '🎓',
      activite: '🏃',
      sensibilisation: '📢',
      marche: '🚶',
      conference: '🎤',
      autre: '🔸'
    }
    return icons[type] || '??'
  }

  const getTypeLabel = (type) => {
    const labels = {
      formation: 'Formation',
      activite: 'Activité',
      sensibilisation: 'Sensibilisation',
      marche: 'Marche',
      conference: 'Conférence',
      autre: 'Autre'
    }
    return labels[type] || type
  }

  const filteredCampagnes = campagnes.filter(c => 
    filter === 'all' || c.type === filter
  )

  const types = ['all', 'formation', 'activite', 'sensibilisation', 'marche', 'conference']

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Campagnes - Signal-Moi</title>
        <meta name="description" content="Participez aux campagnes citoyennes" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#f8fafc_100%)] pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-950 text-white py-24">
          <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_20%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.14),_transparent_22%)]" />
          <div className="relative max-w-6xl mx-auto px-4 text-center">
            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-200">Mobilisation citoyenne</p>
            <h1 className="mx-auto max-w-4xl text-4xl md:text-5xl font-black tracking-tight text-white">Campagnes engagées pour un quartier plus solidaire</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg md:text-xl text-slate-200 leading-8">
              Découvrez les actions locales, participez aux initiatives de terrain et contribuez à un impact visible dans votre communauté.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a href="#campagnes" className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-6 py-3 text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-400/30">
                ✨ Voir les campagnes
              </a>
              <a href="/contact" className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-white/20">
                📩 Nous contacter
              </a>
            </div>
            <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
              {[
                ['+120', 'Actions mobilisées'],
                ['24/7', 'Suivi des initiatives'],
                ['100%', 'Participation citoyenne']
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-slate-900/15 backdrop-blur-md">
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-sm text-slate-200">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filtres */}
        <section className="py-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-indigo-600">Filtrer</p>
                <h2 className="text-xl font-semibold text-slate-900">Choisissez la catégorie qui vous intéresse</h2>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {types.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      filter === type
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type === 'all' ? '🔎 Toutes' : `${getTypeIcon(type)} ${getTypeLabel(type)}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Liste des campagnes */}
        <section id="campagnes" className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            {filteredCampagnes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/90 p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">📭</div>
                <h3 className="text-xl font-semibold text-slate-900">Aucune campagne pour le moment</h3>
                <p className="mt-2 text-slate-600">Revenez bientôt pour découvrir de nouvelles initiatives citoyennes.</p>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {filteredCampagnes.map((campagne, index) => (
                  <motion.article
                    key={campagne.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                          {getTypeIcon(campagne.type)} {getTypeLabel(campagne.type)}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          new Date(campagne.date_debut) > new Date()
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {new Date(campagne.date_debut) > new Date() ? 'À venir' : 'Terminé'}
                        </span>
                      </div>

                      {campagne.image_url && (
                        <div className="mb-5 overflow-hidden rounded-2xl bg-slate-100">
                          <img
                            src={getImageUrl(campagne.image_url)}
                            alt={campagne.titre}
                            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <h3 className="text-xl font-bold text-slate-900">{campagne.titre}</h3>
                      <p className="mt-3 text-slate-600 leading-7">{campagne.description}</p>

                      <dl className="mt-5 space-y-3 text-sm text-slate-600">
                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                          <span className="text-base">📅</span>
                          <dd>{campagne.date_debut ? new Date(campagne.date_debut).toLocaleDateString('fr-FR') : 'N/A'} — {campagne.date_fin ? new Date(campagne.date_fin).toLocaleDateString('fr-FR') : 'N/A'}</dd>
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                          <span className="text-base">📍</span>
                          <dd>{campagne.lieu || 'Lieu à préciser'}</dd>
                        </div>
                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                          <span className="text-base">👥</span>
                          <dd>Capacité : {campagne.capacite_max ?? 'N/A'} personnes</dd>
                        </div>
                      </dl>

                      <Link href={`/campagnes/${campagne.id}`}>
                        <button className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30">
                          Voir la campagne et s’inscrire
                        </button>
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

    </>
  )
}