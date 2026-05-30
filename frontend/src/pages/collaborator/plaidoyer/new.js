import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from '../../../components/common/Navbar'
import { API_BASE } from '../../../config/api'
import { toast } from 'react-toastify'

export default function NewPlaidoyer() {
  const router = useRouter()
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [categorie, setCategorie] = useState('')
  const [objectifSignatures, setObjectifSignatures] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!titre.trim()) nextErrors.titre = 'Le titre est requis.'
    if (!description.trim()) nextErrors.description = 'La description est requise.'
    if (!categorie) nextErrors.categorie = 'La catégorie est requise.'
    if (!objectifSignatures || objectifSignatures <= 0) nextErrors.objectifSignatures = 'Objectif signatures invalide.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setServerError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/plaidoyers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titre: titre.trim(),
          description: description.trim(),
          categorie,
          objectif_signatures: objectifSignatures
        })
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('✅ Plaidoyer créé avec succès')
        router.push('/collaborator/dashboard')
      } else {
        const err = await res.json().catch(() => null)
        setServerError(err?.error || err?.message || 'Erreur lors de la création du plaidoyer.')
        toast.error(err?.error || err?.message || 'Erreur lors de la création du plaidoyer.')
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
      <Navbar />
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-xl shadow p-8">
            <h1 className="text-3xl font-bold mb-4">Créer un plaidoyer</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Titre</label>
                <input
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-3"
                  placeholder="Ex: Pour des écoles plus sûres"
                />
                {errors.titre && <p className="text-red-600 text-sm mt-1">{errors.titre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full border rounded-md p-3 h-36"
                  placeholder="Décrivez l'objectif du plaidoyer et ses bénéfices pour les citoyens"
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="mt-1 block w-full border rounded-md p-3"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="sécurité">Sécurité</option>
                    <option value="justice">Justice</option>
                    <option value="environnement">Environnement</option>
                    <option value="santé">Santé</option>
                    <option value="éducation">Éducation</option>
                    <option value="autre">Autre</option>
                  </select>
                  {errors.categorie && <p className="text-red-600 text-sm mt-1">{errors.categorie}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Objectif de signatures</label>
                  <input
                    type="number"
                    value={objectifSignatures}
                    onChange={(e) => setObjectifSignatures(Number(e.target.value))}
                    className="mt-1 block w-full border rounded-md p-3"
                    min="10"
                  />
                  {errors.objectifSignatures && <p className="text-red-600 text-sm mt-1">{errors.objectifSignatures}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading ? 'Création...' : 'Créer le plaidoyer'}
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
                  onClick={() => router.push('/collaborator/dashboard')}
                >
                  Annuler
                </button>
              </div>

              {serverError && <p className="text-red-600">{serverError}</p>}
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
