import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { Button, Card, FormField, Input } from '../components/ui'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import axios from 'axios'
import { API_BASE } from '../config/api'
import { motion } from 'framer-motion'

export default function Login() {
  const router = useRouter()
  const { login, fetchUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [rememberMe, setRememberMe] = useState(false)

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
    if (!googleClientId) return
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
        window.google.accounts.id.renderButton(document.getElementById('google-signin'), { theme: 'outline', size: 'large' })
      }
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
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
              className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-2xl mb-6"
            >
              <span className="text-3xl">🔐</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Connexion</h1>
            <p className="text-gray-600">Accédez à votre compte Signal-Moi</p>
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
                      icon={EnvelopeIcon}
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
                    icon={LockClosedIcon}
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
                <Link href="/forgot-password">
                  <a className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
                    Mot de passe oublié?
                  </a>
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
              id="google-signin" 
              className="flex justify-center"
            ></motion.div>
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
              <Link href="/register">
                <a className="font-bold text-indigo-600 hover:text-indigo-700 transition">
                  S'inscrire
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
        </div>
      </motion.div>
    </div>
  )
}
