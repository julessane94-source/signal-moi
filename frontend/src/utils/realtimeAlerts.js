const normalizeRole = (role) => String(role || '').trim().toLowerCase()

let audioContext = null
let audioUnlocked = false
let lastAlertAt = 0

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  if (!audioContext) audioContext = new AudioContextClass()
  return audioContext
}

export const unlockRealtimeAudio = async () => {
  const context = getAudioContext()
  if (!context) return false
  try {
    if (context.state === 'suspended') await context.resume()
    audioUnlocked = true
    return true
  } catch (error) {
    return false
  }
}

export const requestRealtimeNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission()
    } catch (error) {
      return Notification.permission
    }
  }
  return Notification.permission
}

export const prepareRealtimeAlerts = () => {
  if (typeof window === 'undefined') return

  const prepare = () => {
    unlockRealtimeAudio()
    requestRealtimeNotificationPermission()
  }

  window.addEventListener('pointerdown', prepare, { once: true })
  window.addEventListener('keydown', prepare, { once: true })

  return () => {
    window.removeEventListener('pointerdown', prepare)
    window.removeEventListener('keydown', prepare)
  }
}

const playTone = ({ urgent = false } = {}) => {
  const now = Date.now()
  if (now - lastAlertAt < 1200) return
  lastAlertAt = now

  const context = getAudioContext()
  if (!context || !audioUnlocked) return

  const tones = urgent ? [880, 1040, 880] : [620, 760]
  tones.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = urgent ? 'square' : 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.001, context.currentTime + index * 0.22)
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + index * 0.22 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + index * 0.22 + 0.18)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(context.currentTime + index * 0.22)
    oscillator.stop(context.currentTime + index * 0.22 + 0.2)
  })
}

const speak = (text) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.95
    utterance.volume = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  } catch (error) {
    // Silent fallback: the tone and browser notification still handle the alert.
  }
}

const showBrowserNotification = ({ title, body, urgent = false, url }) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const notification = new Notification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    requireInteraction: urgent,
    tag: urgent ? 'signal-moi-urgent' : 'signal-moi-notification'
  })

  notification.onclick = () => {
    window.focus()
    if (url) window.location.href = url
    notification.close()
  }
}

export const notifyRealtimeEvent = ({ role, event, payload = {}, toast }) => {
  const normalizedRole = normalizeRole(role)
  const isPolice = ['police', 'policier', 'gendarmerie', 'force_ordre'].includes(normalizedRole)
  const isAdmin = ['admin', 'administrateur'].includes(normalizedRole)
  const isCollaborateur = ['collaborateur', 'collaborator'].includes(normalizedRole)
  const isCitizen = normalizedRole === 'citoyen'

  let alert = null

  if (event === 'live_recording_started' && (isPolice || isAdmin)) {
    alert = {
      title: 'Alerte live citoyen',
      body: payload.titre || payload.title || 'Un citoyen filme une urgence en direct.',
      speech: isPolice ? 'Alerte police. Un citoyen est en direct. Ouvrez le live maintenant.' : 'Alerte administrateur. Nouveau live citoyen en cours.',
      urgent: true,
      url: isPolice ? '/police/dashboard' : '/admin/dashboard'
    }
  } else if ((event === 'signalement_received' || event === 'new_signalement_notification') && (isPolice || isAdmin)) {
    alert = {
      title: isPolice ? 'Nouveau signalement police' : 'Nouveau signalement',
      body: payload.title || payload.titre || payload.message || 'Un nouveau signalement vient d arriver.',
      speech: isPolice ? 'Nouveau signalement reçu. Intervention possible.' : 'Nouveau signalement reçu.',
      urgent: payload.priorite === 'urgente' || payload.isLiveRecording,
      url: isPolice ? '/police/dashboard' : '/admin/dashboard'
    }
  } else if ((event === 'followed_case_update' || event === 'message_received') && isCollaborateur) {
    alert = {
      title: 'Mise a jour collaborateur',
      body: payload.message || payload.titre || 'Vous avez une nouvelle mise a jour.',
      speech: 'Nouvelle mise a jour dans votre espace collaborateur.',
      urgent: false,
      url: '/collaborator/dashboard'
    }
  } else if (event === 'signalement_status_updated' && (isAdmin || isCollaborateur)) {
    alert = {
      title: 'Statut de signalement mis a jour',
      body: payload.message || payload.titre || 'Un dossier a change de statut.',
      speech: 'Statut de signalement mis a jour.',
      urgent: false,
      url: isAdmin ? '/admin/dashboard' : '/collaborator/dashboard'
    }
  } else if ((event === 'message_received' || event === 'notification') && isCitizen) {
    alert = {
      title: 'Signal-Moi',
      body: payload.message || payload.titre || 'Vous avez une nouvelle notification.',
      speech: 'Vous avez une nouvelle notification Signal-Moi.',
      urgent: false,
      url: '/notifications'
    }
  }

  if (!alert) return

  playTone({ urgent: alert.urgent })
  if (alert.urgent && typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([250, 120, 250])
  }
  speak(alert.speech)
  showBrowserNotification(alert)

  if (toast) {
    const message = `${alert.title}: ${alert.body}`
    alert.urgent ? toast.warning(message) : toast.info(message)
  }
}
