import { useEffect, useState } from 'react'
import { requestRealtimeNotificationPermission, speakNaturally, unlockRealtimeAudio } from '../../utils/realtimeAlerts'

const PROMPT_KEY = 'signal-moi-notification-first-use'

export default function FirstUseNotificationPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return
    if (window.localStorage.getItem(PROMPT_KEY)) return
    const timer = window.setTimeout(() => setVisible(true), 700)
    return () => window.clearTimeout(timer)
  }, [])

  const close = () => {
    window.localStorage.setItem(PROMPT_KEY, '1')
    setVisible(false)
  }

  const enable = async () => {
    await unlockRealtimeAudio()
    const permission = await requestRealtimeNotificationPermission()
    window.localStorage.setItem(PROMPT_KEY, '1')
    setVisible(false)
    if (permission === 'granted') speakNaturally('Les notifications Signal Moi sont activées. Vous serez informé des alertes importantes.')
  }

  if (!visible) return null
  return (
    <div className="fixed inset-x-4 bottom-5 z-[100] mx-auto max-w-md rounded-3xl border border-emerald-200 bg-white p-5 shadow-2xl shadow-slate-950/20" role="dialog" aria-label="Activer les notifications">
      <p className="text-base font-black text-slate-950">Recevoir les alertes Signal-Moi ?</p>
      <p className="mt-2 text-sm leading-5 text-slate-600">Activez les notifications pour être informé des signalements, messages et mises à jour importantes.</p>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={close} className="min-h-11 flex-1 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100">Plus tard</button>
        <button type="button" onClick={enable} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-3 text-sm font-black text-white shadow-sm hover:bg-emerald-700">Activer</button>
      </div>
    </div>
  )
}
