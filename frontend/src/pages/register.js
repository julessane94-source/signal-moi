import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { Button, Card, FormField, Input } from '../components/ui'
import { UserIcon, EnvelopeIcon, LockClosedIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

export default function Register() {
  const router = useRouter()
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
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

  const validateStep = (stepNum) => {
    const newErrors = {}
    if (stepNum === 1) {
      if (!formData.prenom) newErrors.prenom = 'Prénom requis'
      if (!formData.nom) newErrors.nom = 'Nom requis'
      if (!formData.email) newErrors.email = 'Email requis'
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide'
    }
    if (stepNum === 2) {
      if (!formData.password) newErrors.password = 'Mot de passe requis'
      else if (formData.password.length < 8) newErrors.password = '8 caractères minimum'
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
      }
    }
    if (stepNum === 3) {
      if (!formData.telephone) newErrors.telephone = 'Téléphone requis'
      if (!formData.ville) newErrors.ville = 'Ville requise'
      if (!formData.quartier) newErrors.quartier = 'Quartier requis'
    }
    return newErrors
  }

  const handleNextStep = () => {
    const stepErrors = validateStep(step)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const stepErrors = validateStep(3)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    setLoading(true)
    const { confirmPassword, ...submitData } = formData
    const success = await register(submitData)
    setLoading(false)
    if (success) router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-2xl mb-6"
          >
            <span className="text-3xl">✨</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Rejoignez-nous</h1>
          <p className="text-gray-600">Créez un compte pour participer à la communauté Signal-Moi</p>
        </div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {[1, 2, 3].map(num => (
            <motion.div
              key={num}
              className={`h-2 rounded-full transition-all ${
                num <= step 
                  ? 'bg-indigo-600' 
                  : 'bg-gray-300'
              }`}
              animate={{ width: num <= step ? 32 : 8 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        {/* Main Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8 md:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Informations personnelles</h3>
                  <p className="text-gray-600">Commençons par vos informations de base</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <FormField label="Prénom" error={errors.prenom} required>
                      <Input
                        name="prenom"
                        placeholder="Jean"
                        value={formData.prenom}
                        onChange={handleChange}
                        icon={UserIcon}
                        error={!!errors.prenom}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                      />
                    </FormField>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <FormField label="Nom" error={errors.nom} required>
                      <Input
                        name="nom"
                        placeholder="Dupont"
                        value={formData.nom}
                        onChange={handleChange}
                        icon={UserIcon}
                        error={!!errors.nom}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                      />
                    </FormField>
                  </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <FormField label="Adresse Email" error={errors.email} required>
                    <Input
                      type="email"
                      name="email"
                      placeholder="vous@exemple.com"
                      value={formData.email}
                      onChange={handleChange}
                      icon={EnvelopeIcon}
                      error={!!errors.email}
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                    />
                  </FormField>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Security */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Sécurité du compte</h3>
                  <p className="text-gray-600">Créez un mot de passe fort et sécurisé</p>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <FormField label="Mot de Passe" error={errors.password} required helperText="Minimum 8 caractères">
                    <Input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      icon={LockClosedIcon}
                      error={!!errors.password}
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                    />
                  </FormField>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <FormField label="Confirmer le Mot de Passe" error={errors.confirmPassword} required>
                    <Input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      icon={LockClosedIcon}
                      error={!!errors.confirmPassword}
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                    />
                  </FormField>
                </motion.div>

                {/* Password strength indicator */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-700 mb-3">Critères de sécurité :</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={formData.password.length >= 8 ? "text-green-500" : "text-gray-500"}>✓</span>
                      <span className="text-sm text-gray-400">Au moins 8 caractères</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Localisation</h3>
                  <p className="text-gray-600">Où êtes-vous basé?</p>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <FormField label="Numéro de Téléphone" error={errors.telephone} required>
                    <Input
                      type="tel"
                      name="telephone"
                      placeholder="+221 7XX XXX XXX"
                      value={formData.telephone}
                      onChange={handleChange}
                      icon={PhoneIcon}
                      error={!!errors.telephone}
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                    />
                  </FormField>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <FormField label="Ville" error={errors.ville} required>
                      <Input
                        name="ville"
                        placeholder="Dakar"
                        value={formData.ville}
                        onChange={handleChange}
                        icon={MapPinIcon}
                        error={!!errors.ville}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                      />
                    </FormField>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <FormField label="Quartier" error={errors.quartier} required>
                      <Input
                        name="quartier"
                        placeholder="Centre-ville"
                        value={formData.quartier}
                        onChange={handleChange}
                        icon={MapPinIcon}
                        error={!!errors.quartier}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                      />
                    </FormField>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3 pt-6"
            >
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-300"
                  onClick={handlePrevStep}
                >
                  ← Précédent
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg"
                  onClick={handleNextStep}
                >
                  Suivant →
                </Button>
              ) : (
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg"
                >
                  {loading ? 'Inscription...' : 'Créer mon compte'}
                </Button>
              )}
            </motion.div>
          </form>
        </motion.div>

        {/* Sign In Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <p className="text-gray-300">
            Vous avez déjà un compte?{' '}
            <Link href="/login">
              <a className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 transition">
                Connectez-vous
              </a>
            </Link>
          </p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-center text-gray-500 mt-8"
        >
          © 2026 Signal-Moi. Tous les droits réservés.
        </motion.p>
      </motion.div>
    </div>
  )
}