import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

import { Button, Card } from '../../../components/ui'
import { toast } from 'react-toastify'
import { API_BASE } from '../../../config/api'

export default function NewCampagne() {
  const router = useRouter()
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('formation')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [lieu, setLieu] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    // simple guard: if no token, redirect to login
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'L\'image ne doit pas dépasser 5MB' }))
        return
      }
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
      setErrors(prev => ({ ...prev, image: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const nextErrors = {}
    if (!titre || titre.trim().length < 3) nextErrors.titre = 'Le titre doit contenir au moins 3 caractères.'
    if (!type) nextErrors.type = 'Le type est requis.'
    if (!lieu || !lieu.trim()) nextErrors.lieu = 'Le lieu est requis.'
    if (!dateDebut) nextErrors.dateDebut = 'La date de début est requise.'
    if (!dateFin) nextErrors.dateFin = 'La date de fin est requise.'
    if (dateDebut && dateFin && new Date(dateDebut) > new Date(dateFin)) nextErrors.dateFin = 'La date de fin doit être après la date de début.'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('titre', titre)
      formData.append('description', description)
      formData.append('type', type)
      formData.append('dateDebut', dateDebut)
      formData.append('dateFin', dateFin)
      formData.append('lieu', lieu)
      if (image) {
        formData.append('image', image)
      }

      const res = await fetch(`${API_BASE}/api/collaborator/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (res.status === 201) {
        const data = await res.json()
        toast.success('✅ Campagne créée')
        if (data && data.id) {
          router.push(`/campagnes/${data.id}`)
        } else {
          router.push('/collaborator/dashboard')
        }
      } else {
        let errText = 'Erreur création'
        try {
          const err = await res.json()
          errText = err.error || err.message || JSON.stringify(err)
        } catch (parseErr) {
          errText = res.statusText || 'Erreur serveur'
        }
        console.error('Création campagne erreur', errText)
        setServerError(errText)
        toast.error(errText)
      }
    } catch (err) {
      console.error(err)
      setServerError('Erreur réseau')
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="p-8 mt-8">
            <h1 className="text-2xl font-bold mb-4">Créer une campagne</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Titre</label>
                <input value={titre} onChange={(e) => setTitre(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                {errors.titre && <p className="text-red-600 text-sm mt-1">{errors.titre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full border rounded-md p-2 h-32" />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Image de la campagne</label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="block w-full border rounded-md p-2 text-sm" 
                    />
                    {errors.image && <p className="text-red-600 text-sm mt-1">{errors.image}</p>}
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF (max 5MB)</p>
                  </div>
                  {imagePreview && (
                    <div className="flex-shrink-0">
                      <img src={imagePreview} alt="Aperçu" className="h-20 w-20 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full border rounded-md p-2">
                    <option value="formation">Formation</option>
                    <option value="activite">Activité</option>
                    <option value="sensibilisation">Sensibilisation</option>
                    <option value="marche">Marche</option>
                    <option value="conference">Conférence</option>
                    <option value="autre">Autre</option>
                  </select>
                  {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lieu</label>
                  <input value={lieu} onChange={(e) => setLieu(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                  {errors.lieu && <p className="text-red-600 text-sm mt-1">{errors.lieu}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date début</label>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                  {errors.dateDebut && <p className="text-red-600 text-sm mt-1">{errors.dateDebut}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date fin</label>
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="mt-1 block w-full border rounded-md p-2" />
                  {errors.dateFin && <p className="text-red-600 text-sm mt-1">{errors.dateFin}</p>}
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="px-4">{loading ? 'Création...' : 'Créer'}</Button>
                <Button type="button" variant="secondary" onClick={() => router.push('/collaborator/dashboard')}>Annuler</Button>
              </div>
              {serverError && <p className="text-red-600 mt-2">{serverError}</p>}
            </form>
          </Card>
        </div>
      </div>
    </>
  )
}
