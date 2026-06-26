import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { toast } from 'react-toastify'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('../../components/Map/LeafletMap.jsx'), {
  ssr: false,
  loading: () => <div className="w-full h-80 rounded bg-gray-100 animate-pulse" />
})

const QUICK_TYPES = [
  { value: 'probleme_eclairage', label: 'Éclairage', icon: '💡', hint: 'Lampadaires, éclairage public' },
  { value: 'nid_de_poule', label: 'Nid-de-poule', icon: '🕳️', hint: 'Routes, chaussées, trous' },
  { value: 'vol', label: 'Vol', icon: '💰', hint: 'Vol, cambriolage, objet volé' },
  { value: 'violence', label: 'Violence', icon: '⚠️', hint: 'Conflit, intimidation, agression' },
  { value: 'accident', label: 'Accident', icon: '!', hint: 'Accident, blessure, danger immediat' },
  { value: 'autre', label: 'Autre', icon: '📌', hint: 'Autre incident à préciser' }
]

const VIDEO_PROMPT_TYPES = ['violence', 'accident', 'vol']
const MAX_RECORDING_MS = 3 * 60 * 1000

export default function NewSignalement() {
  const { user } = useAuth()
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
  const mediaRecorderRef = useRef(null)
  const recordingChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const videoPreviewRef = useRef(null)
  const recordedVideoNameRef = useRef(null)
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
      return null
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

        setFormData(prev => ({ ...prev, localisation: prev.localisation || localisation, latitude: lat, longitude: lng }))
        if (!silent) toast.success('Localisation automatique trouvee')
        resolve({ latitude: lat, longitude: lng, localisation })
      }, (err) => {
        if (err.code === 1) {
          if (!silent) toast.error('Acces a la geolocalisation refuse')
          setGeoError('Autorisez la localisation du site dans le navigateur, puis cliquez sur Localiser.')
        } else {
          if (!silent) toast.error('Impossible de recuperer la geolocalisation')
          setGeoError('Impossible de recuperer la geolocalisation automatiquement.')
        }
        console.log('Geolocalisation erreur:', err)
        resolve(null)
      }, {
        enableHighAccuracy: true,
        timeout: 15000,
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
    }
  }

  const handleQuickType = (type, label) => {
    setFormData(prev => ({
      ...prev,
      type,
      titre: prev.titre || `Signalement : ${label}`
    }))
    setVideoPromptHandled(false)
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
      return null
    })
  }

  const getRecordingMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return ''
    const candidates = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) || ''
  }

  const startVideoRecording = async () => {
    setRecordingError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setRecordingError('Votre navigateur ne permet pas de filmer directement depuis cette page.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const mimeType = getRecordingMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recordingChunksRef.current = []
      mediaRecorderRef.current = recorder
      setLiveStream(stream)
      setRecordingState('recording')

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
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
        stopCameraStream()
      }

      recorder.start()
      recordingTimerRef.current = setTimeout(() => {
        stopVideoRecording()
      }, MAX_RECORDING_MS)
    } catch (error) {
      console.error('[VideoRecording] Error:', error)
      setRecordingState('idle')
      setRecordingError('Impossible d acceder a la camera. Verifiez les permissions puis reessayez.')
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.titre.trim() || !formData.description.trim() || !formData.type) {
      toast.error('Veuillez renseigner le titre, la description et le type.')
      return
    }

    if (shouldOfferVideoProof && !videoPromptHandled && !hasRecordedVideo) {
      setShowVideoPrompt(true)
      return
    }

    await submitSignalement()
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Nouveau signalement</h1>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input type="text" name="titre" required value={formData.titre} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="ex: Nid-de-poule dangereux" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type d'incident *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                  {QUICK_TYPES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleQuickType(item.value, item.label)}
                      className={`rounded-xl border p-3 text-left transition ${formData.type === item.value ? 'border-red-500 bg-red-50 shadow-sm' : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50'}`}
                    >
                      <div className="text-lg">{item.icon}</div>
                      <div className="font-semibold text-sm text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.hint}</div>
                    </button>
                  ))}
                </div>
                <select name="type" required value={formData.type} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="violence">Violence</option>
                  <option value="vol">Vol</option>
                  <option value="accident">Accident</option>
                  <option value="probleme_eclairage">Problème éclairage</option>
                  <option value="nid_de_poule">Nid-de-poule</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Décrivez votre signalement en détail..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Localisation *</label>
                <input type="text" name="localisation" value={formData.localisation} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Ex: Carrefour Mvan, Yaoundé" />
                <div className="mt-2 flex gap-2 items-center">
                  <button type="button" onClick={() => getAutomaticLocation()} className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">📍 Localiser</button>
                  <span className="text-sm text-gray-600 font-medium">{latitude != null && longitude != null ? `✓ ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Pas de localisation'}</span>
                </div>
                {geoError && <p className="text-sm text-red-600 mt-2">{geoError}</p>}
                <div className="mt-3">
                  <LeafletMap lat={latitude} lng={longitude} setLat={setLatitude} setLng={setLongitude} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preuves (photos, vidéos, audio)</label>
                <input type="file" multiple accept="image/*,video/*,audio/*" onChange={handleFileChange} className="w-full" />
                {files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">{files.length} fichier(s) sélectionné(s)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {files.map((f, i) => {
                        const isImage = f.type.startsWith('image/')
                        const isVideo = f.type.startsWith('video/')
                        const isAudio = f.type.startsWith('audio/')
                        const objectUrl = URL.createObjectURL(f)
                        const sizeMB = (f.size / 1024 / 1024).toFixed(2)
                        
                        return (
                          <div key={i} className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition">
                            {/* Preview */}
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center relative group">
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
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                              >
                                ✕
                              </button>
                            </div>
                            {/* File info */}
                            <div className="p-2">
                              <p className="text-xs font-medium text-gray-900 truncate">{f.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{sizeMB} MB</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="estAnonyme" id="anonyme" checked={formData.estAnonyme} onChange={handleChange} className="h-4 w-4" />
                <label htmlFor="anonyme" className="ml-2 text-sm text-gray-700">Signaler anonymement</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => router.back()} className="flex-1 border rounded py-2">Annuler</button>
                <button type="submit" disabled={loading} className="flex-1 bg-red-600 text-white rounded py-2">{loading ? 'Envoi...' : 'Signaler'}</button>
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
                  onClick={() => {
                    setVideoPromptHandled(true)
                    setShowVideoPrompt(false)
                    stopCameraStream()
                    submitSignalement()
                  }}
                  disabled={recordingState === 'recording' || recordingState === 'saving' || loading}
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
