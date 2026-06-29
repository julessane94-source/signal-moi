import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { API_BASE } from '../../config/api'
import { toast } from 'react-toastify'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('../../components/Map/LeafletMap.jsx'), {
  ssr: false,
  loading: () => <div className="w-full h-80 rounded bg-gray-100 animate-pulse" />
})

const QUICK_TYPES = [
  { value: 'violence', label: 'Violence', simple: 'On attaque quelqu un', icon: '!', hint: 'Agression, menace, bagarre', tone: 'border-red-200 bg-red-50 text-red-900' },
  { value: 'accident', label: 'Accident', simple: 'Il y a un accident', icon: '+', hint: 'Blessure, choc, danger immediat', tone: 'border-orange-200 bg-orange-50 text-orange-900' },
  { value: 'vol', label: 'Vol', simple: 'On a vole quelque chose', icon: '$', hint: 'Vol, cambriolage, objet vole', tone: 'border-amber-200 bg-amber-50 text-amber-900' },
  { value: 'probleme_eclairage', label: 'Eclairage', simple: 'La lumiere ne marche pas', icon: 'L', hint: 'Lampadaire ou rue sombre', tone: 'border-blue-200 bg-blue-50 text-blue-900' },
  { value: 'nid_de_poule', label: 'Trou sur la route', simple: 'La route est abimee', icon: 'R', hint: 'Trou, route cassee, danger', tone: 'border-slate-200 bg-slate-50 text-slate-900' },
  { value: 'autre', label: 'Autre probleme', simple: 'Autre chose a signaler', icon: '?', hint: 'Je ne sais pas choisir', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' }
]

const SIMPLE_DESCRIPTIONS = {
  violence: 'Je signale une violence ou une menace. Il faut intervenir rapidement.',
  accident: 'Je signale un accident ou une personne en danger. Il faut intervenir rapidement.',
  vol: 'Je signale un vol. Une personne a perdu un bien ou un cambriolage a eu lieu.',
  probleme_eclairage: 'Je signale un probleme d eclairage public. La zone est sombre et dangereuse.',
  nid_de_poule: 'Je signale un trou ou une route abimee. Cela peut provoquer un accident.',
  autre: 'Je signale un probleme dans mon quartier. Merci de verifier la situation.'
}

const VIDEO_PROMPT_TYPES = ['violence', 'accident', 'vol']
const MAX_RECORDING_MS = 3 * 60 * 1000

const shouldReplaceAutoLocation = (value) => {
  const text = String(value || '')
  return !text || text.startsWith('Position approximative IP') || text.startsWith('Sedhiou - localisation')
}

export default function NewSignalement() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [showVideoPrompt, setShowVideoPrompt] = useState(false)
  const [videoPromptHandled, setVideoPromptHandled] = useState(false)
  const [recordingState, setRecordingState] = useState('idle')
  const [recordingError, setRecordingError] = useState(null)
  const [liveStream, setLiveStream] = useState(null)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null)
  const [recordedVideoName, setRecordedVideoName] = useState(null)
  const socketRef = useRef(socket)
  const mediaRecorderRef = useRef(null)
  const recordingChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const liveFrameTimerRef = useRef(null)
  const liveSessionIdRef = useRef(null)
  const liveVideoRef = useRef(null)
  const liveStreamRef = useRef(null)
  const pendingLiveMetaRef = useRef({})
  const videoPreviewRef = useRef(null)
  const recordedVideoNameRef = useRef(null)
  const skipVideoRef = useRef(false)
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'autre',
    localisation: '',
    estAnonyme: false
  })
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)

  const [geoError, setGeoError] = useState(null)
  const shouldOfferVideoProof = VIDEO_PROMPT_TYPES.includes(formData.type)
  const hasRecordedVideo = Boolean(recordedVideoName)
  const filePreviews = useMemo(() => files.map((file) => ({
    file,
    url: URL.createObjectURL(file)
  })), [files])

  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => URL.revokeObjectURL(preview.url))
    }
  }, [filePreviews])

  useEffect(() => {
    socketRef.current = socket
    if (socket && recordingState === 'recording' && liveSessionIdRef.current) {
      const meta = pendingLiveMetaRef.current || {}
      socket.emit('live_recording_started', {
        sessionId: liveSessionIdRef.current,
        type: meta.type || formData.type,
        titre: meta.titre || formData.titre || `Signalement : ${getTypeLabel(formData.type)}`,
        description: meta.description || formData.description,
        latitude,
        longitude,
        localisation: formData.localisation || null
      })
      if (latitude !== null && longitude !== null) {
        emitLiveLocation({ latitude, longitude, localisation: formData.localisation || `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}` })
      }
      if (liveStreamRef.current) {
        startLiveFrameBroadcast(liveStreamRef.current)
      }
    }
  }, [socket, recordingState])
  const getTypeLabel = (type) => QUICK_TYPES.find(item => item.value === type)?.label || type

  const speakHelp = (text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.info(text)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const startDescriptionDictation = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.info('La dictee vocale n est pas disponible sur ce navigateur')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Dictee vocale interrompue')
    }
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (!transcript) return
      setFormData(prev => ({
        ...prev,
        description: prev.description ? `${prev.description} ${transcript}` : transcript
      }))
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const ensureAutomaticDescription = (type) => {
    const label = getTypeLabel(type)
    setFormData(prev => {
      if (prev.description.trim()) return prev
      return {
        ...prev,
        description: `Signalement urgent: ${label}. Une video preuve est en cours d'enregistrement et la localisation automatique est transmise aux autorites.`
      }
    })
  }

  const emitLiveLocation = (locationData) => {
    const activeSocket = socketRef.current
    if (!liveSessionIdRef.current || !locationData) return
    sendLiveSessionFallback({
      action: 'location',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      localisation: locationData.localisation
    })
    if (!activeSocket) return
    activeSocket.emit('live_recording_location', {
      sessionId: liveSessionIdRef.current,
      type: pendingLiveMetaRef.current.type || formData.type,
      titre: pendingLiveMetaRef.current.titre || formData.titre || `Signalement : ${getTypeLabel(formData.type)}`,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      localisation: locationData.localisation
    })
  }

  const sendLiveSessionFallback = (payload = {}) => {
    if (!liveSessionIdRef.current || typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    if (!token) return

    const meta = pendingLiveMetaRef.current || {}
    fetch(`${API_BASE}/api/signalements/live-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: liveSessionIdRef.current,
        type: meta.type || formData.type,
        titre: meta.titre || formData.titre || `Signalement : ${getTypeLabel(formData.type)}`,
        description: meta.description || formData.description,
        latitude,
        longitude,
        localisation: formData.localisation || null,
        ...payload
      })
    }).catch(() => {})
  }

  const startLiveFrameBroadcast = (stream) => {
    if (liveFrameTimerRef.current) return

    if (stream && !liveVideoRef.current) {
      const liveVideo = document.createElement('video')
      liveVideo.muted = true
      liveVideo.playsInline = true
      liveVideo.srcObject = stream
      liveVideo.play().catch(() => {})
      liveVideoRef.current = liveVideo
    }

    liveFrameTimerRef.current = setInterval(() => {
      const video = videoPreviewRef.current || liveVideoRef.current
      if (!video || video.readyState < 2 || !liveSessionIdRef.current) return

      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const frame = canvas.toDataURL('image/jpeg', 0.45)
      const activeSocket = socketRef.current
      if (activeSocket) {
        activeSocket.emit('live_recording_frame', {
          sessionId: liveSessionIdRef.current,
          frame
        })
      }
      sendLiveSessionFallback({
        action: 'frame',
        frame
      })
    }, 1000)
  }

  const stopLiveFrameBroadcast = () => {
    if (liveFrameTimerRef.current) {
      clearInterval(liveFrameTimerRef.current)
      liveFrameTimerRef.current = null
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null
      liveVideoRef.current = null
    }
  }

  const getLocationFromIpFallback = async ({ silent = false } = {}) => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (!response.ok) throw new Error('IP lookup failed')
      const data = await response.json()
      if (!data.latitude || !data.longitude) throw new Error('IP coordinates missing')

      const lat = Number(data.latitude)
      const lng = Number(data.longitude)
      const city = [data.city, data.region, data.country_name].filter(Boolean).join(', ')
      const localisation = city
        ? `Position approximative IP: ${city}`
        : `Position approximative IP: ${lat.toFixed(6)}, ${lng.toFixed(6)}`

      setFormData(prev => ({
        ...prev,
        localisation: shouldReplaceAutoLocation(prev.localisation) ? localisation : prev.localisation
      }))
      setGeoError('GPS refuse ou indisponible. La ville IP est affichee seulement comme repere approximatif. Autorisez le GPS pour envoyer la vraie position a la police.')
      if (!silent) toast.info('Position approximative IP recuperee')

      return { latitude: null, longitude: null, localisation, approximate: true }
    } catch (error) {
      const localisation = formData.localisation || 'Sedhiou - localisation a preciser'
      setGeoError('GPS et localisation IP indisponibles. Precisez le quartier ou un repere manuellement.')
      if (!silent) toast.info('Precisez votre lieu a Sedhiou')
          setFormData(prev => ({ ...prev, localisation: shouldReplaceAutoLocation(prev.localisation) ? localisation : prev.localisation }))
      return { latitude: null, longitude: null, localisation }
    }
  }

  const requestGeolocation = async () => {
    setGeoError(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.error('Géolocalisation non prise en charge par votre navigateur')
      setGeoError('Géolocalisation non prise en charge')
      return
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setLatitude(lat)
      setLongitude(lng)
      // reverse geocode with Nominatim to fill localisation if empty
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        if (res.ok) {
          const data = await res.json()
          const addr = data.display_name
          setFormData(prev => ({ ...prev, localisation: prev.localisation || addr, latitude: lat, longitude: lng }))
          toast.success('📍 Localisation automatique trouvée')
        } else {
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
          toast.success('📍 Coordonnées GPS récupérées')
        }
      } catch (e) {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
        toast.success('📍 Coordonnées GPS récupérées')
      }
    }, (err) => {
      if (err.code === 1) {
        toast.error('Accès à la géolocalisation refusé')
        setGeoError('Accès à la géolocalisation refusé. Saisissez manuellement la localisation.')
      } else {
        toast.error('Impossible de récupérer la géolocalisation')
        setGeoError('Impossible de récupérer la géolocalisation')
      }
      console.log('Géolocalisation erreur:', err)
    })
  }

  const getAutomaticLocation = async ({ silent = false } = {}) => {
    setGeoError(null)

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!silent) toast.error('Geolocalisation non prise en charge par votre navigateur')
      setGeoError('Geolocalisation non prise en charge')
      return getLocationFromIpFallback({ silent })
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const coordsLabel = `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        let localisation = coordsLabel
        setLatitude(lat)
        setLongitude(lng)

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
          if (res.ok) {
            const data = await res.json()
            localisation = data.display_name || coordsLabel
          }
        } catch (e) {
          localisation = coordsLabel
        }

        setFormData(prev => ({
          ...prev,
          localisation: shouldReplaceAutoLocation(prev.localisation) ? localisation : prev.localisation,
          latitude: lat,
          longitude: lng
        }))
        if (!silent) toast.success('Localisation automatique trouvee')
        emitLiveLocation({ latitude: lat, longitude: lng, localisation })
        resolve({ latitude: lat, longitude: lng, localisation })
      }, (err) => {
        if (err.code === 1) {
          setGeoError('GPS refuse par le navigateur. Autorisez la localisation dans le navigateur pour envoyer la vraie position a la police.')
        } else {
          setGeoError('GPS indisponible. Tentative de repere approximatif par IP...')
        }
        console.log('Geolocalisation erreur:', err)
        getLocationFromIpFallback({ silent }).then((fallbackLocation) => {
          if (fallbackLocation) resolve(fallbackLocation)
          else resolve({ latitude: null, longitude: null, localisation: formData.localisation || 'Localisation automatique indisponible' })
        })
      }, {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0
      })
    })
  }

  useEffect(() => {
    // If the user already granted geolocation permission, or if the browser would prompt,
    // attempt to obtain it automatically on page load so the user sees the permission prompt.
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        if (status.state === 'granted' || status.state === 'prompt') {
          getAutomaticLocation({ silent: true })
        } else if (status.state === 'denied') {
          setGeoError('Accès à la géolocalisation refusé')
        }
      }).catch(() => {
        // Permissions API unavailable, fallback: attempt to request geolocation once.
        try {
          getAutomaticLocation({ silent: true })
        } catch (e) {
          // ignore
        }
      })
    } else {
      // Permissions API not supported; try asking once.
      try {
        getAutomaticLocation({ silent: true })
      } catch (e) {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (videoPreviewRef.current && liveStream) {
      videoPreviewRef.current.srcObject = liveStream
    }
  }, [liveStream, showVideoPrompt])

  useEffect(() => {
    return () => {
      stopCameraStream()
      stopLiveFrameBroadcast()
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current)
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl)
      }
    }
  }, [recordedVideoUrl])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (name === 'type') {
      setVideoPromptHandled(false)
      if (VIDEO_PROMPT_TYPES.includes(value) && !hasRecordedVideo) {
        ensureAutomaticDescription(value)
        setShowVideoPrompt(true)
        startVideoRecording({ type: value, title: `Signalement : ${getTypeLabel(value)}` })
      }
    }
  }

  const handleQuickType = (type, label) => {
    setFormData(prev => ({
      ...prev,
      type,
      titre: prev.titre || `Signalement : ${label}`,
      description: prev.description || SIMPLE_DESCRIPTIONS[type] || `Je signale: ${label}`
    }))
    speakHelp(`${label}. ${SIMPLE_DESCRIPTIONS[type] || 'Expliquez le probleme ou ajoutez une photo.'}`)
    setVideoPromptHandled(false)
    if (VIDEO_PROMPT_TYPES.includes(type) && !hasRecordedVideo) {
      ensureAutomaticDescription(type)
      setShowVideoPrompt(true)
      startVideoRecording({ type, title: formData.titre || `Signalement : ${label}` })
    }
  }

  const handleFileChange = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const stopCameraStream = () => {
    setLiveStream((stream) => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      liveStreamRef.current = null
      return null
    })
  }

  const getRecordingMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return ''
    const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || ''
  }

  const startVideoRecording = async ({ type = formData.type, title = formData.titre } = {}) => {
    setRecordingError(null)
    const liveType = type || formData.type
    const liveTitle = title || formData.titre || `Signalement : ${getTypeLabel(liveType)}`
    const liveDescription = formData.description || `Signalement urgent: ${getTypeLabel(liveType)}`
    pendingLiveMetaRef.current = { type: liveType, titre: liveTitle, description: liveDescription }

    if (recordingState === 'recording' || recordingState === 'saving') {
      setShowVideoPrompt(true)
      return
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Votre navigateur ne permet pas de filmer directement depuis cette page.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      })
      const mimeType = getRecordingMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recordingChunksRef.current = []
      mediaRecorderRef.current = recorder
      liveStreamRef.current = stream
      setLiveStream(stream)
      setRecordingState('recording')
      const sessionId = liveSessionIdRef.current || `live-${Date.now()}-${Math.random().toString(36).slice(2)}`
      liveSessionIdRef.current = sessionId

      const activeSocket = socketRef.current
      if (activeSocket) {
        activeSocket.emit('live_recording_started', {
          sessionId,
          type: liveType,
          titre: liveTitle,
          description: liveDescription,
          latitude,
          longitude,
          localisation: formData.localisation || null
        })
      }
      sendLiveSessionFallback({
        action: 'start',
        latitude,
        longitude,
        localisation: formData.localisation || null
      })

      if (latitude === null || longitude === null || !formData.localisation) {
        getAutomaticLocation({ silent: true }).then(emitLiveLocation)
      } else {
        emitLiveLocation({ latitude, longitude, localisation: formData.localisation })
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stopLiveFrameBroadcast()
        if (skipVideoRef.current) {
          skipVideoRef.current = false
          recordingChunksRef.current = []
          setRecordingState('idle')
          setVideoPromptHandled(true)
          const activeSocket = socketRef.current
          if (activeSocket && liveSessionIdRef.current) {
            activeSocket.emit('live_recording_stopped', { sessionId: liveSessionIdRef.current, type: liveType })
          }
          sendLiveSessionFallback({ action: 'stop' })
          stopCameraStream()
          submitSignalement()
          return
        }
        const finalMimeType = recorder.mimeType || mimeType || 'video/webm'
        const blob = new Blob(recordingChunksRef.current, { type: finalMimeType })
        const extension = finalMimeType.includes('mp4') ? 'mp4' : 'webm'
        const proofName = `preuve-video-${Date.now()}.${extension}`
        const proofFile = new File([blob], proofName, { type: finalMimeType })

        if (recordedVideoUrl) {
          URL.revokeObjectURL(recordedVideoUrl)
        }

        const previousProofName = recordedVideoNameRef.current
        recordedVideoNameRef.current = proofName
        setRecordedVideoName(proofName)
        setRecordedVideoUrl(URL.createObjectURL(blob))
        setFiles(prev => [...prev.filter(file => file.name !== previousProofName), proofFile])
        setRecordingState('saved')
        setVideoPromptHandled(true)
        const activeSocket = socketRef.current
        if (activeSocket && liveSessionIdRef.current) {
          activeSocket.emit('live_recording_stopped', {
            sessionId: liveSessionIdRef.current,
            type: liveType
          })
        }
        sendLiveSessionFallback({ action: 'stop' })
        stopCameraStream()
      }

      recorder.start()
      startLiveFrameBroadcast(stream)
      recordingTimerRef.current = setTimeout(() => {
        stopVideoRecording()
      }, MAX_RECORDING_MS)
    } catch (error) {
      console.error('[VideoRecording] Error:', error)
      setRecordingState('idle')
      setRecordingError('Impossible d acceder a la camera. Verifiez les permissions puis reessayez.')
      stopLiveFrameBroadcast()
      stopCameraStream()
    }
  }

  const stopVideoRecording = () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      setRecordingState('saving')
      recorder.stop()
    } else {
      stopCameraStream()
    }
  }

  const submitSignalement = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!user || !user.id) {
        toast.error('Veuillez vous reconnecter')
        router.push('/login')
        return
      }

      if (!formData.titre.trim() || !formData.description.trim() || !formData.type) {
        toast.error('Veuillez renseigner le titre, la description et le type.')
        return
      }

      let localisationValue = formData.localisation.trim()
      let latitudeValue = latitude
      let longitudeValue = longitude

      if (!localisationValue || latitudeValue === null || longitudeValue === null) {
        const detectedLocation = await getAutomaticLocation()
        if (detectedLocation) {
          localisationValue = localisationValue || detectedLocation.localisation
          latitudeValue = detectedLocation.latitude
          longitudeValue = detectedLocation.longitude
        }
      }

      if (!localisationValue) {
        toast.error('Impossible de localiser automatiquement. Autorisez la localisation puis reessayez.')
        setLoading(false)
        return
      }

      const fd = new FormData()
      fd.append('titre', formData.titre)
      fd.append('description', formData.description)
      fd.append('type', formData.type)
      fd.append('localisation', localisationValue)
      fd.append('estAnonyme', String(formData.estAnonyme === true))
      // append coordinates if available (from geolocation or map)
      if (latitudeValue !== null) fd.append('latitude', latitudeValue)
      if (longitudeValue !== null) fd.append('longitude', longitudeValue)

      // Append files
      files.forEach((f) => fd.append('fichiers', f))

      const response = await fetch(`${API_BASE}/api/signalements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do not set Content-Type; browser will set multipart boundaries
        },
        body: fd
      })

      if (response.ok) {
        toast.success('Signalement créé avec succès !')
        router.push('/citizen/dashboard')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la création')
      }
    } catch (error) {
      console.error('[NewSignalement] Error:', error)
      toast.error('Erreur réseau : impossible de créer le signalement')
    } finally {
      setLoading(false)
    }
  }


  const continueWithoutVideo = () => {
    setVideoPromptHandled(true)
    setShowVideoPrompt(false)
    setRecordedVideoName(null)
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl)
      setRecordedVideoUrl(null)
    }
    const previousProofName = recordedVideoNameRef.current
    recordedVideoNameRef.current = null
    if (previousProofName) {
      setFiles(prev => prev.filter(file => file.name !== previousProofName))
    }

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      skipVideoRef.current = true
      setRecordingState('saving')
      recorder.stop()
      return
    }

    stopLiveFrameBroadcast()
    stopCameraStream()
    submitSignalement()
  }
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (shouldOfferVideoProof && !videoPromptHandled && !hasRecordedVideo) {
      ensureAutomaticDescription(formData.type)
      setShowVideoPrompt(true)
      startVideoRecording({ type: formData.type, title: formData.titre || `Signalement : ${getTypeLabel(formData.type)}` })
      return
    }

    await submitSignalement()
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-300">Signalement citoyen</p>
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Documenter un incident a Sedhiou</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                Decrivez la situation, ajoutez votre position et joignez des preuves. Les alertes urgentes peuvent transmettre une video en direct a l'espace police.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                {['1. Details', '2. Position', '3. Preuves'].map((step) => (
                  <span key={step} className="rounded-full bg-white/15 px-3 py-1 text-slate-100">{step}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <form onSubmit={handleSubmit} noValidate className="space-y-7">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="mb-2 text-sm font-semibold text-red-600">Etape facile</p>
                <label className="block text-lg font-black text-slate-900 mb-2">Donnez un petit nom au probleme</label>
                <input type="text" name="titre" required value={formData.titre} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100" placeholder="Ex: Accident au marche" />
                <p className="mt-2 text-sm text-slate-500">Si vous ne savez pas ecrire, cliquez d abord sur un gros bouton ci-dessous.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Choisir avec un gros bouton</p>
                    <h2 className="text-2xl font-black text-slate-950">Qu est-ce qui se passe ?</h2>
                    <p className="mt-1 text-sm text-slate-500">Cliquez seulement sur l image qui ressemble au probleme.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakHelp('Choisissez le probleme. Violence si on attaque quelqu un. Accident si une personne est blessee. Vol si quelque chose a ete vole. Eclairage si la lumiere ne marche pas. Route si la route est abimee.')}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100"
                  >
                    Ecouter l aide
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_TYPES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleQuickType(item.value, item.label)}
                      className={`min-h-36 rounded-3xl border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${formData.type === item.value ? 'border-red-500 bg-red-50 shadow-lg ring-4 ring-red-100' : item.tone}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl font-black shadow-sm">{item.icon}</span>
                        {formData.type === item.value && <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Choisi</span>}
                      </div>
                      <div className="mt-4 text-xl font-black">{item.simple}</div>
                      <div className="mt-2 text-sm font-semibold opacity-75">{item.hint}</div>
                    </button>
                  ))}
                </div>
                <select name="type" required value={formData.type} onChange={handleChange} className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100">
                  <option value="violence">Violence</option>
                  <option value="vol">Vol</option>
                  <option value="accident">Accident</option>
                  <option value="probleme_eclairage">Problème éclairage</option>
                  <option value="nid_de_poule">Nid-de-poule</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="block text-lg font-black text-slate-900">Expliquez avec vos mots</label>
                  <button type="button" onClick={startDescriptionDictation} className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${isListening ? 'bg-red-600 text-white' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>
                    {isListening ? 'Je vous ecoute...' : 'Parler au telephone'}
                  </button>
                </div>
                <textarea name="description" required rows="5" value={formData.description} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 px-5 py-4 text-lg outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100" placeholder="Dites simplement ce qui se passe..."></textarea>
                <p className="mt-2 text-sm text-slate-500">Vous pouvez aussi ajouter une photo ou une video au lieu de beaucoup ecrire.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Localisation *</label>
                <input type="text" name="localisation" value={formData.localisation} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="Ex: Marché central, Sédhiou" />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button type="button" onClick={() => getAutomaticLocation()} className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">📍 Localiser</button>
                  <span className="text-sm text-gray-600 font-medium">{latitude != null && longitude != null ? `✓ ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Pas de localisation'}</span>
                </div>
                {geoError && <p className="text-sm text-red-600 mt-2">{geoError}</p>}
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <LeafletMap lat={latitude} lng={longitude} setLat={setLatitude} setLng={setLongitude} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Preuves (photos, vidéos, audio)</label>
                <input type="file" multiple accept="image/*,video/*,audio/*" onChange={handleFileChange} className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-red-600 file:px-4 file:py-2 file:font-semibold file:text-white" />
                {files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">{files.length} fichier(s) sélectionné(s)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filePreviews.map(({ file: f, url: objectUrl }, i) => {
                        const isImage = f.type.startsWith('image/')
                        const isVideo = f.type.startsWith('video/')
                        const isAudio = f.type.startsWith('audio/')
                        const sizeMB = (f.size / 1024 / 1024).toFixed(2)
                        
                        return (
                          <div key={i} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:shadow-md">
                            {/* Preview */}
                            <div className="group relative flex h-32 w-full items-center justify-center bg-slate-100">
                              {isImage && (
                                <img src={objectUrl} alt={f.name} className="w-full h-full object-cover" />
                              )}
                              {isVideo && (
                                <div className="text-4xl">🎥</div>
                              )}
                              {isAudio && (
                                <div className="text-4xl">🎵</div>
                              )}
                              {!isImage && !isVideo && !isAudio && (
                                <div className="text-4xl">📄</div>
                              )}
                              {/* Remove button overlay */}
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            </div>
                            {/* File info */}
                            <div className="p-2">
                              <p className="truncate text-xs font-semibold text-slate-900">{f.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{sizeMB} MB</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input type="checkbox" name="estAnonyme" id="anonyme" checked={formData.estAnonyme} onChange={handleChange} className="h-4 w-4" />
                <label htmlFor="anonyme" className="text-sm font-semibold text-slate-700">Signaler anonymement</label>
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="button" onClick={() => router.back()} className="flex-1 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Envoi...' : 'Signaler'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showVideoPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Voulez-vous filmer la preuve ?</h2>
            <p className="mt-2 text-sm text-gray-600">
              La camera affiche un apercu en direct. La video sera sauvegardee comme preuve avec une duree maximale de 3 minutes.
            </p>

            <div className="mt-4 overflow-hidden rounded-lg bg-gray-900">
              {recordingState === 'recording' || recordingState === 'saving' ? (
                <video ref={videoPreviewRef} autoPlay playsInline muted className="h-64 w-full object-cover" />
              ) : recordedVideoUrl ? (
                <video src={recordedVideoUrl} controls className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-gray-300">
                  Pret a demarrer l enregistrement
                </div>
              )}
            </div>

            {recordingError && <p className="mt-3 text-sm text-red-600">{recordingError}</p>}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {recordingState === 'recording' ? (
                <button type="button" onClick={stopVideoRecording} className="flex-1 rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700">
                  Arreter et sauvegarder
                </button>
              ) : (
                <button type="button" onClick={startVideoRecording} disabled={recordingState === 'saving' || loading} className="flex-1 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
                  {recordingState === 'saved' ? 'Refilmer' : recordingState === 'saving' ? 'Sauvegarde...' : 'Filmer maintenant'}
                </button>
              )}

              {recordingState === 'saved' ? (
                <button type="button" onClick={submitSignalement} disabled={loading} className="flex-1 rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60">
                  {loading ? 'Envoi...' : 'Envoyer avec la video'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={continueWithoutVideo}
                  disabled={recordingState === 'saving' || loading}
                  className="flex-1 rounded border px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Continuer sans video
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

