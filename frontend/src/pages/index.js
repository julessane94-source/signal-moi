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

  const getImageUrl = (url, { preferApi = false } = {}) => {
    if (!url) return '/icons/icon-192x192.png'
    if (url.startsWith('data:')) return url

    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url)
        if (parsed.pathname.startsWith('/uploads/')) {
          return `${API_BASE}${parsed.pathname}${parsed.search || ''}`
        }
        return url
      } catch (err) {
        return '/icons/icon-192x192.png'
      }
    }

    if (url.startsWith('/uploads/')) return `${API_BASE}${url}`
    if (url.startsWith('uploads/')) return `${API_BASE}/${url}`
    return url
  }

  const handleImageFallback = (event, originalUrl) => {
    const current = event.currentTarget
    const apiUrl = getImageUrl(originalUrl, { preferApi: true })
    if (current.src !== apiUrl && !originalUrl?.startsWith('data:')) {
      current.src = apiUrl
    } else {
      current.src = '/icons/icon-192x192.png'
    }
  }
  const { user } = useAuth()

  const [config, setConfig] = useState({ home_page: {} })
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)

  const [collaboratorCampaigns, setCollaboratorCampaigns] = useState([])

  const features = [
    { title: 'Alerter rapidement', text: 'Un formulaire court, une localisation claire et des preuves envoyées aux bons acteurs.', icon: '01' },
    { title: 'Coordonner les réponses', text: 'Police, collaborateurs et administrateurs suivent les cas depuis des espaces dédiés.', icon: '02' },
    { title: 'Mesurer l’impact', text: 'Les statistiques aident à prioriser les quartiers, les types d’incidents et les actions.', icon: '03' },
  ]

  const localStats = [
    { label: 'Zone pilote', value: 'Sédhiou' },
    { label: 'Signalement', value: '24h/24' },
    { label: 'Preuves', value: 'Photo vidéo' }
  ]

  const actionCards = [
    { title: 'Citoyens', text: 'Déclarer un incident, ajouter une preuve et suivre son évolution.', href: user ? '/citizen/signalement' : '/login' },
    { title: 'Forces de l’ordre', text: 'Accès réservé aux comptes autorisés par l’administration.', restricted: true },
    { title: 'Collaborateurs', text: 'Accès réservé aux partenaires validés par l’administration.', restricted: true }
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

  return (
    <>
      <Head>
        <title>Signal-Moi - Plateforme de Signalement Citoyen</title>
        <meta name="description" content="Signal-Moi est une plateforme citoyenne de signalement à Sédhiou, Sénégal: alertes, GPS, preuves, suivi police, collaborateurs et campagnes." />
        <meta name="keywords" content="Signal-Moi, signalement citoyen, Sédhiou, Sénégal, sécurité, police, alerte GPS, signal-moi.sn" />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href="https://signal-moi.sn/" />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://signal-moi.sn/" />
        <meta property="og:title" content="Signal-Moi - Plateforme de Signalement Citoyen" />
        <meta property="og:description" content="Signaler, localiser et suivre les incidents citoyens à Sédhiou avec Signal-Moi." />
        <meta property="og:image" content="https://signal-moi.sn/icons/icon-512x512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        {slideshowImages.length > 0 && (
          <link rel="preload" as="image" href={getImageUrl(slideshowImages[0])} />
        )}
      </Head>

      <main className="home-page min-h-screen overflow-x-hidden bg-slate-50 pt-16">
        <section className="page-hero-animated relative overflow-hidden bg-slate-950 text-white">
          {slideshowImages.length > 0 && (
            <Image
              key={`hero-bg-${slideIndex}`}
              src={getImageUrl(slideshowImages[slideIndex], { preferApi: true })}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-75"
              priority={slideIndex === 0}
            />
          )}
          <div className="absolute inset-0 bg-slate-950/35" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.58)_48%,rgba(2,6,23,0.22)_100%)]" />
          <div className="home-container relative py-14 sm:py-16 lg:py-24">
            <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:gap-16">
              <div className="hero-copy-enter min-w-0 max-w-3xl">
                <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-50 backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.2em]">
                  <img src={getImageUrl(config.logoUrl)} alt="Logo Signal-Moi" className="h-7 w-7 rounded object-cover" />
                  <span className="truncate">Signal-Moi Sédhiou</span>
                </div>
                <h1 className="mt-6 max-w-full break-words text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  {config.home_page?.title || 'Un signalement clair pour une réponse plus rapide'}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                  {config.home_page?.heroText || 'Aidez les quartiers de Sédhiou à remonter les urgences, les preuves et les besoins de terrain aux équipes concernées.'}
                </p>

                <div className="mt-9 flex max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link href={user ? "/citizen/signalement" : "/login"} className="min-w-0">
                  <Button className="w-full rounded-2xl bg-emerald-400 px-7 py-3 font-bold text-slate-950 shadow-lg shadow-emerald-400/20 hover:bg-emerald-300 transition sm:w-auto" size="md">Faire un signalement</Button>
                  </Link>
                  <Link href="/signalements" className="min-w-0">
                    <Button className="w-full rounded-2xl border border-white/25 bg-white/10 px-7 py-3 font-semibold text-white hover:bg-white/15 transition sm:w-auto" size="md">Voir les signalements</Button>
                  </Link>
                </div>

                {showInstallButton && (
                  <button onClick={handleInstall} className="mt-5 text-sm font-semibold text-emerald-200 underline underline-offset-4">
                    Installer l'application
                  </button>
                )}

                <div className="mt-10 grid max-w-2xl grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] backdrop-blur sm:grid-cols-3">
                  {localStats.map((item) => (
                    <div key={item.label} className="min-w-0 border-white/10 p-4 sm:border-r last:border-0">
                      <p className="text-lg font-bold text-white sm:text-xl">{item.value}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hero-visual-float min-w-0 w-full">
                <div className="hero-slideshow overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur transition duration-500 hover:shadow-emerald-400/20">
                  {slideshowImages.length > 0 ? (
                    <div className="relative">
                      <div className="relative h-[340px] w-full overflow-hidden rounded-[1.45rem] bg-slate-950 sm:h-[440px]">
                        <Image
                          src={getImageUrl(slideshowImages[slideIndex], { preferApi: true })}
                          alt={`Aperçu Signal-Moi ${slideIndex + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 620px"
                          className="object-contain"
                          priority={slideIndex === 0}
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.18)]" />
                          En images
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                          <div>
                            <p className="text-xs font-medium text-emerald-200">Signal-Moi sur le terrain</p>
                            <p className="mt-1 text-sm font-bold sm:text-base">Découvrez les actions de la communauté</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-md">{slideIndex + 1} / {slideshowImages.length}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSlideIndex((s) => (s - 1 + slideshowImages.length) % slideshowImages.length)}
                        className="slideshow-arrow absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-2xl text-white backdrop-blur-md"
                        aria-label="Précédent"
                      >‹</button>
                      <button
                        onClick={() => setSlideIndex((s) => (s + 1) % slideshowImages.length)}
                        className="slideshow-arrow absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-2xl text-white backdrop-blur-md"
                        aria-label="Suivant"
                      >›</button>
                    </div>
                  ) : (
                    <iframe title="Carte de Sédhiou" src="https://www.openstreetmap.org/export/embed.html?bbox=-15.62%2C12.66%2C-15.49%2C12.75&layer=mapnik&marker=12.7081%2C-15.5569" className="h-[420px] w-full rounded-[1.45rem]" style={{ border: 0 }} />
                  )}
                </div>
                {slideshowImages.length > 0 && (
                  <div className="slideshow-thumbnails mt-4 flex justify-center gap-2">
                    {slideshowImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        aria-label={`Aller au slide ${i + 1}`}
                        className={`relative h-2.5 overflow-hidden rounded-full transition-all duration-300 ${i === slideIndex ? 'w-10 bg-emerald-300' : 'w-2.5 bg-white/35 hover:bg-white/70'}`}
                      >
                        {i === slideIndex && <span className="slideshow-progress absolute inset-y-0 left-0 bg-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="home-section bg-white">
          <div className="home-container">
            <div className="home-panel grid items-center gap-6 border-emerald-200 bg-emerald-50/80 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
              <div>
                <p className="home-eyebrow text-emerald-700">Application mobile</p>
                <h2 className="home-title mt-3">Télécharger Signal-Moi sur téléphone</h2>
                <p className="home-copy mt-3 max-w-2xl text-slate-700">
                  Installez l'application depuis votre navigateur pour signaler plus vite, partager la position GPS et lancer un live en cas d'urgence.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
                <a
                  href="/downloads/signal-moi.apk?v=1.0.8"
                  download
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-400 px-6 py-3 font-bold text-slate-950 shadow-sm transition hover:bg-emerald-300 sm:w-auto"
                >
                  Télécharger l&apos;APK Android
                </a>
                {showInstallButton && (
                  <button onClick={handleInstall} className="min-h-[48px] bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">
                    Installer la version web
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="home-section border-b border-slate-200 bg-white">
          <div className="home-container">
            <div className="card-stagger grid gap-5 md:grid-cols-3">
              {actionCards.map((item, index) => (
                item.restricted ? (
                  <article key={item.title} style={{ '--card-index': index }} className="home-panel interactive-card border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{item.title}</p>
                    <p className="mt-3 text-lg font-bold text-slate-950">{item.text}</p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-500">Acces securise</span>
                  </article>
                ) : (
                  <Link key={item.title} href={item.href} style={{ '--card-index': index }} className="home-panel interactive-card group border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:bg-emerald-50">
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{item.title}</p>
                    <p className="mt-3 text-lg font-bold text-slate-950 group-hover:text-emerald-900">{item.text}</p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-700">Ouvrir →</span>
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>

        <section className="home-section bg-slate-50">
          <div className="home-container">
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="min-w-0">
                <p className="home-eyebrow text-emerald-700">Pourquoi Signal-Moi</p>
                <h2 className="home-title mt-3">Une plateforme structurée pour agir localement.</h2>
                <p className="home-copy mt-4">Chaque signalement rassemble les informations utiles: description, localisation, pièces jointes et suivi. Les équipes peuvent alors prioriser sans perdre de temps.</p>
              </div>
              <div className="card-stagger grid min-w-0 gap-4 md:grid-cols-3">
                {features.map((feature, index) => (
                  <article key={feature.title} style={{ '--card-index': index }} className="home-panel interactive-card border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-black text-emerald-700">{feature.icon}</div>
                    <h3 className="mt-4 text-lg font-bold text-slate-950">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="home-section bg-white">
          <div className="home-container">
            <div className="grid min-w-0 gap-8 lg:grid-cols-2">
              <div className="home-panel min-w-0 border-slate-200 p-6 sm:p-8">
                <p className="home-eyebrow text-slate-500">Parcours citoyen</p>
                <h2 className="home-title mt-3 text-2xl">Signaler en moins de quelques minutes</h2>
                <div className="mt-6 space-y-4">
                  {['Choisir le type d’incident', 'Décrire ce qui se passe', 'Ajouter une photo, vidéo ou un live', 'Confirmer la localisation à Sédhiou', 'Suivre le traitement du dossier'].map((step, index) => (
                    <div key={step} className="flex gap-4 border-t border-slate-100 pt-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                      <p className="font-medium text-slate-800">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="home-panel min-w-0 border-emerald-200 bg-emerald-50 p-6 sm:p-8">
                <p className="home-eyebrow text-emerald-700">Priorités locales</p>
                <h2 className="home-title mt-3 text-2xl">Des données utiles pour Sédhiou</h2>
                <p className="home-copy mt-4 text-slate-700">Les tableaux de bord aident à repérer les zones récurrentes, les urgences de sécurité et les besoins d’intervention. Les statistiques d’âge ignorent les profils sans date de naissance afin de garder des analyses propres.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {['Sécurité publique', 'Voirie et éclairage', 'Incidents urgents', 'Actions communautaires'].map((item) => (
                    <div key={item} className="border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog */}
        <section className="home-section bg-slate-50">
          <div className="home-container">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="home-title text-2xl">Blog Signal-Moi</h2>
                <p className="home-copy mt-1 text-sm">Actualités, guides pratiques et témoignages de notre communauté</p>
              </div>
              <div className="flex min-w-0 flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center">
                <span className="hidden sm:inline">Filtrer :</span>
                <div className="flex flex-wrap gap-1">
                  {['Tous','Guides','Tutoriels','Témoignages','Actualités','Sécurité'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activeFilter === tab ? 'bg-emerald-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50'}`}>
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
                  <Button size="md" className="bg-emerald-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-emerald-700">S'abonner</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Collaborator campaigns */}
        {collaboratorCampaigns.length > 0 && (
          <section className="home-section bg-white">
            <div className="home-container">
              <h2 className="home-title mb-8 text-center text-2xl">Campagnes des collaborateurs</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {collaboratorCampaigns.map(c => (
                  <div key={c.id} className="home-panel interactive-card overflow-hidden bg-white">
                    {c.image_url ? (
                      <img src={getImageUrl(c.image_url)} onError={(event) => handleImageFallback(event, c.image_url)} alt={c.titre} loading="lazy" decoding="async" className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400">Pas d'image</div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{c.titre}</h3>
                      <p className="text-sm text-gray-600 mb-3">{c.description?.slice(0, 140)}</p>
                      <Link href="/campagnes" className="text-emerald-700 font-medium">Voir la campagne →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Community CTA */}
        <section className="px-4 pb-6 pt-2 sm:px-6 sm:pb-10">
          <div className="home-container rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-12 text-center text-white shadow-xl sm:px-10 sm:py-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Rejoignez notre communauté</h2>
            <p className="mx-auto mb-8 mt-4 max-w-2xl text-base leading-7 text-emerald-50 sm:text-lg">Des milliers de citoyens engagés améliorent déjà leur quartier ensemble.</p>

            <div className="flex flex-col gap-4 md:flex-row md:justify-center">
              <Link href={user ? "/citizen/dashboard" : "/register"} className="min-w-0">
                <button className="w-full rounded-xl bg-white px-6 py-3 font-semibold text-teal-600 transition hover:bg-gray-100 md:w-auto">{user ? "✓ Aller au dashboard" : "👥 Rejoindre maintenant"}</button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Chatbot />
    </>
  )
}

