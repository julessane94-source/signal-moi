import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button, FormField, Input } from '../components/ui'
import { EnvelopeIcon as Envelope, CheckCircleIcon as CheckCircle, ArrowLeftIcon as ArrowLeft } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { API_BASE } from '../config/api'

export default function ForgotPassword() {
  const router = useRouter()
  const [step, setStep] = useState('email') // 'email', 'code', 'reset'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
  })

  // Initialize Google Sign-In
  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!googleClientId) return
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            const res = await fetch(`${API_BASE}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: response.credential })
            })
            if (res.ok) {
              const body = await res.json()
              const token = body.token
              if (token) {
                localStorage.setItem('token', token)
                router.push('/')
              }
            }
          } catch (err) {
            console.error('Erreur Google sign-in:', err)
            setError('Erreur lors de la connexion Google')
          }
        }
      })
      if (document.getElementById('google-signin')) {
        window.google.accounts.id.renderButton(document.getElementById('google-signin'), { theme: 'outline', size: 'large' })
      }
    } else if (typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              try {
                const res = await fetch(`${API_BASE}/api/auth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken: response.credential })
                })
                if (res.ok) {
                  const body = await res.json()
                  const token = body.token
                  if (token) {
                    localStorage.setItem('token', token)
                    router.push('/')
                  }
                }
              } catch (err) {
                console.error('Erreur Google sign-in:', err)
                setError('Erreur lors de la connexion Google')
              }
            }
          })
          window.google.accounts.id.renderButton(document.getElementById('google-signin'), { theme: 'outline', size: 'large' })
        }
      }
      document.body.appendChild(script)
      return () => { document.body.removeChild(script) }
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email) {
      setError('Email requis')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()
      if (response.ok) {
        setMessage('Code de réinitialisation envoyé à votre email')
        setStep('code')
      } else {
        setError(data.message || 'Erreur lors de l\'envoi du code')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!formData.code) {
      setError('Code requis')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code
        })
      })

      const data = await response.json()
      if (response.ok) {
        setMessage('Code valide. Définissez votre nouveau mot de passe.')
        setStep('reset')
      } else {
        setError(data.message || 'Code invalide')
      }
    } catch (err) {
      setError('Erreur lors de la vérification du code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    if (!formData.password || !formData.confirmPassword) {
      setError('Tous les champs sont requis')
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          password: formData.password
        })
      })

      const data = await response.json()
      if (response.ok) {
        setMessage('Mot de passe réinitialisé avec succès!')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError(data.message || 'Erreur lors de la réinitialisation')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mb-6"
          >
            <span className="text-3xl">🔑</span>
          </motion.div>
          <div className="mb-4">
            <span className="inline-block text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Signal-Moi</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Réinitialiser votre mot de passe</h1>
          <p className="text-gray-600">Ré initialis ez votre mot de passe en quelques étapes simples et sécurisées</p>
        </div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {['email', 'code', 'reset'].map((s, idx) => (
            <motion.div
              key={s}
              className={`h-2 rounded-full transition-all ${
                ['email', 'code', 'reset'].indexOf(step) >= idx
                  ? 'bg-indigo-600'
                  : 'bg-gray-300'
              }`}
              animate={{
                width: ['email', 'code', 'reset'].indexOf(step) >= idx ? 32 : 8
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        {/* Main Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8"
        >
          {/* Success Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-700">{message}</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-red-700">{error}</p>
            </motion.div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <motion.form
              onSubmit={handleEmailSubmit}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Étape 1: Vérification</h3>
                <p className="text-gray-600 text-sm">Entrez votre adresse email pour recevoir un code de réinitialisation</p>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <FormField label="Adresse Email" required>
                  <Input
                    type="email"
                    name="email"
                    placeholder="vous@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    icon={Envelope}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                  />
                </FormField>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Envoyer le code
                </Button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative my-6"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Ou continuez avec</span>
                </div>
              </motion.div>

              {/* Google Sign-In Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div id="google-signin"></div>
              </motion.div>
            </motion.form>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <motion.form
              onSubmit={handleCodeSubmit}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Étape 2: Code de confirmation</h3>
                <p className="text-gray-600 text-sm">Vérifiez votre email et entrez le code reçu</p>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <FormField label="Code de réinitialisation" required>
                  <Input
                    type="text"
                    name="code"
                    placeholder="000000"
                    value={formData.code}
                    onChange={handleChange}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500 text-center text-lg tracking-widest"
                  />
                </FormField>
              </motion.div>

              <div className="flex gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour
                </motion.button>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1"
                >
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    Vérifier le code
                  </Button>
                </motion.div>
              </div>
            </motion.form>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <motion.form
              onSubmit={handleResetSubmit}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Étape 3: Nouveau mot de passe</h3>
                <p className="text-gray-600 text-sm">Définissez un mot de passe fort et sécurisé</p>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <FormField label="Nouveau mot de passe" required helperText="Minimum 8 caractères">
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                  />
                </FormField>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <FormField label="Confirmer le mot de passe" required>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                  />
                </FormField>
              </motion.div>

              <div className="flex gap-3">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  type="button"
                  onClick={() => setStep('code')}
                  className="flex-1 flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour
                </motion.button>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex-1"
                >
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
                  >
                    Réinitialiser le mot de passe
                  </Button>
                </motion.div>
              </div>
            </motion.form>
          )}

          {/* Back to Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-8"
          >
            <p className="text-gray-600">
              Vous vous souvenez de votre mot de passe?{' '}
              <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition">
                  Se connecter
                </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
