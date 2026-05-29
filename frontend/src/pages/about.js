import { useState, useEffect } from 'react'
import Head from 'next/head'
import Navbar from '../components/common/Navbar'
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
      content: 'Signal-Moi est ne d\'un constat simple : les citoyens manquent souvent de canaux efficaces pour signaler les incidents dans leur quartier.',
      images: [],
      videos: []
    }
  })

  const team = [
    { name: 'Jean Dupont', role: 'Fondateur & CEO', image: '👨‍💼', description: 'Expert en securite citoyenne' },
    { name: 'Marie Camara', role: 'Directrice Technique', image: '👩‍💻', description: 'Architecte logiciel' },
    { name: 'Pierre Martin', role: 'Coordinateur', image: '👨‍📋', description: 'Liaison avec les autorites' },
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
        fetch(`${API_BASE}/api/admin/users?role=collaborateur`, { headers }),
        fetch(`${API_BASE}/api/admin/users?role=police`, { headers })
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
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const [sigRes, campRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/signalements`, { headers }),
        fetch(`${API_BASE}/api/campagnes`, { headers }),
        fetch(`${API_BASE}/api/admin/users`, { headers })
      ])
      
      const sigData = sigRes.ok ? await sigRes.json() : []
      const campData = campRes.ok ? await campRes.json() : []
      const usersData = usersRes.ok ? await usersRes.json() : []
      
      setStats([
        { value: `${sigData.length || 0}+`, label: 'Signalements traites' },
        { value: `${usersData.length || 0}+`, label: 'Citoyens engages' },
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
        <title>A propos - Signal-Moi</title>
        <meta name="description" content="Decouvrez notre mission et notre equipe" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
          <div className="max-w-4xl mx-auto text-center px-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Notre mission
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-indigo-100"
            >
              Rendre chaque quartier plus sur grace a la participation citoyenne
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-indigo-600">{stat.value}</div>
                  <div className="text-gray-600 mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Notre histoire */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">{config.about_page?.title || 'Notre histoire'}</h2>
            <div className="space-y-6 text-gray-600 text-lg">
              {config.about_page?.content && config.about_page.content.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: config.about_page.content }} />
              ) : (
                config.about_page?.content && <p>{config.about_page.content}</p>
              )}
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
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Nos valeurs</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-2">Confidentialite</h3>
                <p className="text-gray-600">Vos donnees sont protegees. Signalez anonymement si vous le souhaitez.</p>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Rapidite</h3>
                <p className="text-gray-600">Notifications en temps reel pour une intervention rapide.</p>
              </div>
              <div className="text-center p-6">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold mb-2">Transparence</h3>
                <p className="text-gray-600">Suivez l'evolution de vos signalements a chaque etape.</p>
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
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Nos Partenaires Autorites</h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Les services de police et de gendarmerie qui traitent et resolvent 
              les problemes signales par notre communaute.
            </p>
            
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
                    className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition"
                  >
                    <div className="text-4xl mb-3">👮</div>
                    <h3 className="font-semibold text-lg text-gray-900">{agent.prenom} {agent.nom}</h3>
                    <p className="text-sm text-gray-600 mt-1">{agent.email}</p>
                    {agent.telephone && <p className="text-sm text-gray-600">📞 {agent.telephone}</p>}
                    {agent.ville && <p className="text-sm text-gray-600">📍 {agent.ville}</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Notre equipe</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md p-6 text-center"
                >
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-indigo-600 mb-2">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.description}</p>
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
