import Head from 'next/head'
import Link from 'next/link'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import { useState, useEffect } from 'react'

export default function DownloadApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
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
        <title>Télécharger l'application - Signal-Moi</title>
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📱</div>
            <h1 className="text-3xl font-bold text-gray-900">Application mobile Signal-Moi</h1>
            <p className="text-gray-600 mt-2">Signalez les incidents directement depuis votre telephone</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-xl font-bold mb-4">Comment installer l'application ?</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">1</div>
                <div>
                  <h3 className="font-semibold">Sur Android (Chrome)</h3>
                  <p className="text-gray-600">Cliquez sur "Partager" puis "Ajouter a l'ecran d'accueil"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">2</div>
                <div>
                  <h3 className="font-semibold">Sur iPhone (Safari)</h3>
                  <p className="text-gray-600">Cliquez sur "Partager" puis "Sur l'ecran d'accueil"</p>
                </div>
              </div>
            </div>
          </div>

          {showInstallButton && (
            <div className="text-center">
              <button
                onClick={handleInstall}
                className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition shadow-lg text-lg"
              >
                📱 Installer l'application
              </button>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700">
              ← Retour a l'accueil
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}