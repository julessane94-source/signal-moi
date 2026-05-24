import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'

export default function Home() {
  const { user } = useAuth()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // PWA Installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    })
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallButton(false)
    }
    setDeferredPrompt(null)
  }

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
              Signalez les incidents
            </h1>
            <h2 className="text-4xl font-bold text-indigo-600 mb-6">
              dans votre quartier
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Une plateforme citoyenne pour signaler et suivre les problemes de votre communaute.
            </p>
            
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

        {/* Features et reste de la page... */}
      </main>

      <Footer />
    </>
  )
}