'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'
import { Button } from '../components/ui'
import BlogCard from '../components/BlogCard'
import Chatbot from '../components/Chatbot'

export default function Home() {

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
  const { user } = useAuth()

  const [config, setConfig] = useState({ home_page: {} })
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  const [collaboratorCampaigns, setCollaboratorCampaigns] = useState([])

  const features = [
    { title: 'Signalement simple', text: 'Décrivez l’incident, joignez vos preuves et envoyez en quelques clics.', icon: '🚨' },
    { title: 'Suivi clair', text: 'Recevez des mises à jour et gardez une vue complète des dossiers ouverts.', icon: '📊' },
    { title: 'Impact local', text: 'Aidez votre quartier à agir plus vite grâce à une communauté mobilisée.', icon: '🌍' },
  ]

  // Blog posts data
  const posts = [
    { icon: '🎯', title: 'Lancer une Campagne de Sensibilisation Efficace', excerpt: "Découvrez les meilleures pratiques pour créer une campagne qui engage votre communauté et génère le changement.", date: '01/06/2026', author: 'Équipe Signal-Moi', href: '/blog/lancer-campagne', category: 'Guides' },
    { icon: '🔒', title: 'Comment Signaler un Problème de Sécurité Publique', excerpt: 'Un guide complet pour faire un signalement efficace avec photos, localisation et descriptions détaillées.', date: '28/05/2026', author: 'Équipe Signal-Moi', href: '/blog/signaler-securite', category: 'Tutoriels' },
    { icon: '💬', title: 'Témoignage : Comment Signal-Moi a Changé Notre Quartier', excerpt: "Les habitants d'un quartier partagent comment la plateforme a permis de résoudre des problèmes locaux importants.", date: '25/05/2026', author: 'Communauté', href: '/blog/temoignage-quartier', category: 'Témoignages' },
    { icon: '⭐', title: 'Les Dix Signalements Les Plus Impactants de 2025', excerpt: 'Découvrez les signalements qui ont changé les choses dans les communautés à travers le pays.', date: '20/05/2026', author: 'Équipe Signal-Moi', href: '/blog/top-signalements-2025', category: 'Actualités' },
    { icon: '🔐', title: 'Protéger Votre Vie Privée sur Signal-Moi', excerpt: "Conseils pratiques pour maintenir votre confidentialité tout en contribuant à l'amélioration de votre communauté.", date: '10/05/2026', author: 'Équipe Signal-Moi', href: '/blog/proteger-vie-privee', category: 'Sécurité' }
  ]

  const [activeFilter, setActiveFilter] = useState('Tous')

  const filteredPosts = activeFilter === 'Tous' ? posts : posts.filter(p => p.category === activeFilter)
  const slideshowImages = Array.isArray(config.home_page?.images) ? config.home_page.images.filter(Boolean) : []
  const slideshowVideos = Array.isArray(config.home_page?.videos) ? config.home_page.videos.filter(Boolean) : []

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
    if (!slideshowImages.length) return
    const id = setInterval(() => {
      setSlideIndex((s) => (s + 1) % slideshowImages.length)
    }, 5000)
    return () => clearInterval(id)
  }, [slideshowImages.length])

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/site-config`)
      if (res.ok) {
        const data = await res.json()
        const parsedHomePage = typeof data.home_page === 'string' ? JSON.parse(data.home_page) : (data.home_page || {})
        const homePage = {
          ...parsedHomePage,
          images: Array.isArray(parsedHomePage.images) ? parsedHomePage.images.filter(Boolean) : [],
          videos: Array.isArray(parsedHomePage.videos) ? parsedHomePage.videos.filter(Boolean) : []
        }
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
        {slideshowImages.length > 0 && (
          <link rel="preload" as="image" href={getImageUrl(slideshowImages[0])} />
        )}
      </Head>

      <main className="min-h-screen pt-16 bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#2563eb_100%)] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.25),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_25%)]" />
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
            <div className="grid items-center gap-8 lg:gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="text-center lg:text-left max-w-2xl">
                <span className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-100 shadow-lg">
                  <img src={getImageUrl(config.logoUrl)} alt="Logo Signal-Moi" className="h-6 w-6 rounded-md object-cover ring-1 ring-white/10" />
                  Signal-Moi
                </span>
                <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white drop-shadow-lg">{config.home_page?.title || 'Ensemble pour une Communauté Plus Sûre'}</h1>
                <p className="mt-4 text-xl md:text-2xl text-slate-100 max-w-2xl">{config.home_page?.heroText || 'Signalez les incidents de votre quartier et engagez le dialogue avec les autorités locales'}</p>

                {config.home_page?.content && config.home_page.content.includes('<') ? (
                  <div className="mt-6 text-slate-200 max-w-xl" dangerouslySetInnerHTML={{ __html: sanitizedHomeContent }} />
                ) : (
                  <p className="mt-6 text-slate-200 max-w-xl">{config.home_page?.content || 'Signal-Moi est une plateforme citoyenne d\'engagement communautaire. Signalez les problèmes de sécurité publique, lancez des campagnes de sensibilisation et contribuez à l\'amélioration de votre quartier.'}</p>
                )}

                {showInstallButton && (
                  <div className="mt-5 text-sm text-slate-100">
                    <button onClick={handleInstall} className="underline decoration-cyan-200 underline-offset-4">Installer l'application mobile</button>
                  </div>
                )}
              </div>

              <div className="flex justify-center lg:justify-end w-full">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl w-full max-w-2xl">
                  <div className="rounded-2xl overflow-hidden border border-white/10 relative bg-black/5">
                    {slideshowImages.length > 0 ? (
                      <>
                        <div className="relative w-full h-80 sm:h-96">
                          <Image
                            src={getImageUrl(slideshowImages[slideIndex])}
                            alt={`Slide ${slideIndex + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 700px"
                            className="object-cover transition-transform duration-700 ease-in-out transform hover:scale-105"
                          />
                        </div>
                        <button
                          onClick={() => setSlideIndex((s) => (s - 1 + slideshowImages.length) % slideshowImages.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
                          aria-label="Précédent"
                        >‹</button>
                        <button
                          onClick={() => setSlideIndex((s) => (s + 1) % slideshowImages.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
                          aria-label="Suivant"
                        >›</button>
                      </>
                    ) : (
                      <iframe title="Carte aperçu" src="https://www.openstreetmap.org/export/embed.html?bbox=2.2137%2C46.2276%2C2.2137%2C46.2276&layer=mapnik&marker=46.2276%2C2.2137" className="w-full h-72" style={{ border: 0 }} />
                    )}
                  </div>
                  {slideshowImages.length > 0 ? (
                    <div className="mt-4 flex items-center justify-center gap-3">
                      {slideshowImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSlideIndex(i)}
                          aria-label={`Aller au slide ${i + 1}`}
                          className={`w-3 h-3 rounded-full ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-xl transition flex flex-col items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
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

        {/* Blog */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Blog Signal-Moi</h2>
                <p className="text-sm text-gray-600">Actualités, guides pratiques et témoignages de notre communauté</p>
              </div>
              <div className="flex gap-2 items-center text-sm text-gray-500">
                <span className="hidden sm:inline">Filtrer :</span>
                <div className="flex gap-1">
                  {['Tous','Guides','Tutoriels','Témoignages','Actualités','Sécurité'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-3 py-1 rounded-full text-sm ${activeFilter === tab ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-700 hover:bg-indigo-50'}`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredPosts.slice(0,3).map((p) => (
                <BlogCard key={p.href} {...p} />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.slice(3,5).map((p) => (
                <BlogCard key={p.href} {...p} />
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">Recevez nos Actualités — Abonnez-vous à notre newsletter pour rester informé des dernières actualités et guides</p>
              <div className="mt-4 flex justify-center">
                <Link href="/newsletter">
                  <Button size="md" className="bg-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-indigo-700">S'abonner</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Collaborator campaigns */}
        {collaboratorCampaigns.length > 0 && (
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Campagnes des collaborateurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {collaboratorCampaigns.map(c => (
                  <div key={c.id} className="rounded-xl shadow overflow-hidden bg-white">
                    {c.image_url ? (
                      <img src={getImageUrl(c.image_url)} alt={c.titre} loading="lazy" decoding="async" className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400">Pas d'image</div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{c.titre}</h3>
                      <p className="text-sm text-gray-600 mb-3">{c.description?.slice(0, 140)}</p>
                      <Link href="/campagnes" className="text-indigo-600 font-medium">Voir la campagne →</Link>
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
      <Chatbot />
    </>
  )
}