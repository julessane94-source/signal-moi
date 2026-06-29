import { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { API_BASE } from '../config/api'

export default function About() {
  const [stats, setStats] = useState([
    { value: 'Chargement...', label: 'Signalements traites' },
    { value: 'Chargement...', label: 'Citoyens engages' },
    { value: 'Chargement...', label: 'Campagnes organisees' },
    { value: '24/7', label: 'Support disponible' },
  ])

  const [collaborators, setCollaborators] = useState([])
  const [police, setPolice] = useState([])
  const [loadingPartners, setLoadingPartners] = useState(true)

  const [config, setConfig] = useState({
    about_page: {
      title: 'Notre histoire',
      content: 'Signal-Moi est né d’un constat simple : les citoyens ont besoin d’un canal fiable, rapide et humain pour signaler les incidents dans leur quartier, suivre les réponses et agir ensemble pour un environnement plus sûr.',
      images: [],
      videos: []
    }
  })

  const team = [
    { name: 'Souleymane Sane', role: 'Président', image: '👨‍💼', description: 'Pilote la vision stratégique et la gouvernance de l’organisation.' },
    { name: 'Dansa Sane', role: 'Directeur Exécutif', image: '👩‍💼', description: 'Coordonne l’exécution opérationnelle et l’impact sur le terrain.' },
    { name: 'Matar Diedhiou', role: 'Secrétaire Général (SG)', image: '👨‍📋', description: 'Assure la coordination institutionnelle et la liaison avec les parties prenantes.' },
  ]

  useEffect(() => {
    fetchStats()
    fetchConfig()
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      setLoadingPartners(true)
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const [collabRes, policeRes] = await Promise.all([
        fetch(`${API_BASE}/api/pages/users?role=collaborateur`, { headers }),
        fetch(`${API_BASE}/api/pages/users?role=police`, { headers })
      ])
      
      if (collabRes.ok) {
        const collabData = await collabRes.json()
        setCollaborators(Array.isArray(collabData) ? collabData : [])
      }
      
      if (policeRes.ok) {
        const policeData = await policeRes.json()
        setPolice(Array.isArray(policeData) ? policeData : [])
      }
    } catch (err) {
      console.error('Erreur chargement partenaires:', err)
    } finally {
      setLoadingPartners(false)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/site-config`)
      if (res.ok) {
        const data = await res.json()
        if (data.about_page) {
          const aboutPage = typeof data.about_page === 'string' ? JSON.parse(data.about_page) : data.about_page
          setConfig({ about_page: aboutPage })
        }
      }
    } catch (err) {
      console.error('Erreur fetchConfig:', err)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {}
      const signalementsEndpoint = token ? `${API_BASE}/api/admin/signalements` : `${API_BASE}/api/signalements/public?limit=80`

      const [sigRes, campRes, usersRes] = await Promise.all([
        fetch(signalementsEndpoint, { headers: authHeaders }),
        fetch(`${API_BASE}/api/campagnes?limit=50`, { headers: authHeaders }),
        token ? fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders }) : Promise.resolve({ ok: false })
      ])

      const sigData = sigRes.ok ? await sigRes.json() : []
      const campData = campRes.ok ? await campRes.json() : []
      const usersData = usersRes.ok ? await usersRes.json() : []

      const treatedCount = Array.isArray(sigData)
        ? sigData.filter((s) => s.statut === 'traite').length
        : 0

      setStats([
        { value: `${treatedCount || 0}+`, label: 'Signalements traites' },
        { value: usersRes.ok ? `${usersData.length || 0}+` : '—', label: 'Citoyens engages' },
        { value: `${campData.length || 0}+`, label: 'Campagnes organisees' },
        { value: '24/7', label: 'Support disponible' },
      ])
    } catch (err) {
      console.error('Erreur fetchStats:', err)
      setStats([
        { value: '500+', label: 'Signalements traites' },
        { value: '1000+', label: 'Citoyens engages' },
        { value: '50+', label: 'Campagnes organisees' },
        { value: '24/7', label: 'Support disponible' },
      ])
    }
  }

  return (
    <>
      <Head>
        <title>À propos - Signal-Moi</title>
        <meta name="description" content="Découvrez notre mission, nos valeurs et l’équipe qui porte Signal-Moi." />
      </Head>

      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 text-white py-20 shadow-xl">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium tracking-wide text-indigo-100 shadow-sm"
            >
              Plateforme citoyenne • Sécurité • Transparence
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              className="mt-6 text-4xl md:text-5xl font-bold tracking-tight"
            >
              Notre mission, racontée avec clarté et impact
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="mx-auto mt-5 max-w-3xl text-lg md:text-xl text-indigo-100"
            >
              Signal-Moi donne à chaque citoyen un espace simple et digne pour signaler, suivre et faire avancer les actions de sécurité et de développement dans son quartier.
            </motion.p>
          </div>
        </section>

        {/* Statistiques */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="section-card p-8 text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600">{stat.value}</div>
                  <div className="text-slate-600 mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Notre histoire */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="section-card overflow-hidden p-8 md:p-12">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-indigo-600">Pourquoi nous existons</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">{config.about_page?.title || 'Notre histoire'}</h2>
                </div>
                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">Engagement citoyen</span>
              </div>
              <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5 text-slate-600 text-lg leading-8">
                  {config.about_page?.content && config.about_page.content.includes('<') ? (
                    <div dangerouslySetInnerHTML={{ __html: config.about_page.content }} />
                  ) : (
                    config.about_page?.content && <p>{config.about_page.content}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-slate-900">Notre promesse</h3>
                  <ul className="mt-4 space-y-3 text-slate-700">
                    <li>• Un accès simple pour signaler et suivre un problème.</li>
                    <li>• Une collaboration plus fluide avec les autorités et les partenaires.</li>
                    <li>• Une approche humaine, sécurisée et respectueuse de la vie privée.</li>
                  </ul>
                </div>
              </div>
            </div>
            {config.about_page?.images && config.about_page.images.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.about_page.images.map((img, idx) => (
                  <img key={idx} src={img} alt="Image" className="w-full rounded-lg" />
                ))}
              </div>
            )}
            {config.about_page?.videos && config.about_page.videos.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-4">
                {config.about_page.videos.map((vid, idx) => (
                  <iframe key={idx} width="100%" height="400" src={vid} frameBorder="0" allowFullScreen className="rounded-lg"></iframe>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Nos valeurs */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Nos valeurs</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="section-card p-8 text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2">Confidentialite</h3>
                <p className="text-slate-600">Vos donnees sont protegees. Signalez anonymement si vous le souhaitez.</p>
              </div>
              <div className="section-card p-8 text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Rapidite</h3>
                <p className="text-slate-600">Notifications en temps reel pour une intervention rapide.</p>
              </div>
              <div className="section-card p-8 text-center">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold mb-2">Transparence</h3>
                <p className="text-slate-600">Suivez l'evolution de vos signalements a chaque etape.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Partenaires Collaborateurs */}
        <section className="py-16 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Nos Partenaires Collaborateurs</h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Les ONGs, associations et organisations sociales qui travaillent quotidiennement 
              pour ameliorer nos quartiers.
            </p>
            
            {loadingPartners ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : collaborators.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Aucun partenaire collaborateur enregistre pour le moment.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {collaborators.map((collab, idx) => (
                  <motion.div
                    key={collab.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition"
                  >
                    <div className="text-4xl mb-3">🏢</div>
                    <h3 className="font-semibold text-lg text-gray-900">{collab.prenom} {collab.nom}</h3>
                    <p className="text-sm text-gray-600 mt-1">{collab.email}</p>
                    {collab.telephone && <p className="text-sm text-gray-600">📞 {collab.telephone}</p>}
                    {collab.ville && <p className="text-sm text-gray-600">📍 {collab.ville}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Partenaires Police */}
        <section className="py-16 bg-gradient-to-r from-green-50 to-green-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="section-card p-10 mb-10 text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Nos Partenaires Autorites</h2>
              <p className="text-slate-600 max-w-3xl mx-auto">
                Les services de police et de gendarmerie qui traitent et resolvent 
                les problemes signales par notre communaute.
              </p>
            </div>
            
            {loadingPartners ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : police.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                Aucun agent d'autorite enregistre pour le moment.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {police.map((agent, idx) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="section-card p-6 text-center"
                  >
                    <div className="text-4xl mb-3">👮</div>
                    <h3 className="font-semibold text-lg text-slate-900">{agent.prenom} {agent.nom}</h3>
                    <p className="text-sm text-slate-600 mt-1">{agent.email}</p>
                    {agent.telephone && <p className="text-sm text-slate-600">📞 {agent.telephone}</p>}
                    {agent.ville && <p className="text-sm text-slate-600">📍 {agent.ville}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-indigo-600">Notre équipe</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Les personnes qui portent la vision de Signal-Moi</h2>
              <p className="mt-3 text-slate-600">Une équipe engagée, humaine et orientée impact pour renforcer la confiance entre citoyens, institutions et partenaires.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="section-card rounded-3xl p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-4xl shadow-inner">{member.image}</div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{member.name}</h3>
                  <p className="mt-1 text-indigo-600 font-semibold">{member.role}</p>
                  <p className="mt-3 text-slate-600 text-sm leading-6">{member.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Partenaires */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Nos partenaires</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="text-gray-400 text-xl">🏛️ Ministere</div>
              <div className="text-gray-400 text-xl">🚔 Police Nationale</div>
              <div className="text-gray-400 text-xl">🏥 Hopitaux</div>
              <div className="text-gray-400 text-xl">🏫 ONG Locales</div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
