"use client"
import { useState, useRef, useEffect } from 'react'

const STORAGE_KEY = 'superman_chat_history_v1'

const FAQ = [
  { q: 'Qui es-tu ?', a: "Je suis Superman, votre assistant virtuel sur Signal-Moi. Je peux vous orienter vers les signalements, l’inscription, votre profil et les pages d’aide." },
  { q: 'Qu est ce que Signal-Moi ?', a: "Signal-Moi est une plateforme citoyenne qui permet de signaler des incidents, suivre leur traitement et agir ensemble pour améliorer son quartier." },
  { q: 'Qui est Souleymane Sane ?', a: "Souleymane Sane est le président de Signal-Moi, il porte la vision stratégique et la gouvernance de l’organisation." },
  { q: 'Comment signaler un incident ?', a: "Cliquez sur « Faire un signalement » depuis la page d'accueil, décrivez l'événement, ajoutez des photos ou vidéos, puis précisez la localisation si possible." },
  { q: 'Comment créer un compte ?', a: "Cliquez sur « Rejoindre » en haut à droite, remplissez vos informations, validez l'inscription et connectez-vous ensuite pour accéder à votre espace." },
  { q: 'Comment me contacter ?', a: "Utilisez la page Contact pour envoyer un message, ou consultez la FAQ et les ressources disponibles sur le site." },
  { q: 'Comment changer mon mot de passe ?', a: "Connectez-vous, ouvrez votre profil ou vos paramètres, puis utilisez la section sécurité pour réinitialiser ou mettre à jour votre mot de passe." },
  { q: 'Où trouver mes campagnes ?', a: "Les campagnes et suivis sont disponibles dans votre espace utilisateur, dans les sections Campagnes, Profil et Paramètres." },
  { q: 'Comment me désabonner ?', a: "Rendez-vous dans vos paramètres ou sur la page Newsletter et utilisez le lien de désabonnement fourni par e-mail." },
]

const INTENTS = [
  { id: 'identity', patterns: ['qui es tu', 'qui etes tu', 'tu es qui', 'superman', 'assistant'], reply: "Je suis Superman, l’assistant de Signal-Moi. Je peux vous aider à comprendre la plateforme, trouver les bonnes pages et répondre aux questions courantes." },
  { id: 'brand', patterns: ['signal moi', 'plateforme citoyenne', 'quartier', 'signaler un incident'], reply: "Signal-Moi est une plateforme citoyenne qui permet de signaler des incidents, suivre les réponses et agir ensemble dans son quartier." },
  { id: 'person', patterns: ['souleymane sane', 'president signal moi', 'vision strategique'], reply: "Souleymane Sane est le président de Signal-Moi. Il porte la vision stratégique et la gouvernance de l’organisation." },
  { id: 'signalement', patterns: ['signal', 'signalement', 'signaler', 'plainte', 'incident', 'preuve', 'photo', 'video'], reply: "Pour signaler un incident, utilisez le bouton « Faire un signalement » et joignez des preuves utiles (photo, vidéo, localisation). Si vous le souhaitez, je peux vous guider étape par étape." },
  { id: 'compte', patterns: ['compte', 'inscri', 's inscrire', 'registre', 'connexion', 'login', 'mot de passe'], reply: "Pour créer un compte ou vous reconnecter, utilisez le bouton « Rejoindre » puis le formulaire d'inscription. En cas de souci d'accès, passez par la page de connexion ou la section sécurité de votre profil." },
  { id: 'contact', patterns: ['contact', 'support', 'aide', 'assistance', 'message'], reply: "Vous pouvez nous contacter via la page Contact, ou utiliser ce chatbot pour obtenir des réponses rapides sur les démarches, le profil et le signalement." },
  { id: 'newsletter', patterns: ['newsletter', 'abonne', 'abonnement', 'desabonne', 'mail'], reply: "Pour vous abonner ou vous désabonner, utilisez la page Newsletter ou les paramètres de votre compte, selon le message reçu par e-mail." },
  { id: 'profil', patterns: ['profil', 'parametre', 'paramètres', 'compte utilisateur', 'espace'], reply: "Votre profil et vos paramètres regroupent vos informations, préférences et accès à vos campagnes. Vous pouvez y retrouver vos réglages rapides." },
  { id: 'campagne', patterns: ['campagne', 'plaidoyer', 'initiative', 'suivi'], reply: "Les campagnes et plaidoyers sont visibles dans votre espace utilisateur. Vous pouvez suivre leur avancement, consulter les détails et les actions à faire." },
]

const quickIntents = [
  { label: 'Signalement', text: 'Comment signaler un incident ?' },
  { label: 'Compte', text: 'Comment créer un compte ?' },
  { label: 'Profil', text: 'Où gérer mon profil et mes paramètres ?' },
  { label: 'Contact', text: 'Comment me contacter rapidement ?' },
  { label: 'Aide', text: 'Peux-tu m’aider à trouver la bonne page ?' },
]

const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const CHAT_API = process.env.NEXT_PUBLIC_CHAT_API || ''

  useEffect(() => {
    // load history
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setMessages(JSON.parse(raw))
      else setMessages([{ from: 'bot', text: "Bonjour ! Je suis Superman, comment puis-je vous aider aujourd'hui ?" }])
    } catch (e) {
      setMessages([{ from: 'bot', text: "Bonjour ! Je suis Superman, comment puis-je vous aider aujourd'hui ?" }])
    }
  }, [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) } catch (e) {}
  }, [messages, open])

  const detectIntent = (text) => {
    const t = normalizeText(text)
    let best = { score: 0, reply: null, id: null }

    for (const it of INTENTS) {
      let score = 0
      for (const p of it.patterns) {
        const np = normalizeText(p)
        if (t.includes(np)) score += 4
        else if (t.split(' ').some((word) => word.length > 3 && np.includes(word))) score += 1
      }
      if (t.includes('comment') && (it.id === 'signalement' || it.id === 'compte' || it.id === 'contact')) score += 1
      if (score > best.score) best = { score, reply: it.reply, id: it.id }
    }

    return best.score >= 4 ? best : null
  }

  const smartFallback = (text) => {
    const t = normalizeText(text)
    if (/^(salut|bonjour|bonsoir|hello|hi|yo)/.test(t)) {
      return "Bonjour ! Je suis Superman, votre assistant dédié. Je peux vous guider sur les signalements, vos campagnes, votre profil ou la page de contact."
    }
    if (/qui es tu|qui etes tu|tu es qui|quel est ton role|tu es qui exactement/.test(t)) {
      return "Je suis Superman, l’assistant virtuel de Signal-Moi. Je peux vous aider à trouver la bonne page, expliquer le service et répondre à vos questions simples."
    }
    if (/qu est ce que signal moi|c est quoi signal moi|signal moi est quoi|signal moi c est/.test(t)) {
      return "Signal-Moi est une plateforme citoyenne qui permet de signaler des incidents, suivre leur traitement et améliorer sa communauté avec des actions concrètes."
    }
    if (/qui est souleymane sane|souleymane sane qui|president signal moi/.test(t)) {
      return "Souleymane Sane est le président de Signal-Moi. Il porte la vision stratégique et la gouvernance de l’organisation."
    }
    if (/merci/.test(t)) {
      return "Avec plaisir. Si vous voulez, je peux aussi vous proposer un raccourci vers la bonne page ou vous expliquer la procédure en 3 étapes." 
    }
    if (/faq|reponse rapide|reponses rapides|question rapide/.test(t)) {
      return "Voici les réponses rapides que je sais traiter : signalement, compte, profile, contact, newsletter et campagnes. Dites-moi simplement ce que vous cherchez." 
    }
    return null
  }

  const send = async (rawText) => {
    const text = (rawText ?? input).trim()
    if (!text) return
    const userMsg = { from: 'user', text, ts: Date.now() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      if (CHAT_API) {
        const res = await fetch(CHAT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        })
        const data = await res.json()
        const reply = data.reply || "Désolé, je n'ai pas de réponse."
        setMessages((m) => [...m, { from: 'bot', text: reply, ts: Date.now() }])
      } else {
        const smart = smartFallback(text)
        if (smart) {
          await new Promise((r) => setTimeout(r, 300))
          setMessages((m) => [...m, { from: 'bot', text: smart, ts: Date.now() }])
          return
        }

        const intent = detectIntent(text)
        if (intent?.reply) {
          await new Promise((r) => setTimeout(r, 300))
          setMessages((m) => [...m, { from: 'bot', text: intent.reply, ts: Date.now() }])
          return
        }

        const faq = FAQ.reduce((best, item) => {
          const query = normalizeText(item.q)
          const answer = normalizeText(text)
          let score = 0
          query.split(' ').forEach((word) => {
            if (answer.includes(word) && word.length > 2) score += 1
          })
          return score > best.score ? { item, score } : best
        }, { item: null, score: 0 })

        if (faq.item && faq.score >= 2) {
          await new Promise((r) => setTimeout(r, 300))
          setMessages((m) => [...m, { from: 'bot', text: faq.item.a, ts: Date.now() }])
          return
        }

        await new Promise((r) => setTimeout(r, 400))
        setMessages((m) => [...m, {
          from: 'bot',
          text: "Je peux vous aider sur les signalements, le compte, le profil, la FAQ ou le contact. Reformulez votre demande avec un mot-clé comme « signalement », « compte », « profil » ou « contact ».",
          ts: Date.now(),
        }])
      }
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: 'Erreur réseau — veuillez réessayer.', ts: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clearHistory = () => {
    setMessages([{ from: 'bot', text: "Bonjour ! Je suis Superman, comment puis-je vous aider aujourd'hui ?" }])
    try { localStorage.removeItem(STORAGE_KEY) } catch (e) {}
  }

  const quick = (t) => send(t)

  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className="flex items-end justify-end">
        {open && (
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/8">
            <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">S</div>
                <div className="font-semibold">Superman — Assistance</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearHistory} aria-label="Effacer" className="text-white/80 text-xs">Effacer</button>
                <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-white/90">✕</button>
              </div>
            </div>
            <div className="p-2 border-b bg-gray-50 flex gap-2 overflow-x-auto">
              {quickIntents.map((q) => (
                <button key={q.label} onClick={() => send(q.text)} className="text-xs px-2 py-1 rounded-full bg-white border text-gray-700 hover:bg-indigo-50">{q.label}</button>
              ))}
            </div>
            <div ref={listRef} className="p-3 max-h-64 overflow-y-auto space-y-3 bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex items-end ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.from === 'bot' && (
                    <div className="mr-2 flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">S</div>
                  )}
                  <div className={`${m.from === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900'} rounded-lg p-2 text-sm shadow max-w-[78%]`}>
                    <div>{m.text}</div>
                    <div className="text-[10px] text-gray-400 mt-1 text-right">{m.ts ? new Date(m.ts).toLocaleTimeString() : ''}</div>
                  </div>
                  {m.from === 'user' && (
                    <div className="ml-2 flex-shrink-0 text-xs text-gray-500">Vous</div>
                  )}
                </div>
              ))}
              {loading && <div className="text-sm text-gray-500">Superman écrit…</div>}
            </div>
            <div className="p-3 border-t bg-white">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Posez votre question…"
                className="w-full min-h-[44px] max-h-24 resize-none rounded-md border px-3 py-2 text-sm"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => send()} disabled={loading} className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm">Envoyer</button>
                  <button onClick={() => { setInput(''); }} className="text-sm text-gray-500">Annuler</button>
                </div>
                <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(messages)); }} className="text-xs text-gray-500">Exporter</button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ml-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg ring-2 ring-white/40"
          aria-label="Ouvrir le chat Superman"
        >
          🦸
        </button>
      </div>
    </div>
  )
}
