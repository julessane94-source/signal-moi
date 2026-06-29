import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { Button, Card, FormField, Input } from '../components/ui'
import { EnvelopeIcon as Envelope, LockClosedIcon as LockClosed } from '@heroicons/react/24/outline'
import axios from 'axios'
import { API_BASE } from '../config/api'
import { motion } from 'framer-motion'

function GoogleLogo() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  )
}

export default function Login() {
  const router = useRouter()
  const { login, fetchUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [googleMessage, setGoogleMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide'
    if (!formData.password) newErrors.password = 'Mot de passe requis'
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
    const success = await login(formData.email, formData.password)
    setLoading(false)
    if (success) {
      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email)
      }
      router.push('/')
    }
  }

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail')
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!googleClientId) {
      setGoogleMessage('Connexion Google en attente de configuration.')
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              const idToken = response.credential
              const res = await fetch(`${API_BASE}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
              })
              if (!res.ok) {
                console.error('Google auth failed')
                return
              }
              const body = await res.json()
              const token = body.token
              if (token) {
                localStorage.setItem('token', token)
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
                await fetchUser()
                router.push('/')
              }
            } catch (err) {
              console.error('Erreur Google sign-in:', err)
            }
          }
        })
        const googleContainer = document.getElementById('google-signin')
        if (googleContainer) {
          window.google.accounts.id.renderButton(googleContainer, { theme: 'outline', size: 'large', width: 320 })
          setGoogleReady(true)
          setGoogleMessage('')
        }
      } else {
        setGoogleMessage('Google Sign-In est indisponible pour le moment.')
      }
    }
    script.onerror = () => setGoogleMessage('Impossible de charger Google Sign-In.')
    document.body.appendChild(script)
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto flex items-center justify-center min-h-screen"
      >
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-6"
            >
              <span className="text-3xl">🔐</span>
            </motion.div>
            <div className="mb-4">
              <span className="inline-block text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Signal-Moi</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Connexion sécurisée</h1>
            <p className="text-gray-600">Connectez-vous à votre compte pour signaler et suivre les incidents de votre communauté</p>
          </div>

          {/* Main Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <FormField label="Adresse Email" error={errors.email} required>
                  <div className="relative">
                    <Input
                      type="email"
                      name="email"
                      placeholder="vous@exemple.com"
                      value={formData.email}
                      onChange={handleChange}
                      icon={Envelope}
                      error={!!errors.email}
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </FormField>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <FormField label="Mot de Passe" error={errors.password} required>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    icon={LockClosed}
                    error={!!errors.password}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-500"
                  />
                </FormField>
              </motion.div>

              {/* Remember & Forgot */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 bg-white border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition">Se souvenir de moi</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
                    Mot de passe oublié?
                  </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button 
                  type="submit" 
                  loading={loading} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
                >
                  Se connecter
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative my-8"
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Ou continuez avec</span>
              </div>
            </motion.div>

            {/* Google Sign In */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <div id="google-signin" className={googleReady ? 'flex justify-center' : 'hidden'}></div>
              {!googleReady && (
                <button
                  type="button"
                  disabled
                  className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm"
                >
                  <GoogleLogo />
                  Continuer avec Google
                </button>
              )}
              {googleMessage && (
                <p className="text-center text-xs text-amber-700">{googleMessage}</p>
              )}
            </motion.div>
          </motion.div>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-8"
          >
            <p className="text-gray-600">
              Vous n'avez pas de compte?{' '}
              <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700 transition">
                  S'inscrire
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
        </div>
      </motion.div>
    </div>
  )
}
