"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

const STORAGE_KEY = 'signal_moi_chat_history_v2'

const KNOWLEDGE = [
  {
    id: 'signalement',
    title: 'Faire un signalement',
    keywords: ['signalement', 'signaler', 'incident', 'probleme', 'plainte', 'danger', 'photo', 'video', 'preuve', 'localisation', 'gps'],
    answer: [
      'Pour faire un signalement, choisissez d abord le gros bouton qui ressemble au probleme.',
      'Ajoutez votre position ou un repere connu a Sedhiou.',
      'Ajoutez une photo, une video ou dictez votre description si vous ne voulez pas ecrire.',
      'Si c est urgent, la police peut recevoir le live en temps reel.'
    ],
    links: [{ label: 'Ouvrir le signalement', href: '/citizen/signalement' }]
  },
  {
    id: 'campagne',
    title: 'Campagnes',
    keywords: ['campagne', 'participer', 'inscrire', 'rejoindre', 'sensibilisation', 'activite'],
    answer: [
      'Les campagnes servent a organiser une action locale: sensibilisation, nettoyage, formation ou mobilisation.',
      'Un citoyen connecte peut ouvrir une campagne puis cliquer sur Participer.',
      'Les collaborateurs peuvent creer et suivre leurs campagnes depuis leur espace.'
    ],
    links: [{ label: 'Voir les campagnes', href: '/campagnes' }]
  },
  {
    id: 'compte',
    title: 'Compte et connexion',
    keywords: ['compte', 'connexion', 'connecter', 'inscription', 'inscrire', 'mot de passe', 'login', 'profil'],
    answer: [
      'Pour utiliser toutes les fonctions, connectez-vous avec votre email et votre mot de passe.',
      'Si vous n avez pas encore de compte, creez un compte citoyen.',
      'Le profil permet de modifier vos informations et votre mot de passe.'
    ],
    links: [{ label: 'Connexion', href: '/login' }, { label: 'Inscription', href: '/register' }]
  },
  {
    id: 'suivi',
    title: 'Suivre un dossier',
    keywords: ['suivi', 'statut', 'dossier', 'traitement', 'nouveau', 'en cours', 'traite', 'mes signalements'],
    answer: [
      'Dans votre espace citoyen, vous voyez vos signalements et leur statut.',
      'Nouveau signifie que le dossier est recu.',
      'En cours signifie qu une equipe travaille dessus.',
      'Traite signifie que le dossier a ete pris en charge.'
    ],
    links: [{ label: 'Espace citoyen', href: '/citizen/dashboard' }]
  },
  {
    id: 'police',
    title: 'Police et urgences',
    keywords: ['police', 'urgence', 'live', 'direct', 'securite', 'violence', 'vol', 'accident'],
    answer: [
      'Les alertes de securite comme violence, vol ou accident peuvent etre vues par la police.',
      'Pendant un live, la police peut voir les images et la localisation en temps reel.',
      'L espace police est reserve aux comptes autorises.'
    ],
    links: [{ label: 'Faire une alerte', href: '/citizen/signalement' }]
  },
  {
    id: 'collaborateur',
    title: 'Espace collaborateur',
    keywords: ['collaborateur', 'ong', 'association', 'statistique', 'rapport', 'export', 'plaidoyer'],
    answer: [
      'Le collaborateur peut creer des campagnes, suivre des dossiers et consulter les statistiques.',
      'Il peut telecharger les statistiques en PDF ou Excel pour ses rapports.',
      'Il peut aussi creer des plaidoyers pour mobiliser les citoyens.'
    ],
    links: [{ label: 'Espace collaborateur', href: '/collaborator/dashboard' }]
  },
  {
    id: 'admin',
    title: 'Administration',
    keywords: ['admin', 'administrateur', 'utilisateur', 'logo', 'statistiques', 'configuration', 'site'],
    answer: [
      'L administrateur gere les utilisateurs, le logo, les contenus du site et les statistiques completes.',
      'Les rapports statistiques peuvent etre telecharges avec le logo de la plateforme.',
      'Les comptes sensibles comme police et collaborateur doivent rester reserves aux personnes autorisees.'
    ],
    links: [{ label: 'Administration', href: '/admin/dashboard' }]
  },
  {
    id: 'don',
    title: 'Dons et paiements',
    keywords: ['don', 'payer', 'paiement', 'wave', 'orange', 'money', 'soutenir'],
    answer: [
      'La page Don permet de soutenir la plateforme.',
      'Wave et Orange Money peuvent etre proposes selon les moyens de paiement configures.',
      'Ne partagez jamais votre code secret dans le chatbot.'
    ],
    links: [{ label: 'Faire un don', href: '/donate' }]
  },
  {
    id: 'contact',
    title: 'Contact et aide',
    keywords: ['contact', 'aide', 'support', 'assistance', 'message', 'question'],
    answer: [
      'Vous pouvez utiliser la page Contact pour envoyer un message a l equipe.',
      'Vous pouvez aussi poser votre question ici, avec des mots simples.',
      'Si la question concerne un danger immediat, faites directement un signalement.'
    ],
    links: [{ label: 'Contact', href: '/contact' }]
  }
]

const QUICK_ACTIONS = [
  { label: 'Signaler', text: 'Je veux signaler un probleme' },
  { label: 'Campagne', text: 'Comment participer a une campagne ?' },
  { label: 'Suivi', text: 'Comment suivre mon signalement ?' },
  { label: 'Police', text: 'Comment marche le live pour la police ?' },
  { label: 'Stats', text: 'Comment telecharger les statistiques ?' }
]

const PAGE_HELP = {
  '/citizen/signalement': 'Vous etes sur la page de signalement. Choisissez un gros bouton, ajoutez votre position, puis envoyez.',
  '/citizen/dashboard': 'Vous etes dans votre espace citoyen. Vous pouvez suivre vos signalements, participer aux campagnes et signer les plaidoyers.',
  '/collaborator/dashboard': 'Vous etes dans l espace collaborateur. Vous pouvez suivre les dossiers, creer des campagnes et telecharger les statistiques.',
  '/police/dashboard': 'Vous etes dans l espace police. Les lives citoyens et les alertes urgentes y apparaissent en temps reel.',
  '/admin/dashboard': 'Vous etes dans l administration. Vous pouvez gerer les utilisateurs, les contenus, le logo et les statistiques.',
  '/campagnes': 'Vous consultez les campagnes. Ouvrez une campagne pour voir les details et participer.'
}

const normalizeText = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (text) => normalizeText(text).split(' ').filter((word) => word.length > 2)

const scoreItem = (text, item) => {
  const clean = normalizeText(text)
  const words = tokenize(text)
  let score = 0
  item.keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword)
    if (clean.includes(normalizedKeyword)) score += 8
    words.forEach((word) => {
      if (normalizedKeyword.includes(word) || word.includes(normalizedKeyword)) score += 2
    })
  })
  if (clean.includes('comment') || clean.includes('comment faire')) score += 1
  if (clean.includes(item.id)) score += 6
  return score
}

const buildReply = (item, userText) => {
  const intro = item ? item.title : 'Je vous aide'
  const steps = item?.answer || [
    'Je n ai pas encore une reponse certaine.',
    'Reformulez avec des mots simples comme: signalement, campagne, compte, police ou statistiques.',
    'Je peux aussi vous orienter vers la page Contact.'
  ]
  const confidence = item ? 'Reponse proposee' : 'Je ne suis pas sur a 100%'
  return {
    text: `${confidence} - ${intro}\n\n${steps.map((line, index) => `${index + 1}. ${line}`).join('\n')}`,
    links: item?.links || [{ label: 'Contact', href: '/contact' }]
  }
}

export default function Chatbot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const CHAT_API = process.env.NEXT_PUBLIC_CHAT_API || ''

  const pageHelp = useMemo(() => PAGE_HELP[router.pathname] || null, [router.pathname])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setMessages(JSON.parse(raw))
      else {
        setMessages([{
          from: 'bot',
          text: 'Bonjour. Je suis l assistant Signal-Moi. Posez votre question avec vos mots: signalement, campagne, compte, police, statistiques ou don.',
          links: pageHelp ? [{ label: 'Aide de cette page', action: 'page_help' }] : [],
          ts: Date.now()
        }])
      }
    } catch (e) {
      setMessages([{ from: 'bot', text: 'Bonjour. Comment puis-je vous aider sur Signal-Moi ?', ts: Date.now() }])
    }
  }, [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch (e) {}
  }, [messages, open])

  const findBestAnswer = (text) => {
    const clean = normalizeText(text)
    if (/^(bonjour|salut|bonsoir|hello|salam)/.test(clean)) {
      return {
        text: 'Bonjour. Je peux vous guider pas a pas. Dites simplement ce que vous voulez faire: signaler, participer a une campagne, suivre un dossier, contacter l equipe ou telecharger des statistiques.',
        links: [{ label: 'Faire un signalement', href: '/citizen/signalement' }]
      }
    }
    if (clean.includes('aide page') || clean.includes('cette page') || clean.includes('ici')) {
      return {
        text: pageHelp || 'Je peux expliquer la page actuelle si vous me dites ce que vous voulez faire.',
        links: []
      }
    }

    const ranked = KNOWLEDGE
      .map((item) => ({ item, score: scoreItem(text, item) }))
      .sort((a, b) => b.score - a.score)

    if (ranked[0]?.score >= 5) return buildReply(ranked[0].item, text)
    return buildReply(null, text)
  }

  const send = async (rawText) => {
    const text = (rawText ?? input).trim()
    if (!text) return
    setMessages((current) => [...current, { from: 'user', text, ts: Date.now() }])
    setInput('')
    setLoading(true)

    try {
      if (CHAT_API) {
        const res = await fetch(CHAT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            page: router.pathname,
            history: messages.slice(-8)
          })
        })
        const data = await res.json()
        setMessages((current) => [...current, {
          from: 'bot',
          text: data.reply || data.message || 'Je n ai pas recu de reponse IA.',
          links: data.links || [],
          ts: Date.now()
        }])
      } else {
        await new Promise((resolve) => setTimeout(resolve, 250))
        const reply = findBestAnswer(text)
        setMessages((current) => [...current, { from: 'bot', ...reply, ts: Date.now() }])
      }
    } catch (e) {
      const reply = findBestAnswer(text)
      setMessages((current) => [...current, {
        from: 'bot',
        text: `${reply.text}\n\nNote: l IA externe n est pas joignable pour le moment, donc je reponds avec l assistant integre.`,
        links: reply.links,
        ts: Date.now()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleLink = (link) => {
    if (link.action === 'page_help') {
      setMessages((current) => [...current, { from: 'bot', text: pageHelp || 'Dites-moi ce que vous voulez faire sur cette page.', ts: Date.now() }])
      return
    }
    if (link.href) router.push(link.href)
  }

  const clearHistory = () => {
    const start = { from: 'bot', text: 'Conversation reinitialisee. Comment puis-je vous aider ?', ts: Date.now() }
    setMessages([start])
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) {}
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="fixed bottom-6 right-4 z-50">
      <div className="flex items-end justify-end">
        {open && (
          <div className="w-[21rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
            <div className="bg-slate-950 px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Assistant Signal-Moi</p>
                  <p className="text-xs text-slate-300">{CHAT_API ? 'IA connectee' : 'IA integree prete a brancher'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clearHistory} className="text-xs text-slate-300 hover:text-white">Effacer</button>
                  <button onClick={() => setOpen(false)} className="text-sm text-slate-200 hover:text-white">X</button>
                </div>
              </div>
              {pageHelp && (
                <button onClick={() => send('aide de cette page')} className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2 text-left text-xs text-slate-100 hover:bg-white/15">
                  Aide sur cette page: {pageHelp}
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2">
              {QUICK_ACTIONS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => send(item.text)}
                  className="whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto bg-white p-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${message.from === 'user' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <div className="whitespace-pre-line">{message.text}</div>
                    {Array.isArray(message.links) && message.links.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.links.map((link) => (
                          <button
                            key={`${link.label}-${link.href || link.action}`}
                            onClick={() => handleLink(link)}
                            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                          >
                            {link.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className={`mt-2 text-right text-[10px] ${message.from === 'user' ? 'text-slate-300' : 'text-slate-400'}`}>
                      {message.ts ? new Date(message.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
              {loading && <div className="text-sm text-slate-500">Je reflechis...</div>}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ecrivez votre question..."
                className="max-h-24 min-h-[48px] w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => send()}
                  disabled={loading}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Envoyer
                </button>
                <button onClick={() => setInput('')} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen((value) => !value)}
          className="ml-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white shadow-lg ring-4 ring-white transition hover:scale-105"
          aria-label="Ouvrir l assistant Signal-Moi"
        >
          IA
        </button>
      </div>
    </div>
  )
}
