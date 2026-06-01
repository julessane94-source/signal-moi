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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="p-8">
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl mb-4 inline-block"
            >
              🚨
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mt-4">Créer un compte</h2>
            <p className="mt-2 text-gray-600">Rejoignez la communauté Signal-Moi</p>
            
            {/* Progress indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {[1, 2, 3].map(num => (
                <motion.div
                  key={num}
                  className={`h-2 rounded-full transition-all ${
                    num <= step ? 'bg-indigo-600 w-8' : 'bg-gray-300 w-2'
                  }`}
                  animate={{ width: num <= step ? 32 : 8 }}
                />
              ))}
            </div>
          </div>
          <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-100">Inscription</p>
            <p className="mt-3 text-lg leading-7">Créez un compte sécurisé pour participer aux signalements et aux campagnes citoyennes.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Informations personnelles */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations personnelles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Prénom" error={errors.prenom} required>
                    <Input
                      name="prenom"
                      placeholder="Jean"
                      value={formData.prenom}
                      onChange={handleChange}
                      icon={UserIcon}
                      error={!!errors.prenom}
                    />
                  </FormField>
                  <FormField label="Nom" error={errors.nom} required>
                    <Input
                      name="nom"
                      placeholder="Dupont"
                      value={formData.nom}
                      onChange={handleChange}
                      icon={UserIcon}
                      error={!!errors.nom}
                    />
                  </FormField>
                </div>
                <FormField label="Email" error={errors.email} required>
                  <Input
                    type="email"
                    name="email"
                    placeholder="exemple@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    icon={EnvelopeIcon}
                    error={!!errors.email}
                  />
                </FormField>
              </motion.div>
            )}

            {/* Step 2: Mot de passe et sécurité */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Sécurité du compte</h3>
                <FormField label="Mot de passe" error={errors.password} required helperText="Minimum 8 caractères">
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    icon={LockClosedIcon}
                    error={!!errors.password}
                  />
                </FormField>
                <FormField label="Confirmer le mot de passe" error={errors.confirmPassword} required>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    icon={LockClosedIcon}
                    error={!!errors.confirmPassword}
                  />
                </FormField>
              </motion.div>
            )}

            {/* Step 3: Localisation */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Localisation</h3>
                <FormField label="Téléphone" error={errors.telephone} required>
                  <Input
                    type="tel"
                    name="telephone"
                    placeholder="+237 6xx xxx xxx"
                    value={formData.telephone}
                    onChange={handleChange}
                    icon={PhoneIcon}
                    error={!!errors.telephone}
                  />
                </FormField>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Ville" error={errors.ville} required>
                    <Input
                      name="ville"
                      placeholder="Yaoundé"
                      value={formData.ville}
                      onChange={handleChange}
                      icon={MapPinIcon}
                      error={!!errors.ville}
                    />
                  </FormField>
                  <FormField label="Quartier" error={errors.quartier} required>
                    <Input
                      name="quartier"
                      placeholder="Centre-ville"
                      value={formData.quartier}
                      onChange={handleChange}
                      icon={MapPinIcon}
                      error={!!errors.quartier}
                    />
                  </FormField>
                </div>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-6">
              {step > 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handlePrevStep}
                >
                  Précédent
                </Button>
              )}
              {step < 3 ? (
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleNextStep}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="submit"
                  loading={loading}
                  className="flex-1"
                >
                  S'inscrire
                </Button>
              )}
            </div>
          </form>

          <div className="text-center pt-4">
            <p className="text-gray-700">
              Vous avez déjà un compte?{' '}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition">
                Connectez-vous
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-xs text-center text-gray-500 mt-4">
          © 2024 Signal-Moi. Tous les droits réservés.
        </p>
      </motion.div>
    </div>
  )
}