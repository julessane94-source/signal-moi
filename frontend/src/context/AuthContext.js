import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { toast } from 'react-toastify'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

const API_URL = 'https://signal-moi-api.onrender.com'

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
      const response = await axios.get(`${API_URL}/api/auth/profile`)
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password })
      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
      toast.success(`Bienvenue ${userData.prenom} !`)
      const routes = { admin: '/admin/dashboard', police: '/police/dashboard', collaborateur: '/collaborator/dashboard', citoyen: '/citizen/dashboard' }
      router.push(routes[userData.role] || '/')
      return true
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur de connexion')
      return false
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData)
      const { token, user: userDataResponse } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userDataResponse)
      toast.success('Inscription reussie !')
      router.push('/citizen/dashboard')
      return true
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur inscription')
      return false
    }
  }

  const logout = async () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    toast.info('Deconnexion reussie')
    router.push('/')
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser }}>{children}</AuthContext.Provider>
}