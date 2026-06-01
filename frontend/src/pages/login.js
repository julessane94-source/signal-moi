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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
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
            <h2 className="text-3xl font-bold text-gray-900 mt-4">Connexion</h2>
            <p className="mt-2 text-gray-600">Connectez-vous à votre compte Signal-Moi</p>
          </div>

          <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-100">Accès sécurisé</p>
            <p className="mt-3 text-lg leading-7">Entrez vos identifiants pour gérer vos signalements et suivre l'activité locale.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
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

            <FormField label="Mot de passe" error={errors.password} required>
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

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-700">Se souvenir de moi</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
                Mot de passe oublié?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Se connecter
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continuez avec</span>
              </div>
            </div>

            <div id="google-signin" className="mt-6"></div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-700">
              Vous n'avez pas de compte?{' '}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 transition">
                S'inscrire
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
