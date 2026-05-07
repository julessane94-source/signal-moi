import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'

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
    setFiles([...files, ...Array.from(e.target.files)])
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== '') {
          formDataToSend.append(key, formData[key])
        }
      })
      
      files.forEach(file => {
        formDataToSend.append('fichiers', file)
      })

      const response = await fetch('http://localhost:5000/api/signalements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      if (response.ok) {
        router.push('/citizen/dashboard')
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la creation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la creation du signalement')
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
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  name="titre"
                  required
                  value={formData.titre}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Nid-de-poule dangereux"
                />
              </div>

              {/* Type d'incident */}
              <div>
                <label className="block text-sm font-medium mb-1">Type d'incident *</label>
                <select
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="violence">Violence</option>
                  <option value="vol">Vol</option>
                  <option value="probleme_eclairage">Probleme d'eclairage</option>
                  <option value="nid_de_poule">Nid-de-poule</option>
                  <option value="incendie">Incendie</option>
                  <option value="accident">Accident</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  name="description"
                  required
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Decrivez precisement l'incident..."
                />
              </div>

              {/* Lieu */}
              <div>
                <label className="block text-sm font-medium mb-1">Lieu *</label>
                <input
                  type="text"
                  name="localisation"
                  required
                  value={formData.localisation}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Carrefour Mvan, Yaounde"
                />
              </div>

              {/* Preuves */}
              <div>
                <label className="block text-sm font-medium mb-1">Preuves (photos, videos, audio)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                        <span className="text-sm">{f.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-red-500">Supprimer</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonyme */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="estAnonyme"
                  id="anonyme"
                  checked={formData.estAnonyme}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="anonyme" className="ml-2 text-sm text-gray-700">
                  Signaler anonymement
                </label>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? 'Envoi...' : 'Signaler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}