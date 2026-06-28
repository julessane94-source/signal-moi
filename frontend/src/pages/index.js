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
        <meta name="description" content="Signalez les incidents dans votre quartier" />
        <link rel="manifest" href="/manifest.json" />
        {slideshowImages.length > 0 && (
          <link rel="preload" as="image" href={getImageUrl(slideshowImages[0])} />
        )}
      </Head>

      <main className="min-h-screen pt-16 bg-white">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          {slideshowImages.length > 0 && (
            <Image
              key={`hero-bg-${slideIndex}`}
              src={getImageUrl(slideshowImages[slideIndex])}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-45"
              priority={slideIndex === 0}
            />
          )}
          <div className="absolute inset-0 bg-slate-950/60" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.95)_0%,rgba(2,6,23,0.72)_46%,rgba(2,6,23,0.36)_100%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-3 border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
                  <img src={getImageUrl(config.logoUrl)} alt="Logo Signal-Moi" className="h-7 w-7 rounded object-cover" />
                  Signal-Moi Sédhiou
                </div>
                <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                  {config.home_page?.title || 'Un signalement clair pour une réponse plus rapide'}
                </h1>
                <p className="mt-5 text-lg md:text-xl text-slate-200 max-w-2xl">
                  {config.home_page?.heroText || 'Aidez les quartiers de Sédhiou à remonter les urgences, les preuves et les besoins de terrain aux équipes concernées.'}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={user ? "/citizen/signalement" : "/login"}>
                    <Button className="bg-emerald-500 text-slate-950 px-7 py-3 font-bold hover:bg-emerald-400 transition" size="md">Faire un signalement</Button>
                  </Link>
                  <Link href="/signalements">
                    <Button className="border border-white/25 bg-white/10 px-7 py-3 font-semibold text-white hover:bg-white/15 transition" size="md">Voir les signalements</Button>
                  </Link>
                </div>

                {showInstallButton && (
                  <button onClick={handleInstall} className="mt-5 text-sm font-semibold text-emerald-200 underline underline-offset-4">
                    Installer l'application
                  </button>
                )}

                <div className="mt-8 grid max-w-2xl grid-cols-3 border border-white/10 bg-white/5">
                  {localStats.map((item) => (
                    <div key={item.label} className="p-4">
                      <p className="text-xl font-black text-white">{item.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <div className="overflow-hidden border border-white/10 bg-white/10 shadow-2xl">
                  {slideshowImages.length > 0 ? (
                    <div className="relative">
                      <div className="relative h-[360px] w-full sm:h-[440px]">
                        <Image
                          src={getImageUrl(slideshowImages[slideIndex])}
                          alt={`Aperçu Signal-Moi ${slideIndex + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 620px"
                          className="object-cover"
                          priority={slideIndex === 0}
                        />
                      </div>
                      <button
                        onClick={() => setSlideIndex((s) => (s - 1 + slideshowImages.length) % slideshowImages.length)}
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-slate-950/70 text-2xl text-white"
                        aria-label="Précédent"
                      >‹</button>
                      <button
                        onClick={() => setSlideIndex((s) => (s + 1) % slideshowImages.length)}
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center bg-slate-950/70 text-2xl text-white"
                        aria-label="Suivant"
                      >›</button>
                    </div>
                  ) : (
                    <iframe title="Carte de Sédhiou" src="https://www.openstreetmap.org/export/embed.html?bbox=-15.62%2C12.66%2C-15.49%2C12.75&layer=mapnik&marker=12.7081%2C-15.5569" className="h-[420px] w-full" style={{ border: 0 }} />
                  )}
                </div>
                {slideshowImages.length > 0 && (
                  <div className="mt-4 flex justify-center gap-2">
                    {slideshowImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSlideIndex(i)}
                        aria-label={`Aller au slide ${i + 1}`}
                        className={`h-2.5 w-8 ${i === slideIndex ? 'bg-emerald-400' : 'bg-white/30'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {actionCards.map((item) => (
                item.restricted ? (
                  <article key={item.title} className="border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">{item.title}</p>
                    <p className="mt-3 text-lg font-bold text-slate-950">{item.text}</p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-500">Acces securise</span>
                  </article>
                ) : (
                  <Link key={item.title} href={item.href} className="group border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:bg-emerald-50">
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{item.title}</p>
                    <p className="mt-3 text-lg font-bold text-slate-950 group-hover:text-emerald-900">{item.text}</p>
                    <span className="mt-5 inline-block text-sm font-semibold text-slate-700">Ouvrir →</span>
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Pourquoi Signal-Moi</p>
                <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">Une plateforme structurée pour agir localement.</h2>
                <p className="mt-4 text-slate-600">Chaque signalement rassemble les informations utiles: description, localisation, pièces jointes et suivi. Les équipes peuvent alors prioriser sans perdre de temps.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {features.map((feature) => (
                  <article key={feature.title} className="border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-black text-emerald-700">{feature.icon}</div>
                    <h3 className="mt-4 text-lg font-bold text-slate-950">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="border border-slate-200 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Parcours citoyen</p>
                <h2 className="mt-3 text-2xl font-black text-slate-950">Signaler en moins de quelques minutes</h2>
                <div className="mt-6 space-y-4">
                  {['Choisir le type d’incident', 'Décrire ce qui se passe', 'Ajouter une photo, vidéo ou un live', 'Confirmer la localisation à Sédhiou', 'Suivre le traitement du dossier'].map((step, index) => (
                    <div key={step} className="flex gap-4 border-t border-slate-100 pt-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                      <p className="font-medium text-slate-800">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">Priorités locales</p>
                <h2 className="mt-3 text-2xl font-black text-slate-950">Des données utiles pour Sédhiou</h2>
                <p className="mt-4 text-slate-700">Les tableaux de bord aident à repérer les zones récurrentes, les urgences de sécurité et les besoins d’intervention. Les statistiques d’âge ignorent les profils sans date de naissance afin de garder des analyses propres.</p>
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

