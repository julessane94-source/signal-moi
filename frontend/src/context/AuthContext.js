import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { API_BASE } from '../config/api'
import { toast } from 'react-toastify'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase()
  if (['admin', 'administrateur'].includes(value)) return 'admin'
  if (['police', 'policier', 'force_ordre'].includes(value)) return 'police'
  if (['collaborateur', 'collaborator'].includes(value)) return 'collaborateur'
  if (['citoyen', 'citizen', 'user'].includes(value)) return 'citoyen'
  return value
}

const normalizeUser = (userData) => userData ? { ...userData, role: normalizeRole(userData.role) } : null
// use central API base
const API_URL = API_BASE

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

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`)
      // API returns { success: true, user: { ... } }
      const payload = response.data
      if (payload) {
        setUser(normalizeUser(payload.user || payload))
      } else {
        setUser(null)
      }
    } catch (error) {
      // On auth error, clear token and user
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password })
      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(normalizeUser(userData))
      toast.success(`Bienvenue ${userData.prenom} !`)
      const routes = { admin: '/admin/dashboard', police: '/police/dashboard', collaborateur: '/collaborator/dashboard', citoyen: '/citizen/dashboard' }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setTimeout(() => router.push(routes[userData.role] || '/'), 100)
      return true
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur de connexion')
      return false
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData)
      const { token, user: userDataResponse } = response.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(normalizeUser(userDataResponse))
      toast.success('Inscription reussie !')
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setTimeout(() => router.push('/citizen/dashboard'), 100)
      return true
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur inscription')
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    toast.info('Deconnexion reussie')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setTimeout(() => router.push('/'), 100)
  }, [])

  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await axios.put(`${API_URL}/api/auth/profile`, profileData)
      const updatedUser = response.data.user
      setUser(normalizeUser(updatedUser))
      toast.success(response.data.message || 'Profil mis à jour avec succès')
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour')
      return false
    }
  }, [])

  const changePassword = useCallback(async (passwordData) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/change-password`, passwordData)
      toast.success(response.data.message || 'Mot de passe modifié avec succès')
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors du changement')
      return false
    }
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    fetchUser,
    updateProfile,
    changePassword
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}