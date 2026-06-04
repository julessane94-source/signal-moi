'use client'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'
import { Button } from '../components/ui'

const getImageUrl = (url) => {
  if (!url) return '/icons/icon-192x192.png'
  if (url.startsWith('data:')) return url

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      if (parsed.pathname.startsWith('/uploads/')) return `${API_BASE}${parsed.pathname}`
      return parsed.pathname || '/icons/icon-192x192.png'
    } catch (err) {
      return '/icons/icon-192x192.png'
    }
  }

  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`
  return url
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

  const stats = [
    { label: 'Incidents suivis', value: '100% transparent', icon: '📍' },
    { label: 'Mises à jour', value: 'Suivi en temps réel', icon: '⚡' },
    { label: 'Citoyens engagés', value: 'Communauté locale active', icon: '🤝' },
  ]

  const features = [
    { title: 'Signalement simple', text: 'Décrivez l’incident, joignez vos preuves et envoyez en quelques clics.', icon: '🚨' },
    { title: 'Suivi clair', text: 'Recevez des mises à jour et gardez une vue complète des dossiers ouverts.', icon: '📊' },
    { title: 'Impact local', text: 'Aidez votre quartier à agir plus vite grâce à une communauté mobilisée.', icon: '🌍' },
  ]

  useEffect(() => {
    // PWA Installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    })
    
    fetchConfig()
  }, [])

  // Slideshow state for hero right column
  const [slideIndex, setSlideIndex] = useState(0)
  useEffect(() => {
    if (!config.home_page?.images || config.home_page.images.length === 0) return
    const id = setInterval(() => {
      setSlideIndex((s) => (s + 1) % config.home_page.images.length)
    }, 5000)
    return () => clearInterval(id)
  }, [config.home_page?.images])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/site-config`)
      if (res.ok) {
        const data = await res.json()
        const homePage = typeof data.home_page === 'string' ? JSON.parse(data.home_page) : (data.home_page || config.home_page)
        setConfig({
          ...data,
          logoUrl: data.logoUrl || data.logo_url || '/icons/icon-192x192.png',
          home_page: homePage
        })
        if (Array.isArray(data.collaboratorCampaigns)) setCollaboratorCampaigns(data.collaboratorCampaigns)
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
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#2563eb_100%)] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.25),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_25%)]" />
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="text-center lg:text-left">
                <span className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100 shadow-lg">
                  <img src={getImageUrl(config.logoUrl)} alt="Logo Signal-Moi" className="h-6 w-6 rounded-md object-cover ring-1 ring-white/10" />
                  Signal-Moi
                </span>
                <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white">{config.home_page?.title || 'Signalez les incidents'}</h1>
                <p className="mt-4 text-xl md:text-2xl text-slate-100 max-w-2xl">{config.home_page?.heroText || 'dans votre quartier'}</p>

                {config.home_page?.content && config.home_page.content.includes('<') ? (
                  <div className="mt-6 text-slate-200 max-w-xl" dangerouslySetInnerHTML={{ __html: sanitizedHomeContent }} />
                ) : (
                  <p className="mt-6 text-slate-200 max-w-xl">{config.home_page?.content || 'Une plateforme citoyenne pour signaler et suivre les problemes de votre communaute.'}</p>
                )}

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 lg:justify-start justify-center">
                  <Link href={user ? "/citizen/signalement" : "/login"}>
                    <Button size="lg" variant="danger" className="px-8 py-3 shadow-xl">🚨 Faire un signalement</Button>
                  </Link>
                  <Link href={user ? "/citizen/dashboard" : "/register"}>
                    <button className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition font-semibold shadow-lg">{user ? '✓ Mon dashboard' : '👥 Rejoindre'}</button>
                  </Link>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">{stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-md">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-200">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                  </div>
                ))}</div>

                {showInstallButton && (
                  <div className="mt-5 text-sm text-slate-100">
                    <button onClick={handleInstall} className="underline decoration-cyan-200 underline-offset-4">Installer l'application mobile</button>
                  </div>
                )}
              </div>

              <div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
                  <div className="rounded-3xl overflow-hidden border border-white/10 shadow-soft relative">
                    {Array.isArray(config.home_page?.images) && config.home_page.images.length > 0 ? (
                      <>
                        <img
                          src={getImageUrl(config.home_page.images[slideIndex])}
                          alt={`Slide ${slideIndex + 1}`}
                          className="w-full h-72 object-cover block"
                        />
                        <button
                          onClick={() => setSlideIndex((s) => (s - 1 + config.home_page.images.length) % config.home_page.images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                          aria-label="Précédent"
                        >‹</button>
                        <button
                          onClick={() => setSlideIndex((s) => (s + 1) % config.home_page.images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full"
                          aria-label="Suivant"
                        >›</button>
                      </>
                    ) : (
                      <iframe title="Carte aperçu" src="https://www.openstreetmap.org/export/embed.html?bbox=2.2137%2C46.2276%2C2.2137%2C46.2276&layer=mapnik&marker=46.2276%2C2.2137" className="w-full h-72" style={{ border: 0 }} />
                    )}
                  </div>
                  {Array.isArray(config.home_page?.images) && config.home_page.images.length > 0 ? (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {config.home_page.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSlideIndex(i)}
                          aria-label={`Aller au slide ${i + 1}`}
                          className={`w-2 h-2 rounded-full ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl bg-slate-950/30 p-4 text-sm text-slate-100">Aperçu interactif — la carte complète vous aide à situer l’incident rapidement.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-1 hover:shadow-xl transition">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-10 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-600 font-semibold">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3">5 étapes simples pour agir rapidement</h2>
            <p className="text-gray-600 mt-3 max-w-3xl mx-auto">Une expérience pensée pour que chaque citoyen puisse signaler, suivre et faire évoluer les problèmes de son quartier en un instant.</p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { icon: '1', title: 'Créer un compte', text: 'Inscrivez-vous ou connectez-vous rapidement.' },
                { icon: '2', title: 'Décrire', text: 'Expliquez l’incident et choisissez sa catégorie.' },
                { icon: '📷', title: 'Preuves', text: 'Joignez photos, vidéos ou documents utiles.' },
                { icon: '📍', title: 'Localiser', text: 'Précisez l’adresse ou le quartier concerné.' },
                { icon: '5', title: 'Suivre', text: 'Recevez des mises à jour et suivez l’avancement.' }
              ].map((step, i) => (
                <article key={i} className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-indigo-50 p-4 shadow-sm hover:shadow-xl transition text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white mx-auto flex items-center justify-center text-lg font-bold mb-2 shadow-lg">{step.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-600">{step.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Link href={user ? "/citizen/signalement" : "/login"}>
                <Button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition" size="md">Commencer maintenant →</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Gallery */}
        {(config.home_page?.images?.length > 0 || config.home_page?.videos?.length > 0) && (
          <section className="py-8 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Galerie</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Campagnes des collaborateurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <section className="py-10 bg-gradient-to-r from-green-500 to-teal-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
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