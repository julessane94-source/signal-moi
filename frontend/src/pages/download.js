import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function DownloadApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [apkAvailable, setApkAvailable] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    fetch('/downloads/signal-moi.apk', { method: 'HEAD' })
      .then((response) => setApkAvailable(response.ok))
      .catch(() => setApkAvailable(false))

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowInstallButton(false)
    setDeferredPrompt(null)
  }

  return (
    <>
      <Head>
        <title>Télécharger l'application - Signal-Moi</title>
        <meta name="description" content="Installez l'application mobile Signal-Moi sur Android ou iPhone depuis signal-moi.sn." />
      </Head>

      <main className="min-h-screen bg-slate-50 pt-16">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <section className="border border-emerald-200 bg-white p-6 text-center shadow-sm md:p-10">
            <img src="/icons/icon-192x192.png" alt="Logo Signal-Moi" className="mx-auto h-20 w-20 rounded-2xl object-cover shadow" />
            <h1 className="mt-5 text-3xl font-black text-slate-950 md:text-4xl">Télécharger l'application Signal-Moi</h1>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Installez Signal-Moi sur votre téléphone pour signaler plus rapidement, partager votre GPS et suivre vos alertes.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              {showInstallButton ? (
                <button
                  onClick={handleInstall}
                  className="min-h-[52px] bg-emerald-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-700"
                >
                  Installer l'application
                </button>
              ) : (
                <a
                  href="/manifest.json"
                  className="min-h-[52px] bg-emerald-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-emerald-700"
                >
                  Application web installable
                </a>
              )}
              {apkAvailable ? (
                <a
                  href="/downloads/signal-moi.apk"
                  download
                  className="min-h-[52px] border border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Télécharger APK Android
                </a>
              ) : (
                <span className="min-h-[52px] border border-slate-200 bg-slate-100 px-7 py-3 font-bold text-slate-500">
                  APK Android bientôt disponible
                </span>
              )}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Si le fichier APK n'est pas encore publié, utilisez l'installation web depuis Chrome ou Safari.
            </p>
          </section>

          <section className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-black text-emerald-700">A</div>
              <h2 className="mt-4 text-xl font-black text-slate-950">Android</h2>
              <div className="mt-5 space-y-4">
                {['Ouvrir signal-moi.sn avec Chrome', 'Appuyer sur le menu du navigateur', 'Choisir Installer l’application ou Ajouter à l’écran d’accueil'].map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                    <p className="pt-1 text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-black text-blue-700">i</div>
              <h2 className="mt-4 text-xl font-black text-slate-950">iPhone</h2>
              <div className="mt-5 space-y-4">
                {['Ouvrir signal-moi.sn avec Safari', 'Appuyer sur Partager', 'Choisir Sur l’écran d’accueil'].map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                    <p className="pt-1 text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-8 text-center">
            <Link href="/" className="font-bold text-emerald-700 hover:text-emerald-800">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
