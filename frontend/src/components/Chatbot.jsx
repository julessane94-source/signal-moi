"use client"
import { useState, useRef, useEffect } from 'react'

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ from: 'bot', text: "Bonjour ! Je suis Superman, comment puis-je vous aider aujourd'hui ?" }])
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const CHAT_API = process.env.NEXT_PUBLIC_CHAT_API || ''

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    const userMsg = { from: 'user', text }
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
        const reply = data.reply || 'Désolé, je n\'ai pas de réponse.'
        setMessages((m) => [...m, { from: 'bot', text: reply }])
      } else {
        // simple local fallback responses
        const t = text.toLowerCase()
        let reply = "Je n'ai pas compris, pouvez-vous préciser ?"
        if (t.includes('bonjour') || t.includes('salut')) reply = 'Bonjour ! En quoi puis-je vous aider aujourd\'hui ?'
        else if (t.includes('aide') || t.includes('aider') || t.includes('probl')) reply = 'Pour signaler un incident, cliquez sur « Faire un signalement ». Pour d\'autres questions, précisez votre demande.'
        else if (t.includes('inscri') || t.includes('compte')) reply = 'Pour créer un compte, utilisez le bouton Rejoindre en haut de la page.'
        else if (t.includes('contact')) reply = 'Vous pouvez nous contacter via la page Contact ou via le support.'
        await new Promise((r) => setTimeout(r, 500))
        setMessages((m) => [...m, { from: 'bot', text: reply }])
      }
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: 'Erreur réseau — veuillez réessayer.' }])
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

  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className="flex items-end justify-end">
        {open && (
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-black/8">
            <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="font-semibold">Superman — Assistance</div>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-white/90">✕</button>
            </div>
            <div ref={listRef} className="p-3 max-h-64 overflow-y-auto space-y-3 bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`${m.from === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-900'} rounded-lg p-2 text-sm shadow`}>{m.text}</div>
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
                <button onClick={send} disabled={loading} className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm">Envoyer</button>
                <button onClick={() => { setMessages([{ from: 'bot', text: "Bonjour ! Je suis Superman, comment puis-je vous aider aujourd'hui ?" }]); setInput('') }} className="text-xs text-gray-500">Réinitialiser</button>
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
