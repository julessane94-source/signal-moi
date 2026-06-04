"use client"
import { useState, useRef, useEffect } from 'react'

const STORAGE_KEY = 'superman_chat_history_v1'

const FAQ = [
  { q: 'Comment signaler un incident ?', a: "Cliquez sur « Faire un signalement » sur la page d'accueil, ajoutez une description, des photos et la localisation." },
  { q: 'Comment créer un compte ?', a: "Cliquez sur Rejoindre en haut de la page et suivez le formulaire d'inscription." },
  { q: 'Comment me désabonner de la newsletter ?', a: "Rendez-vous sur la page Newsletter et cliquez sur le lien de désabonnement reçu par e-mail." },
]

const INTENTS = [
  { patterns: ['signal', 'signalement', 'signaler'], reply: "Pour signaler un incident, utilisez le bouton 'Faire un signalement' et joignez des preuves (photo, vidéo). Voulez-vous un lien vers le formulaire ?" },
  { patterns: ['compte', 'inscri', 's inscrire', 'registre'], reply: "Pour créer un compte, cliquez sur 'Rejoindre' en haut à droite. Je peux vous donner la marche à suivre si besoin." },
  { patterns: ['contact', 'support'], reply: "Vous pouvez nous contacter via la page Contact ou répondre à nos emails de support." },
  { patterns: ['newsletter', 'abonne', 'abonnement'], reply: "Pour vous abonner, allez sur la page Newsletter et entrez votre adresse email." },
]

const quickIntents = [
  { label: 'Signalement', text: 'Comment signaler un incident ?' },
  { label: 'Compte', text: 'Comment créer un compte ?' },
  { label: 'Contact', text: 'Comment me contacter ?' },
  { label: 'FAQ', text: 'Montrez-moi les réponses rapides.' },
]

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
    const t = text.toLowerCase()
    for (const it of INTENTS) {
      for (const p of it.patterns) if (t.includes(p)) return it.reply
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
        // local intent/FAQ fallback
        const intentResponse = detectIntent(text)
        if (intentResponse) {
          await new Promise((r) => setTimeout(r, 300))
          setMessages((m) => [...m, { from: 'bot', text: intentResponse, ts: Date.now() }])
        } else {
          // try matching FAQ keywords
          const faq = FAQ.find(f => text.toLowerCase().includes(f.q.split(' ')[0].toLowerCase()))
          if (faq) {
            await new Promise((r) => setTimeout(r, 300))
            setMessages((m) => [...m, { from: 'bot', text: faq.a, ts: Date.now() }])
          } else {
            await new Promise((r) => setTimeout(r, 400))
            setMessages((m) => [...m, { from: 'bot', text: "Je n'ai pas compris parfaitement — pouvez-vous reformuler ou choisir une option : Signalement, Compte, Contact, Newsletter?", ts: Date.now() }])
          }
        }
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
