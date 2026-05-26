'use client'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'

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

      <Navbar />

      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {config.home_page?.title || 'Signalez les incidents'}
            </h1>
            <h2 className="text-4xl font-bold text-indigo-600 mb-6">
              {config.home_page?.heroText || 'dans votre quartier'}
            </h2>
            {config.home_page?.content && config.home_page.content.includes('<') ? (
              <div 
                className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
                dangerouslySetInnerHTML={{ __html: sanitizedHomeContent }}
              />
            ) : (
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                {config.home_page?.content || 'Une plateforme citoyenne pour signaler et suivre les problemes de votre communaute.'}
              </p>
            )}
            
            {/* Bouton d'installation PWA */}
            {showInstallButton && (
              <div className="mb-6">
                <button
                  onClick={handleInstall}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg inline-flex items-center gap-2"
                >
                  📱 Télécharger l'application mobile
                </button>
                <p className="text-sm text-gray-500 mt-2">Installez l'application sur votre telephone</p>
              </div>
            )}

            <Link href={user ? "/citizen/signalement" : "/login"}>
              <button className="bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-red-700 transition shadow-lg">
                🚨 Faire un signalement
              </button>
            </Link>
          </div>
        </section>
        {/* Carte libre intégrée */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Carte des signalements (aperçu)</h2>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <iframe
                title="Carte Signal-Moi"
                src="https://www.openstreetmap.org/export/embed.html?bbox=2.2137%2C46.2276%2C2.2137%2C46.2276&layer=mapnik&marker=46.2276%2C2.2137"
                className="w-full h-96"
                style={{ border: 0 }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-3 text-center">La carte est un aperçu libre; cliquez pour ouvrir OpenStreetMap et localiser précisément.</p>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-16 bg-indigo-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Comment ça marche ?</h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              5 étapes simples pour améliorer votre quartier
            </p>
            
            <div className="grid md:grid-cols-5 gap-6">
              {/* Etape 1 */}
              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Créer un compte</h3>
                <p className="text-gray-600 text-sm">Inscrivez-vous gratuitement ou connectez-vous avec vos identifiants</p>
              </div>

              {/* Etape 2 */}
              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Décrire le problème</h3>
                <p className="text-gray-600 text-sm">Expliquez l'incident et choisissez un type (nid-de-poule, vol, vandalisme...)</p>
              </div>

              {/* Etape 3 */}
              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">📷</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ajouter des preuves</h3>
                <p className="text-gray-600 text-sm">Joignez des photos, vidéos ou audios pour plus de clarté</p>
              </div>

              {/* Etape 4 */}
              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">📍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Localiser</h3>
                <p className="text-gray-600 text-sm">Indiquez le quartier ou la localisation précise du problème</p>
              </div>

              {/* Etape 5 */}
              <div className="text-center">
                <div className="bg-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">5</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Suivre la résolution</h3>
                <p className="text-gray-600 text-sm">Recevez des mises à jour en temps réel sur le traitement</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href={user ? "/citizen/signalement" : "/login"}>
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
                  Commencer maintenant →
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Images et Vidéos de la page d'accueil */}
        {(config.home_page?.images?.length > 0 || config.home_page?.videos?.length > 0) && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              {config.home_page?.images?.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Galerie</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {config.home_page.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Galerie"
                        className="w-full h-64 object-cover rounded-lg shadow-md hover:shadow-lg transition"
                      />
                    ))}
                  </div>
                </div>
              )}
              {config.home_page?.videos?.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Vidéos</h2>
                  <div className="grid grid-cols-1 gap-6">
                    {config.home_page.videos.map((vid, idx) => (
                      <iframe
                        key={idx}
                        width="100%"
                        height="400"
                        src={vid}
                        frameBorder="0"
                        allowFullScreen
                        className="rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Features et reste de la page... */}
        {/* Campagnes des collaborateurs */}
        {collaboratorCampaigns.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Campagnes des collaborateurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaboratorCampaigns.map(c => (
                  <div key={c.id} className="rounded-lg shadow-lg overflow-hidden bg-white">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.titre} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">Pas d'image</div>
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

        {/* Rejoindre la communauté */}
        <section className="py-16 bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Rejoignez notre communauté</h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              Des milliers de citoyens engagés améliorent déjà leur quartier ensemble. 
              Chaque signalement compte et contribue à un changement positif.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur">
                <div className="text-4xl mb-3">🤝</div>
                <h3 className="text-xl font-semibold mb-2">Collaborer</h3>
                <p className="text-green-50">Travaillez avec des ONGs et autorités locales</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur">
                <div className="text-4xl mb-3">📢</div>
                <h3 className="text-xl font-semibold mb-2">Influencer</h3>
                <p className="text-green-50">Vos signalements créent un impact réel</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-xl font-semibold mb-2">Progresser</h3>
                <p className="text-green-50">Quartiers plus sûrs et mieux entretenus</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link href={user ? "/citizen/dashboard" : "/register"}>
                <button className="bg-white text-teal-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition">
                  {user ? "✓ Aller au dashboard" : "👥 Rejoindre maintenant"}
                </button>
              </Link>
              <Link href="/signalements">
                <button className="bg-teal-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-800 transition border-2 border-white">
                  📊 Voir les signalements
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}