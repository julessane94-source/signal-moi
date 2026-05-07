import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Register() {
  const router = useRouter()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    ville: '',
    quartier: '',
    dateNaissance: '',
    lieuNaissance: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.prenom) newErrors.prenom = 'Prenom requis'
    if (!formData.nom) newErrors.nom = 'Nom requis'
    if (!formData.email) newErrors.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide'
    if (!formData.telephone) newErrors.telephone = 'Telephone requis'
    if (!formData.password) newErrors.password = 'Mot de passe requis'
    else if (formData.password.length < 6) newErrors.password = '6 caracteres minimum'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    if (!formData.ville) newErrors.ville = 'Ville requise'
    if (!formData.quartier) newErrors.quartier = 'Quartier requis'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    const { confirmPassword, ...submitData } = formData
    const success = await register(submitData)
    setLoading(false)
    if (success) router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚨</div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Creer un compte
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Rejoignez la communaute Signal-Moi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prenom *</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.prenom ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom *</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.nom ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telephone *</label>
              <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.telephone ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mot de passe *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirmer mot de passe *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Ville *</label>
              <input type="text" name="ville" value={formData.ville} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.ville ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.ville && <p className="mt-1 text-sm text-red-600">{errors.ville}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quartier *</label>
              <input type="text" name="quartier" value={formData.quartier} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.quartier ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.quartier && <p className="mt-1 text-sm text-red-600">{errors.quartier}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Deja un compte ? <Link href="/login" className="font-medium text-indigo-600">Connectez-vous</Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  )
}