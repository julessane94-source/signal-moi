import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import Navbar from '../../components/common/Navbar'
import { toast } from 'react-toastify'
import dynamic from 'next/dynamic'

const LeafletMap = dynamic(() => import('../../components/Map/LeafletMap'), { ssr: false })

export default function NewSignalement() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState([])
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: 'autre',
    localisation: '',
    estAnonyme: false
  })
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)

  useEffect(() => {
    // Try to get browser geolocation on mount
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
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
          }
        } catch (e) {
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
        }
      }, (err) => {
        // User denied geolocation
        console.log('Géolocalisation refusée par l\'utilisateur')
      })
    }
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFileChange = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!user || !user.id) {
        toast.error('Veuillez vous reconnecter')
        router.push('/login')
        return
      }

      const fd = new FormData()
      fd.append('titre', formData.titre)
      fd.append('description', formData.description)
      fd.append('type', formData.type)
      fd.append('localisation', formData.localisation)
      // append coordinates if available (from geolocation or map)
      if (latitude) fd.append('latitude', latitude)
      if (longitude) fd.append('longitude', longitude)

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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Nouveau signalement</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input type="text" name="titre" required value={formData.titre} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="ex: Nid-de-poule dangereux" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type d'incident *</label>
                <select name="type" required value={formData.type} onChange={handleChange} className="w-full border rounded px-3 py-2">
                  <option value="violence">Violence</option>
                  <option value="vol">Vol</option>
                  <option value="probleme_eclairage">Problème éclairage</option>
                  <option value="nid_de_poule">Nid-de-poule</option>
                  <option value="citoyenne">Citoyenne</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea name="description" required rows="4" value={formData.description} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Décrivez votre signalement en détail..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Localisation *</label>
                <input type="text" name="localisation" required value={formData.localisation} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Ex: Carrefour Mvan, Yaoundé" />
                <div className="mt-2 flex gap-2 items-center">
                  <button type="button" onClick={() => {
                    if (navigator && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        const lat = pos.coords.latitude
                        const lng = pos.coords.longitude
                        setLatitude(lat)
                        setLongitude(lng)
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                          if (res.ok) {
                            const data = await res.json()
                            setFormData(prev => ({ ...prev, localisation: prev.localisation || data.display_name }))
                            toast.success('📍 Localisation trouvée !')
                          } else {
                            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
                            toast.success('📍 Localisation trouvée (coordonnées GPS)')
                          }
                        } catch (e) {
                          setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
                          toast.success('📍 Localisation trouvée (coordonnées GPS)')
                        }
                      }, (err) => {
                        toast.error('Accès à la géolocalisation refusé')
                      })
                    } else {
                      toast.error('Géolocalisation non prise en charge')
                    }
                  }} className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium">📍 Localiser</button>
                  <span className="text-sm text-gray-600 font-medium">{latitude && longitude ? `✓ ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Pas de localisation'}</span>
                </div>
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
    </>
  )
}
