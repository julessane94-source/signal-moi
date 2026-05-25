import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import Navbar from '../../components/common/Navbar'
import { toast } from 'react-toastify'

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
      if (formData.latitude) fd.append('latitude', formData.latitude)
      if (formData.longitude) fd.append('longitude', formData.longitude)

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
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preuves (photos, vidéos, audio)</label>
                <input type="file" multiple accept="image/*,video/*,audio/*" onChange={handleFileChange} className="w-full" />
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex justify-between bg-gray-100 p-2 rounded">
                        <span>{f.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-red-500">Supprimer</button>
                      </div>
                    ))}
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
