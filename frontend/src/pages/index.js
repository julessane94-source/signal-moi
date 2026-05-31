'use client'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'
import { Button } from '../components/ui'

const getImageUrl = (url) => {
  if (!url) return null
  return url.startsWith('http://') || url.startsWith('https://') ? url : `${API_BASE}${url}`
}

export default function Home() {
  const { user } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [config, setConfig] = useState({
    home_page: {
      title: 'Signalez les incidents',
      heroText: 'dans votre quartier',
      content: 'Une plateforme citoyenne pour signaler et suivre les problemes de votre communaute.',
      images: [],
      videos: []
    }
  })
  const [collaboratorCampaigns, setCollaboratorCampaigns] = useState([])

  useEffect(() => {
    // PWA Installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    })
    
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/site-config`)
      if (res.ok) {
        const data = await res.json()
        if (data.home_page) {
          const homePage = typeof data.home_page === 'string' ? JSON.parse(data.home_page) : data.home_page
          setConfig({ home_page: homePage })
          if (Array.isArray(data.collaboratorCampaigns)) setCollaboratorCampaigns(data.collaboratorCampaigns)
        }
      }
    } catch (err) {
      console.error('Erreur fetchConfig:', err)
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallButton(false)
    }
    setDeferredPrompt(null)
  }

  // Sanitize HTML content from site config (client-side only)
  const [sanitizedHomeContent, setSanitizedHomeContent] = useState('')

  useEffect(() => {
    // Only sanitize on client side
    if (config.home_page?.content && config.home_page.content.includes('<')) {
      import('isomorphic-dompurify').then((module) => {
        const createDOMPurify = module.default
        const DOMPurify = createDOMPurify()
        setSanitizedHomeContent(DOMPurify.sanitize(config.home_page.content))
      })
    }
  }, [config.home_page?.content])

  return (
    <>
      <Head>
        <title>Signal-Moi - Plateforme de Signalement Citoyen</title>
        <meta name="description" content="Signalez les incidents dans votre quartier" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <main className="min-h-screen pt-16 bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute -inset-1 blur-3xl opacity-30 bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-200 transform rotate-6" />
          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">{config.home_page?.title || 'Signalez les incidents'}</h1>
                <p className="mt-4 text-xl text-gray-700 max-w-2xl">{config.home_page?.heroText || 'dans votre quartier'}</p>

                {config.home_page?.content && config.home_page.content.includes('<') ? (
                  <div className="mt-6 text-gray-700 max-w-xl" dangerouslySetInnerHTML={{ __html: sanitizedHomeContent }} />
                ) : (
                  <p className="mt-6 text-gray-600 max-w-xl">{config.home_page?.content || 'Une plateforme citoyenne pour signaler et suivre les problemes de votre communaute.'}</p>
                )}

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                  <Link href={user ? "/citizen/signalement" : "/login"}>
                    <Button size="lg" variant="danger" className="px-8 py-3 shadow-lg">🚨 Faire un signalement</Button>
                  </Link>

                  <Link href={user ? "/citizen/dashboard" : "/register"}>
                    <button className="px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-800 hover:shadow transition font-semibold">{user ? '✓ Mon dashboard' : '👥 Rejoindre'}</button>
                  </Link>
                </div>

                {showInstallButton && (
                  <div className="mt-4 text-sm text-gray-600">
                    <button onClick={handleInstall} className="underline text-indigo-600">Installer l'application mobile</button>
                  </div>
                )}
              </div>

              <div className="md:w-1/2">
                <div className="bg-white rounded-2xl shadow-2xl p-6">
                  <div className="w-full h-64 rounded-xl overflow-hidden">
                    <iframe title="Carte aperçu" src="https://www.openstreetmap.org/export/embed.html?bbox=2.2137%2C46.2276%2C2.2137%2C46.2276&layer=mapnik&marker=46.2276%2C2.2137" className="w-full h-full" style={{ border: 0 }} />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">Aperçu interactif — zoomer et cliquer pour ouvrir la carte complète.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Comment ça marche</h2>
            <p className="text-gray-600 mt-3">5 étapes simples pour signaler et suivre un problème dans votre quartier</p>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { icon: '1', title: 'Créer un compte', text: 'Inscrivez-vous ou connectez-vous' },
                { icon: '2', title: 'Décrire', text: 'Expliquez l’incident et choisissez un type' },
                { icon: '📷', title: 'Preuves', text: 'Joignez photos/vidéos pour étayer' },
                { icon: '📍', title: 'Localiser', text: 'Précisez l’adresse ou le quartier' },
                { icon: '5', title: 'Suivre', text: 'Recevez des mises à jour' }
              ].map((step, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition text-center">
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white mx-auto flex items-center justify-center text-xl font-bold mb-4">{step.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href={user ? "/citizen/signalement" : "/login"}>
                <Button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition" size="md">Commencer maintenant →</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Gallery */}
        {(config.home_page?.images?.length > 0 || config.home_page?.videos?.length > 0) && (
          <section className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Galerie</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {config.home_page?.images?.map((img, idx) => (
                  <img key={idx} src={img} alt={`Galerie ${idx}`} className="w-full h-52 object-cover rounded-lg shadow" />
                ))}
                {config.home_page?.videos?.map((vid, idx) => (
                  <iframe key={`v-${idx}`} src={vid} className="w-full h-52 rounded-lg" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Collaborator campaigns */}
        {collaboratorCampaigns.length > 0 && (
          <section className="py-12">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Campagnes des collaborateurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {collaboratorCampaigns.map(c => (
                  <div key={c.id} className="rounded-xl shadow overflow-hidden bg-white">
                    {c.image_url ? (
                      <img src={getImageUrl(c.image_url)} alt={c.titre} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400">Pas d'image</div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{c.titre}</h3>
                      <p className="text-sm text-gray-600 mb-3">{c.description?.slice(0, 140)}</p>
                      <Link href={`/campagnes`}>
                        <a className="text-indigo-600 font-medium">Voir la campagne →</a>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Community CTA */}
        <section className="py-16 bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Rejoignez notre communauté</h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">Des milliers de citoyens engagés améliorent déjà leur quartier ensemble.</p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href={user ? "/citizen/dashboard" : "/register"}>
                <button className="bg-white text-teal-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition">{user ? "✓ Aller au dashboard" : "👥 Rejoindre maintenant"}</button>
              </Link>
              <Link href="/signalements">
                <button className="bg-teal-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-800 transition border-2 border-white">📊 Voir les signalements</button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}