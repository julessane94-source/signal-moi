import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('https://signal-moi-api.onrender.com/api/auth/profile')
      setUser(response.data)
    } catch (error) {
      console.error('Erreur chargement profil:', error)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('https://signal-moi-api.onrender.com/api/auth/login', { email, password })
      
      console.log('Login response:', response.data)
      
      const { token, refreshToken, user: userData } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('refreshToken', refreshToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(userData)
      toast.success(`Bienvenue ${userData.prenom} !`)
      
      // Redirection selon le role
      const roleRoutes = {
        admin: '/admin/dashboard',
        police: '/police/dashboard',
        collaborateur: '/collaborator/dashboard',
        citoyen: '/citizen/dashboard'
      }
      
      const redirectPath = roleRoutes[userData.role] || '/'
      router.push(redirectPath)
      
      return true
    } catch (error) {
      console.error('Login error:', error.response?.data)
      toast.error(error.response?.data?.error || 'Erreur de connexion')
      return false
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('https://signal-moi-api.onrender.com/api/auth/register', userData)
      const { token, user: userDataResponse } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      setUser(userDataResponse)
      toast.success('Inscription reussie !')
      router.push('/citizen/dashboard')
      return true
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur d\'inscription')
      return false
    }
  }

  const logout = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    toast.info('Deconnexion reussie')
    router.push('/')
  }

  const value = { user, loading, login, register, logout, fetchUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}