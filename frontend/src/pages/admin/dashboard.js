import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, FormField, Input, Modal, DataTable, StatBox, Badge, EmptyState, LoadingSkeleton, DataTableModern, StatCardModern } from '../../components/ui'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { API_BASE } from '../../config/api'
import AuthenticatedProof from '../../components/common/AuthenticatedProof'
import {
  UsersIcon as Users,
  DocumentTextIcon as DocumentText,
  CogIcon as Cog,
  ChartBarIcon as BarChart,
  PlusIcon as Plus,
  PencilSquareIcon as PencilSquare,
  TrashIcon as Trash,
  KeyIcon as Key,
  UserIcon as User,
  ArrowUpTrayIcon as ArrowUpTray,
  PhoneIcon as Phone,
  EnvelopeIcon as Envelope,
  BuildingOffice2Icon as BuildingOffice2,
  ShieldCheckIcon as ShieldCheck
} from '@heroicons/react/24/outline'

const getImageUrl = (url, { preferApi = true } = {}) => {
  if (!url) return null
  if (url.startsWith('data:')) return url

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      if (parsed.pathname.startsWith('/uploads/')) return `${API_BASE}${parsed.pathname}${parsed.search || ''}`
      return url || '/icons/icon-192x192.png'
    } catch (err) {
      return '/icons/icon-192x192.png'
    }
  }

  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`
  if (url.startsWith('uploads/')) return `${API_BASE}/${url}`
  return url
}

const handleImageFallback = (event, originalUrl) => {
  const current = event.currentTarget
  const fallback = getImageUrl(originalUrl, { preferApi: false })
  if (current.src !== fallback && !originalUrl?.startsWith('data:')) {
    current.src = fallback
  } else {
    current.src = '/icons/icon-192x192.png'
  }
}

const getVerificationTone = (verification) => {
  const level = verification?.niveau
  if (level === 'fiable') return { label: 'Fiable', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' }
  if (level === 'suspect') return { label: 'Suspect', className: 'border-red-200 bg-red-50 text-red-700' }
  return { label: 'A verifier', className: 'border-amber-200 bg-amber-50 text-amber-700' }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen', signalementTypes: [], stationLatitude: '', stationLongitude: ''
  })
  const [signalementTypes, setSignalementTypes] = useState([])
  const [errors, setErrors] = useState({})
  const [signalements, setSignalements] = useState([])
  const [campagnes, setCampagnes] = useState([])
  const [deleteReason, setDeleteReason] = useState('')
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null) // 'signalement' ou 'campagne'
  const [logoUrl, setLogoUrl] = useState('/icons/icon-192x192.png')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSlideshow, setUploadingSlideshow] = useState(false)
  const [deletingSlideshowImage, setDeletingSlideshowImage] = useState('')
  const [publishingMobileRelease, setPublishingMobileRelease] = useState(false)
  const [mobileRelease, setMobileRelease] = useState({
    version: '0.1.16',
    notes: 'Nouvelle interface mobile modernisée : accueil citoyen simplifié, espace commissariat amélioré et animations plus fluides.',
    apkUrl: 'https://signal-moi.sn/downloads/signal-moi.apk?v=20260819-1410'
  })
  const [slideshowFiles, setSlideshowFiles] = useState([])
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'Signal-Moi',
    contactEmail: 'contact@signal-moi.com',
    contactPhone: '+237 600 000 000',
    address: 'Sedhiou, Senegal',
    contactPage: {
      title: 'Contactez-nous',
      content: 'Pour toute question, contactez-nous.',
      images: [],
      videos: []
    },
    aboutPage: {
      title: 'A propos',
      content: 'Signal-Moi est une plateforme...',
      images: [],
      videos: []
    },
    homePage: {
      title: 'Accueil',
      heroText: 'Votre voix compte',
      content: 'Bienvenue sur Signal-Moi',
      images: [],
      videos: []
    },
    socialLinks: {
      facebook: '',
      whatsapp: '',
      twitter: '',
      instagram: ''
    }
    ,
    emergencyPolice: '',
    emergencyFire: ''
  })
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSignalements: 0,
    totalCampagnes: 0,
    activeUsers: 0
  })

  const commissariatUsers = users.filter((item) => String(item.role || '').toLowerCase() === 'commissariat')
  const policeUsers = users.filter((item) => ['police', 'policier', 'gendarmerie', 'force_ordre'].includes(String(item.role || '').toLowerCase()))

  const getRoleLabel = (role) => {
    const normalized = String(role || '').toLowerCase()
    if (normalized === 'commissariat') return 'Compte commissariat'
    if (normalized === 'police') return 'Agent de commissariat'
    if (normalized === 'gendarmerie') return 'Agent de gendarmerie'
    if (normalized === 'collaborateur') return 'Collaborateur'
    if (normalized === 'admin') return 'Admin'
    return 'Citoyen'
  }
  const [completeStats, setCompleteStats] = useState(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      window.location.href = '/'
    }
    if (!loading && user?.role === 'admin') {
      fetchUsers()
      fetchSignalementTypes()
      fetchSiteConfig()
      fetchStats()
    }
  }, [user, loading])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Chargement des utilisateurs impossible')
      }
      const data = await res.json()
      const userRows = Array.isArray(data) ? data : []
      setUsers(userRows)
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers || userRows.length,
        activeUsers: prev.activeUsers || userRows.filter(item => item.is_active !== false).length
      }))
    } catch (error) {
      console.error('Erreur fetchUsers:', error)
      toast.error('Erreur de chargement des utilisateurs')
    }
  }

  const fetchSiteConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/site-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSiteConfig(prev => ({
          ...prev,
          siteName: data.siteName || prev.siteName,
          contactEmail: data.contactEmail || prev.contactEmail,
          contactPhone: data.contactPhone || prev.contactPhone,
          address: data.address || prev.address,
          contactPage: data.contact_page || data.contactPage || prev.contactPage,
          aboutPage: data.about_page || data.aboutPage || prev.aboutPage,
          homePage: data.home_page || data.homePage || prev.homePage,
          emergencyPolice: data.emergency_police || data.emergencyPolice || prev.emergencyPolice,
          emergencyFire: data.emergency_fire || data.emergencyFire || prev.emergencyFire
        }))
        // Charger le logo aussi
        setLogoUrl(data.logoUrl || data.logo_url || '/icons/icon-192x192.png')
      }
    } catch (error) {
      console.error('Erreur fetchSiteConfig:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const [signalementsRes, campagnesRes, statsRes] = await Promise.all([
        fetch(`${base}/api/admin/signalements`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${base}/api/campagnes?limit=80`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${base}/api/admin/statistics`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      const signalementsData = signalementsRes.ok ? await signalementsRes.json() : []
      const campagnesData = campagnesRes.ok ? await campagnesRes.json() : []
      const completeStatsData = statsRes.ok ? await statsRes.json() : null
      setSignalements(Array.isArray(signalementsData) ? signalementsData : [])
      setCampagnes(Array.isArray(campagnesData) ? campagnesData : [])
      setCompleteStats(completeStatsData)
      setStats(prev => ({
        ...prev,
        totalUsers: completeStatsData?.totals?.users ?? (Array.isArray(users) ? users.length : prev.totalUsers),
        activeUsers: completeStatsData?.totals?.usersActifs ?? (Array.isArray(users) ? users.filter(u => u.is_active !== false).length : prev.activeUsers),
        totalSignalements: completeStatsData?.totals?.signalements ?? (Array.isArray(signalementsData) ? signalementsData.length : 0),
        totalCampagnes: completeStatsData?.totals?.campagnesActives ?? completeStatsData?.totals?.campagnes ?? (Array.isArray(campagnesData) ? campagnesData.length : 0)
      }))
    } catch (error) {
      console.error('Erreur fetchStats:', error)
    }
  }

  const removeSlideshowImage = async (imageUrl) => {
    if (!imageUrl || deletingSlideshowImage) return
    if (!window.confirm('Retirer cette image du diaporama de la page d’accueil ?')) return

    setDeletingSlideshowImage(imageUrl)
    try {
      const token = localStorage.getItem('token')
      const nextImages = (siteConfig.homePage?.images || []).filter((image) => image !== imageUrl)
      const res = await fetch(`${API_BASE}/api/admin/site-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          homePage: {
            ...(siteConfig.homePage || {}),
            images: nextImages
          }
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Suppression impossible')

      setSiteConfig((prev) => ({
        ...prev,
        homePage: { ...(prev.homePage || {}), images: nextImages }
      }))
      toast.success('Image retirée du diaporama')
    } catch (error) {
      toast.error(error.message || 'Impossible de retirer cette image')
    } finally {
      setDeletingSlideshowImage('')
    }
  }

  const fetchSignalementTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/admin/signalement-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Types indisponibles')
      setSignalementTypes(await res.json())
    } catch (error) {
      toast.error('Impossible de charger les types de signalement')
    }
  }

  const exportStatistics = async (format = 'excel') => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/admin/statistics/export?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Export impossible')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'pdf' ? 'statistiques-admin.pdf' : 'statistiques-admin.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Export des statistiques impossible')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.prenom?.trim()) newErrors.prenom = 'Prénom requis'
    if (!formData.nom?.trim()) newErrors.nom = 'Nom requis'
    if (!formData.email?.trim()) newErrors.email = 'Email requis'
    if (!formData.telephone?.trim()) newErrors.telephone = 'Téléphone requis'
    if (!formData.ville?.trim()) newErrors.ville = 'Ville requise'
    if (formData.role === 'commissariat' && !formData.quartier?.trim()) newErrors.quartier = 'Nom du commissariat requis'
    if (!editingUser && !formData.password) newErrors.password = 'Mot de passe requis'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const url = editingUser 
        ? `${base}/api/admin/users/${editingUser.id}`
        : `${base}/api/admin/users`
      const method = editingUser ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || 'Erreur lors de la création')
      }
      await response.json()
      if (editingUser && ['collaborateur', 'commissariat'].includes(formData.role)) {
        const assignmentResponse = await fetch(`${base}/api/admin/users/${editingUser.id}/signalement-types`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ signalementTypes: formData.signalementTypes })
        })
        if (!assignmentResponse.ok) {
          const errorBody = await assignmentResponse.json()
          throw new Error(errorBody.error || 'Les types de signalement n’ont pas été enregistrés')
        }
      }
      toast.success(editingUser ? '✅ Utilisateur modifié' : '✅ Utilisateur créé')
      setShowModal(false)
      setEditingUser(null)
      setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen', signalementTypes: [], stationLatitude: '', stationLongitude: '' })
      setErrors({})
      fetchUsers()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Désactiver cet utilisateur ? Cette action est irréversible.')) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }
      toast.success('✅ Utilisateur désactivé')
      fetchUsers()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const resetPassword = async (userId) => {
    try {
      const password = window.prompt('Saisissez un mot de passe temporaire (12 caractères minimum) :')
      if (!password) return
      if (password.length < 12) {
        toast.error('❌ Le mot de passe temporaire doit contenir au moins 12 caractères.')
        return
      }
      const token = localStorage.getItem('token')
      const base = API_BASE
      const response = await fetch(`${base}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Réinitialisation impossible')
      }
      toast.success('✅ Mot de passe temporaire mis à jour')
    } catch (error) {
      toast.error(`❌ ${error.message || 'Erreur'}`)
    }
  }

  const changeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      await fetch(`${base}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      toast.success('✅ Rôle modifié')
      fetchUsers()
    } catch (error) {
      toast.error('❌ Erreur')
    }
  }

  const deleteSignalement = async () => {
    if (!itemToDelete) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/signalements/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason || 'Signalement supprimé par l\'administrateur' })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }
      toast.success('✅ Signalement supprimé et notification envoyée')
      setItemToDelete(null)
      setDeleteReason('')
      setDeleteType(null)
      fetchStats()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const deleteCampagne = async () => {
    if (!itemToDelete) return
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const res = await fetch(`${base}/api/admin/campagnes/${itemToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason || 'Campagne supprimée par l\'administrateur' })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }
      toast.success('✅ Campagne supprimée et notifications envoyées')
      setItemToDelete(null)
      setDeleteReason('')
      setDeleteType(null)
      fetchStats()
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  // About page helpers: partners and team
  const addPartner = () => {
    setSiteConfig(prev => ({
      ...prev,
      aboutPage: {
        ...(prev.aboutPage || {}),
        partners: [...(prev.aboutPage?.partners || []), { name: '', url: '' }]
      }
    }))
  }

  const updatePartner = (idx, field, value) => {
    setSiteConfig(prev => {
      const partners = (prev.aboutPage?.partners || []).slice()
      partners[idx] = { ...(partners[idx] || {}), [field]: value }
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), partners } }
    })
  }

  const removePartner = (idx) => {
    setSiteConfig(prev => {
      const partners = (prev.aboutPage?.partners || []).slice()
      partners.splice(idx, 1)
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), partners } }
    })
  }

  const addTeamMember = () => {
    setSiteConfig(prev => ({
      ...prev,
      aboutPage: {
        ...(prev.aboutPage || {}),
        team: [...(prev.aboutPage?.team || []), { name: '', role: '' }]
      }
    }))
  }

  const updateTeamMember = (idx, field, value) => {
    setSiteConfig(prev => {
      const team = (prev.aboutPage?.team || []).slice()
      team[idx] = { ...(team[idx] || {}), [field]: value }
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), team } }
    })
  }

  const removeTeamMember = (idx) => {
    setSiteConfig(prev => {
      const team = (prev.aboutPage?.team || []).slice()
      team.splice(idx, 1)
      return { ...prev, aboutPage: { ...(prev.aboutPage || {}), team } }
    })
  }

  const saveConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      const payload = {
        siteName: siteConfig.siteName,
        contactEmail: siteConfig.contactEmail,
        contactPhone: siteConfig.contactPhone,
        address: siteConfig.address,
        contactPage: siteConfig.contactPage,
        aboutPage: siteConfig.aboutPage,
        homePage: siteConfig.homePage,
        emergencyPolice: siteConfig.emergencyPolice,
        emergencyFire: siteConfig.emergencyFire
      }
      // Include social links if present
      if (siteConfig.socialLinks) payload.socialLinks = siteConfig.socialLinks

      // Ensure aboutPage contains partners/team arrays
      payload.aboutPage = payload.aboutPage || {}
      payload.aboutPage.partners = payload.aboutPage.partners || siteConfig.aboutPage?.partners || []
      payload.aboutPage.team = payload.aboutPage.team || siteConfig.aboutPage?.team || []

      const res = await fetch(`${base}/api/admin/site-config`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }
      toast.success('✅ Configuration sauvegardée')
    } catch (error) {
      toast.error('❌ ' + (error.message || 'Erreur'))
    }
  }

  const publishMobileRelease = async () => {
    if (!mobileRelease.version.trim()) {
      toast.error('Indiquez le numéro de version mobile.')
      return
    }
    setPublishingMobileRelease(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/admin/mobile-release`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(mobileRelease)
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Publication impossible')
      toast.success(`Mise à jour publiée : ${data.notifiedUsers || 0} utilisateur(s) informé(s).`)
    } catch (error) {
      toast.error(error.message || 'Publication de la mise à jour impossible')
    } finally {
      setPublishingMobileRelease(false)
    }
  }

  // Fonction pour uploader le logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('❌ Type de fichier non supporté. Accepte: JPEG, PNG, WebP, GIF')
      return
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5242880) {
      toast.error('❌ Fichier trop volumineux. Maximum 5MB.')
      return
    }

    setUploadingLogo(true)
    try {
      const token = localStorage.getItem('token')
      const base = API_BASE
      if (!base || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && base.includes('localhost'))) {
        throw new Error('API mal configuree: NEXT_PUBLIC_API_URL doit pointer vers le backend en ligne.')
      }
      const formData = new FormData()
      formData.append('logo', file)

      const res = await fetch(`${base}/api/admin/site-config/logo`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Erreur lors du changement du logo')
      }

      const data = await res.json()
      setLogoUrl(data.logoUrl)
      toast.success('✅ ' + (data.message || 'Logo changé avec succès'))
    } catch (error) {
      const message = error?.message === 'Failed to fetch'
        ? 'Impossible de joindre l API. Verifiez NEXT_PUBLIC_API_URL et le CORS du backend.'
        : (error.message || 'Erreur')
      toast.error('❌ ' + message)
    } finally {
      setUploadingLogo(false)
      // Réinitialiser l'input
      if (e.target) e.target.value = ''
    }
  }

  const openModal = (userData = null) => {
    if (userData) {
      setEditingUser(userData)
      setFormData({
        prenom: userData.prenom || '',
        nom: userData.nom || '',
        email: userData.email || '',
        telephone: userData.telephone || '',
        password: '',
        ville: userData.ville || 'Sedhiou',
        quartier: userData.quartier || (['commissariat', 'police'].includes(String(userData.role || '').toLowerCase()) ? 'Commissariat central de Sedhiou' : ''),
        role: userData.role || 'citoyen',
        signalementTypes: Array.isArray(userData.signalement_types) ? userData.signalement_types : [],
        stationLatitude: userData.station_latitude ?? '',
        stationLongitude: userData.station_longitude ?? ''
      })
    } else {
      setEditingUser(null)
      setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: 'Sedhiou', quartier: '', role: 'citoyen', signalementTypes: [], stationLatitude: '', stationLongitude: '' })
    }
    setErrors({})
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl"
          >
            <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)] lg:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200">Centre de pilotage</p>
                <h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-5xl">
                  <BarChart className="h-9 w-9 text-indigo-300 sm:h-11 sm:w-11" />
                  Administration
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Supervisez les utilisateurs, les signalements, les campagnes et les réglages de la plateforme depuis un seul espace.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => setActiveTab('users')} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-indigo-50">
                    Gérer les utilisateurs
                  </button>
                  <button onClick={() => setActiveTab('signalements')} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15">
                    Voir les signalements
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 self-end">
                {[
                  { label: 'Utilisateurs actifs', value: stats.activeUsers, icon: Users },
                  { label: 'Signalements', value: stats.totalSignalements, icon: DocumentText },
                  { label: 'Commissariats', value: commissariatUsers.length, icon: BuildingOffice2 },
                  { label: 'Campagnes', value: stats.totalCampagnes, icon: BarChart }
                ].map((item) => {
                  const Icon = item.icon
                  return <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-indigo-200" />
                    <p className="mt-2 text-3xl font-black">{item.value || 0}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-300">{item.label}</p>
                  </div>
                })}
              </div>
            </div>
          </motion.div>

          <div className="sticky top-20 z-20 mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-lg shadow-slate-900/5 backdrop-blur">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: BarChart },
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { id: 'signalements', label: 'Signalements', icon: DocumentText },
              { id: 'campagnes', label: 'Campagnes', icon: BarChart },
              { id: 'config', label: 'Configuration', icon: Cog },
              { id: 'settings', label: 'Paramètres', icon: Cog }
            ].map((tab) => {
              const TabIcon = tab.icon
              return (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-slate-950 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <TabIcon className="h-5 w-5" />
                {tab.label}
              </motion.button>
              )
            })}
          </div>

          {/* Dashboard Tab - Stats */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCardModern
                  title="Total utilisateurs"
                  value={stats.totalUsers}
                  icon={Users}
                  gradient={true}
                  trend="up"
                  change={12}
                />
                <StatCardModern
                  title="Signalements"
                  value={stats.totalSignalements}
                  icon={DocumentText}
                  gradient={true}
                  trend="up"
                  change={8}
                />
                <StatCardModern
                  title="Campagnes actives"
                  value={stats.totalCampagnes}
                  icon={BarChart}
                  gradient={true}
                  trend="down"
                  change={-3}
                />
                <StatCardModern
                  title="Utilisateurs actifs"
                  value={stats.activeUsers}
                  icon={Users}
                  gradient={true}
                  trend="up"
                  change={15}
                />
              </div>

              {completeStats && (
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-950">Signalements au complet</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      {Object.entries({
                        Nouveaux: completeStats.totals?.nouveaux,
                        'En cours': completeStats.totals?.enCours,
                        Traites: completeStats.totals?.traites,
                        Transferes: completeStats.totals?.transferes,
                        '24h': completeStats.totals?.last24h,
                        '7 jours': completeStats.totals?.last7d,
                        GPS: completeStats.totals?.avecGps,
                        Anonymes: completeStats.totals?.anonymes
                      }).map(([label, value]) => (
                        <div key={label} className="rounded-xl bg-slate-50 p-3">
                          <p className="text-slate-500">{label}</p>
                          <p className="text-xl font-bold text-slate-950">{value || 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-950">Par type</h3>
                    <div className="mt-4 space-y-2 text-sm">
                      {Object.entries(completeStats.byType || {}).slice(0, 8).map(([label, value]) => (
                        <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <span>{label}</span><strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="font-bold text-slate-950">Par zone</h3>
                    <div className="mt-4 space-y-2 text-sm">
                      {Object.entries(completeStats.byZone || {}).slice(0, 8).map(([label, value]) => (
                        <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <span className="truncate pr-3">{label}</span><strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Statistiques PDF */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">📊 Rapport de Statistiques</h3>
                    <p className="text-indigo-100">Accédez aux statistiques complètes des signalements avec graphiques et export PDF</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button onClick={() => exportStatistics('pdf')} className="bg-white text-indigo-600 font-bold px-5 py-3 rounded-lg hover:shadow-lg transition">
                      Telecharger PDF
                    </button>
                    <button onClick={() => exportStatistics('excel')} className="bg-emerald-500 text-white font-bold px-5 py-3 rounded-lg hover:shadow-lg transition">
                      Telecharger Excel
                    </button>
                    <Link href="/admin/statistics">
                      <button className="bg-indigo-950/40 text-white font-bold px-5 py-3 rounded-lg hover:bg-indigo-950/60 transition">
                        Voir plus
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-950 to-slate-950 p-6 text-white shadow-xl">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-900 shadow-sm">
                      <BuildingOffice2 className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Commissariats</p>
                      <h2 className="mt-1 text-2xl font-black">Commissariats et agents rattachés</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                        L'admin crée les comptes commissariat. Chaque commissariat crée ensuite ses agents et les rattache à sa zone.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs font-semibold text-blue-100">Comptes commissariat</p>
                      <p className="mt-1 text-3xl font-black">{commissariatUsers.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-xs font-semibold text-blue-100">Agents</p>
                      <p className="mt-1 text-3xl font-black">{policeUsers.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button icon={Plus} onClick={() => openModal()}>
                  Ajouter un commissariat ou utilisateur
                </Button>
              </div>

              <DataTable
                columns={[
                  { key: 'prenom', label: 'Prénom' },
                  { key: 'email', label: 'Email' },
                  { key: 'role', label: 'Rôle', render: (role) => <Badge variant="info">{getRoleLabel(role)}</Badge> },
                  {
                    key: 'quartier',
                    label: 'Zone / structure',
                    render: (zone, item) => (
                      <div className="text-sm">
                        <p className="font-semibold text-slate-900">
                          {['commissariat', 'police'].includes(String(item.role || '').toLowerCase()) ? (zone || 'Structure non renseignée') : (zone || 'Non renseigné')}
                        </p>
                        <p className="text-xs text-slate-500">{item.ville || 'Sedhiou'}</p>
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (_, user) => (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => openModal(user)}
                          className="p-2 hover:bg-indigo-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <PencilSquare className="h-4 w-4 text-indigo-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => resetPassword(user.id)}
                          className="p-2 hover:bg-yellow-50 rounded-lg transition"
                          title="Réinitialiser mot de passe"
                        >
                          <Key className="h-4 w-4 text-yellow-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Désactiver"
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </motion.button>
                      </div>
                    )
                  }
                ]}
                data={users}
                emptyMessage="Aucun utilisateur trouvé"
              />
            </motion.div>
          )}

          {/* Signalements Tab */}
          {activeTab === 'signalements' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {signalements.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="Aucun signalement"
                  description="Aucun signalement disponible pour le moment"
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {signalements.map((s, idx) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {(() => {
                        const verificationTone = getVerificationTone(s.verification)
                        return (
                      <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
                          <div className="p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black uppercase text-white">Supervision admin</span>
                              <Badge variant={s.statut === 'traite' ? 'success' : s.statut === 'en_cours' ? 'warning' : 'info'}>{s.statut || 'nouveau'}</Badge>
                              {s.type && <Badge variant="gray">{s.type}</Badge>}
                              {s.verification && (
                                <span className={`rounded-full border px-3 py-1 text-xs font-black ${verificationTone.className}`}>
                                  {verificationTone.label} {s.verification.score}%
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg text-slate-950">{s.titre}</h3>
                            <p className="mt-2 text-gray-600">{s.description}</p>
                            {s.verification?.raisons?.length > 0 && (
                              <div className={`mt-3 rounded-2xl border p-3 text-sm font-semibold ${verificationTone.className}`}>
                                {s.verification.raisons.slice(0, 3).join(' • ')}
                              </div>
                            )}
                            <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                              <span>📍 Zone: {s.localisation || 'Non renseignée'}</span>
                              <span>👤 Auteur: {s.author?.prenom || 'Inconnu'} {s.author?.nom || ''}{s.estAnonyme ? ' (anonyme public)' : ''}</span>
                              {s.author?.telephone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {s.author.telephone}</span>}
                              {s.author?.email && <span className="inline-flex items-center gap-1"><Envelope className="h-4 w-4" /> {s.author.email}</span>}
                              <span>🕒 Créé: {s.createdAt ? new Date(s.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</span>
                              <span>🗂️ ID: {s.id}</span>
                            </div>
                            {Array.isArray(s.fichiers) && s.fichiers.length > 0 && (
                              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <p className="text-sm font-black text-slate-900">Preuves jointes ({s.fichiers.length})</p>
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Visible admin</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                  {s.fichiers.map((file) => <AuthenticatedProof key={file.id || file.chemin || file.nom_fichier} file={file} />)}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                            <div className="rounded-xl bg-white p-3 text-sm font-bold text-slate-700">
                              {Array.isArray(s.fichiers) ? `${s.fichiers.length} preuve(s) jointe(s)` : '0 preuve jointe'}
                            </div>
                            <div className="rounded-xl bg-white p-3 text-xs text-slate-600">
                              Vue admin: contrôle, audit et modération du dossier.
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(s.id)
                                setDeleteType('signalement')
                                setDeleteReason('')
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
                              title="Supprimer ce signalement"
                            >
                              <Trash className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </Card>
                        )
                      })()}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Campagnes Tab */}
          {activeTab === 'campagnes' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {campagnes.length === 0 ? (
                <EmptyState
                  icon="🎯"
                  title="Aucune campagne"
                  description="Aucune campagne disponible pour le moment"
                />
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {campagnes.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="p-6 glass-card">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{c.titre}</h3>
                              <Badge variant="info">{c.statut || 'active'}</Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{c.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>📅 Création: {new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                              <span>👤 {c.createur?.prenom} {c.createur?.nom}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getImageUrl(c.image_url || c.image) && (
                              <img src={getImageUrl(c.image_url || c.image)} onError={(event) => handleImageFallback(event, c.image_url || c.image)} alt="aperçu" className="w-20 h-20 object-cover rounded-lg" />
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => {
                                setItemToDelete(c.id)
                                setDeleteType('campagne')
                                setDeleteReason('')
                              }}
                              className="p-2 hover:bg-red-50 rounded-lg transition"
                              title="Supprimer cette campagne"
                            >
                              <Trash className="h-5 w-5 text-red-600" />
                            </motion.button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          {activeTab === 'config' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration du site</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Nom du site">
                      <Input
                        value={siteConfig.siteName}
                        onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})}
                      />
                    </FormField>
                    <FormField label="Email de contact">
                      <Input
                        type="email"
                        value={siteConfig.contactEmail}
                        onChange={e => setSiteConfig({...siteConfig, contactEmail: e.target.value})}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <FormField label="Numéro Police">
                      <Input
                        value={siteConfig.emergencyPolice}
                        onChange={e => setSiteConfig({...siteConfig, emergencyPolice: e.target.value})}
                        placeholder="Ex: +237 6XXXXXXXX"
                      />
                    </FormField>
                    <FormField label="Numéro Sapeurs‑pompiers">
                      <Input
                        value={siteConfig.emergencyFire}
                        onChange={e => setSiteConfig({...siteConfig, emergencyFire: e.target.value})}
                        placeholder="Ex: +237 6XXXXXXXX"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Téléphone">
                      <Input
                        value={siteConfig.contactPhone}
                        onChange={e => setSiteConfig({...siteConfig, contactPhone: e.target.value})}
                      />
                    </FormField>
                    <FormField label="Adresse">
                      <Input
                        value={siteConfig.address}
                        onChange={e => setSiteConfig({...siteConfig, address: e.target.value})}
                      />
                    </FormField>
                  </div>

                  {/* Pages éditables: Home, About, Contact */}
                  <div className="space-y-6 mt-6">
                    <h3 className="text-lg font-semibold">Accueil (Home Page)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Titre">
                        <Input
                          value={siteConfig.homePage?.title}
                          onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, title: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Contenu">
                        <textarea
                          value={siteConfig.homePage?.content}
                          onChange={e => setSiteConfig({...siteConfig, homePage: {...siteConfig.homePage, content: e.target.value}})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </FormField>
                      <FormField label="Images du diaporama (téléversement direct)">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setSlideshowFiles(Array.from(e.target.files || []))}
                          className="w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={async () => {
                              if (!slideshowFiles.length) {
                                toast.error('Sélectionnez au moins une image')
                                return
                              }
                              setUploadingSlideshow(true)
                              try {
                                const token = localStorage.getItem('token')
                                const formData = new FormData()
                                slideshowFiles.forEach((file) => formData.append('images', file))
                                const res = await fetch(`${API_BASE}/api/admin/site-config/slideshow-images`, {
                                  method: 'PUT',
                                  headers: { Authorization: `Bearer ${token}` },
                                  body: formData
                                })
                                const data = await res.json()
                                if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'upload')
                                setSiteConfig(prev => ({
                                  ...prev,
                                  homePage: { ...(prev.homePage || {}), images: data.images || [] }
                                }))
                                toast.success('✅ Images du diaporama enregistrées')
                                setSlideshowFiles([])
                              } catch (error) {
                                toast.error('❌ ' + (error.message || 'Erreur'))
                              } finally {
                                setUploadingSlideshow(false)
                              }
                            }}
                            disabled={uploadingSlideshow}
                          >
                            {uploadingSlideshow ? 'Téléversement...' : 'Téléverser les images'}
                          </Button>
                          <span className="text-xs text-slate-500">Les images sont stockées directement dans la configuration de la page d’accueil.</span>
                        </div>
                        {(siteConfig.homePage?.images || []).length > 0 && (
                          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900">Images publiées</p>
                                <p className="text-xs text-slate-500">Retirez une image sans modifier les autres diapositives.</p>
                              </div>
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">{siteConfig.homePage.images.length}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                              {siteConfig.homePage.images.map((imageUrl, index) => (
                                <div key={`${imageUrl}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                  <img
                                    src={getImageUrl(imageUrl)}
                                    onError={(event) => handleImageFallback(event, imageUrl)}
                                    alt={`Diapositive ${index + 1}`}
                                    className="h-24 w-full object-cover"
                                  />
                                  <div className="flex items-center justify-between gap-2 p-2">
                                    <span className="text-xs font-semibold text-slate-500">Image {index + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeSlideshowImage(imageUrl)}
                                      disabled={Boolean(deletingSlideshowImage)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                                      aria-label={`Supprimer l'image ${index + 1} du diaporama`}
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                      {deletingSlideshowImage === imageUrl ? 'Retrait…' : 'Retirer'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </FormField>
                    </div>

                    <h3 className="text-lg font-semibold">À propos (About Page)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Titre">
                        <Input
                          value={siteConfig.aboutPage?.title}
                          onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, title: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Contenu">
                        <textarea
                          value={siteConfig.aboutPage?.content}
                          onChange={e => setSiteConfig({...siteConfig, aboutPage: {...siteConfig.aboutPage, content: e.target.value}})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </FormField>
                      {/* Partners list */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Nos partenaires</h4>
                          <Button size="sm" onClick={addPartner}>Ajouter partenaire</Button>
                        </div>
                        <div className="space-y-2 mt-3">
                          {(siteConfig.aboutPage?.partners || []).map((p, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input placeholder="Nom" value={p.name || ''} onChange={e => updatePartner(idx, 'name', e.target.value)} />
                              <Input placeholder="URL" value={p.url || ''} onChange={e => updatePartner(idx, 'url', e.target.value)} />
                              <Button size="sm" variant="danger" onClick={() => removePartner(idx)}>Supprimer</Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team list */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Notre équipe</h4>
                          <Button size="sm" onClick={addTeamMember}>Ajouter membre</Button>
                        </div>
                        <div className="space-y-2 mt-3">
                          {(siteConfig.aboutPage?.team || []).map((m, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input placeholder="Nom" value={m.name || ''} onChange={e => updateTeamMember(idx, 'name', e.target.value)} />
                              <Input placeholder="Rôle" value={m.role || ''} onChange={e => updateTeamMember(idx, 'role', e.target.value)} />
                              <Button size="sm" variant="danger" onClick={() => removeTeamMember(idx)}>Supprimer</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold">Contact (Contact Page)</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField label="Titre">
                        <Input
                          value={siteConfig.contactPage?.title}
                          onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, title: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Contenu">
                        <textarea
                          value={siteConfig.contactPage?.content}
                          onChange={e => setSiteConfig({...siteConfig, contactPage: {...siteConfig.contactPage, content: e.target.value}})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Réseaux sociaux */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold">Réseaux sociaux</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <Button size="sm" variant="secondary" onClick={() => {
                        const imported = {
                          contactPhone: '778851691',
                          contactEmail: 'contact@signal-moi.com/julessane94@gmail.com',
                          address: 'Sedhiou, Senegal',
                          contactPage: {
                            title: 'Contactez-nous',
                            content: `Pour toute question ou suggestion, n'hésitez pas à nous contacter. Notre équipe est disponible pour vous aider.`
                          },
                          socialLinks: {
                            facebook: 'https://www.fb.com/l/6lp1kJRRR',
                            whatsapp: '+221778851691',
                            twitter: '',
                            instagram: ''
                          },
                          emergencyPolice: siteConfig.emergencyPolice || '',
                          emergencyFire: siteConfig.emergencyFire || ''
                        }
                        setSiteConfig(prev => ({ ...prev, ...imported }))
                      }}>
                        Importer mes coordonnées
                      </Button>

                      <Button size="sm" variant="primary" onClick={async () => {
                        const imported = {
                          contactPhone: '778851691',
                          contactEmail: 'contact@signal-moi.com/julessane94@gmail.com',
                          address: 'Sedhiou, Senegal',
                          contactPage: {
                            title: 'Contactez-nous',
                            content: `Pour toute question ou suggestion, n'hésitez pas à nous contacter. Notre équipe est disponible pour vous aider.`
                          },
                          socialLinks: {
                            facebook: 'https://www.fb.com/l/6lp1kJRRR',
                            whatsapp: '+221778851691',
                            twitter: '',
                            instagram: ''
                          }
                        }
                        // Update UI immediately
                        setSiteConfig(prev => ({ ...prev, ...imported }))
                        // Save to backend using existing saveConfig logic but with payload
                        try {
                          const token = localStorage.getItem('token')
                          const base = API_BASE
                          const payload = {
                            siteName: siteConfig.siteName,
                            contactEmail: imported.contactEmail,
                            contactPhone: imported.contactPhone,
                            address: imported.address,
                            contactPage: imported.contactPage,
                            aboutPage: siteConfig.aboutPage,
                            homePage: siteConfig.homePage,
                            socialLinks: imported.socialLinks
                          }
                          const res = await fetch(`${base}/api/admin/site-config`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                          })
                          if (!res.ok) {
                            const err = await res.json()
                            toast.error('Erreur sauvegarde: ' + (err.error || err.message || ''))
                            return
                          }
                          toast.success('✅ Coordonnées importées et sauvegardées')
                        } catch (e) {
                          console.error('Erreur import+save:', e)
                          toast.error('Erreur lors de la sauvegarde')
                        }
                      }}>
                        Importer et sauvegarder
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <FormField label="Facebook (URL)">
                        <Input
                          value={siteConfig.socialLinks?.facebook}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, facebook: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="WhatsApp (numéro)">
                        <Input
                          value={siteConfig.socialLinks?.whatsapp}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, whatsapp: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Twitter (URL)">
                        <Input
                          value={siteConfig.socialLinks?.twitter}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, twitter: e.target.value}})}
                        />
                      </FormField>
                      <FormField label="Instagram (URL)">
                        <Input
                          value={siteConfig.socialLinks?.instagram}
                          onChange={e => setSiteConfig({...siteConfig, socialLinks: {...siteConfig.socialLinks, instagram: e.target.value}})}
                        />
                      </FormField>
                    </div>

                    <div className="pt-4">
                      <Button onClick={() => saveConfig()} variant="primary">
                        Sauvegarder la configuration
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Settings Tab - Logo Management */}
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card className="p-8">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Publier une mise à jour mobile</h2>
                    <p className="text-gray-600">Après publication, tous les utilisateurs actifs reçoivent une notification avec le lien de téléchargement.</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Version mobile">
                      <Input value={mobileRelease.version} onChange={e => setMobileRelease(prev => ({ ...prev, version: e.target.value }))} placeholder="0.1.7" />
                    </FormField>
                    <FormField label="Lien de téléchargement APK">
                      <Input value={mobileRelease.apkUrl} onChange={e => setMobileRelease(prev => ({ ...prev, apkUrl: e.target.value }))} />
                    </FormField>
                  </div>
                  <FormField label="Message envoyé aux utilisateurs">
                    <textarea value={mobileRelease.notes} onChange={e => setMobileRelease(prev => ({ ...prev, notes: e.target.value }))} className="min-h-24 w-full rounded-xl border border-gray-300 p-3 text-gray-900" />
                  </FormField>
                  <Button variant="primary" onClick={publishMobileRelease} disabled={publishingMobileRelease}>
                    {publishingMobileRelease ? 'Publication...' : 'Publier et notifier tous les utilisateurs'}
                  </Button>
                </div>
              </Card>
              <Card className="p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestion du Logo</h2>
                    <p className="text-gray-600">Changez le logo du site qui apparaît dans la barre de navigation</p>
                  </div>

                  {/* Logo Preview */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                    <div className="mb-4 flex justify-center">
                      {logoUrl && logoUrl !== '/icons/icon-192x192.png' ? (
                        <img
                          src={logoUrl.startsWith('http') ? logoUrl : `${API_BASE}${logoUrl}`}
                          alt="Logo actuel"
                          className="h-32 w-32 object-cover rounded-lg shadow-md"
                        />
                      ) : (
                        <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">Pas de logo</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Logo actuel</p>
                  </div>

                  {/* Upload Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Télécharger un nouveau logo</label>
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer block">
                        <ArrowUpTray className="h-12 w-12 text-indigo-600 mx-auto mb-3" />
                        <p className="text-lg font-semibold text-gray-900">
                          {uploadingLogo ? '⏳ Téléchargement...' : 'Cliquez pour télécharger un logo'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Format accepté: JPEG, PNG, WebP, GIF (Max 5MB)
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres additionnels</h3>
                    <div className="space-y-4">
                      <FormField label="Nom du site">
                        <Input
                          value={siteConfig.siteName}
                          onChange={e => setSiteConfig({...siteConfig, siteName: e.target.value})}
                          placeholder="Signal-Moi"
                        />
                      </FormField>
                      <div className="flex gap-4">
                        <Button
                          variant="secondary"
                          onClick={() => fetchSiteConfig()}
                        >
                          Réinitialiser
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal Delete Confirmation */}
      <Modal
        isOpen={itemToDelete !== null}
        onClose={() => {
          setItemToDelete(null)
          setDeleteReason('')
          setDeleteType(null)
        }}
        title={deleteType === 'signalement' ? 'Supprimer un signalement' : 'Supprimer une campagne'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {deleteType === 'signalement' 
              ? 'Êtes-vous sûr de vouloir supprimer ce signalement ? L\'auteur recevra une notification.'
              : 'Êtes-vous sûr de vouloir supprimer cette campagne ? Tous les participants recevront une notification.'}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Raison de la suppression (optionnel)</label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Expliquez pourquoi ce contenu est supprimé..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="3"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setItemToDelete(null)
                setDeleteReason('')
                setDeleteType(null)
              }}
              className="flex-1 border rounded py-2 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => deleteType === 'signalement' ? deleteSignalement() : deleteCampagne()}
              className="flex-1 bg-red-600 text-white rounded py-2 hover:bg-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Create/Edit User */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingUser(null)
          setFormData({ prenom: '', nom: '', email: '', telephone: '', password: '', ville: '', quartier: '', role: 'citoyen', signalementTypes: [], stationLatitude: '', stationLongitude: '' })
          setErrors({})
        }}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formData.role === 'commissariat' && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-blue-950">Compte commissariat</p>
                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    L'admin crée seulement le compte commissariat. À sa première connexion, le commissariat autorise sa position : la plateforme l’utilise automatiquement pour orienter les signalements proches.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Prénom" error={errors.prenom} required>
              <Input
                name="prenom"
                placeholder="Jean"
                value={formData.prenom}
                onChange={handleInputChange}
                error={!!errors.prenom}
              />
            </FormField>
            <FormField label="Nom" error={errors.nom} required>
              <Input
                name="nom"
                placeholder="Dupont"
                value={formData.nom}
                onChange={handleInputChange}
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
              onChange={handleInputChange}
              error={!!errors.email}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Téléphone" error={errors.telephone} required>
              <Input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                error={!!errors.telephone}
              />
            </FormField>
            <FormField label="Rôle">
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="citoyen">Citoyen</option>
                <option value="commissariat">Commissariat</option>
                <option value="collaborateur">Collaborateur</option>
                <option value="admin">Admin</option>
              </select>
            </FormField>
          </div>

          {['collaborateur', 'commissariat'].includes(formData.role) && (
            <FormField label="Types de signalements reçus">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="mb-3 text-sm text-emerald-900">
                  {formData.role === 'commissariat' ? 'Types reçus par ce commissariat. Modifiable à tout moment.' : 'Types visibles pour ce collaborateur. Modifiable à tout moment.'}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {signalementTypes.map((type) => {
                    const checked = formData.signalementTypes.includes(type.code)
                    return (
                      <label key={type.code} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${checked ? 'border-emerald-500 bg-white text-emerald-950 shadow-sm' : 'border-emerald-100 bg-white/60 text-slate-700 hover:border-emerald-300'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setFormData((prev) => ({
                            ...prev,
                            signalementTypes: checked
                              ? prev.signalementTypes.filter((code) => code !== type.code)
                              : [...prev.signalementTypes, type.code]
                          }))}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-base">{type.icon || '•'}</span>
                        <span className="font-medium">{type.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </FormField>
          )}

          <div className={`grid grid-cols-1 gap-4 ${formData.role === 'commissariat' ? 'md:grid-cols-2' : ''}`}>
            <FormField label="Ville" error={errors.ville} required>
              <Input
                name="ville"
                placeholder="Sedhiou"
                value={formData.ville}
                onChange={handleInputChange}
                error={!!errors.ville}
              />
            </FormField>
            {formData.role === 'commissariat' && <FormField label="Nom du commissariat ou brigade" error={errors.quartier} required>
              <Input
                name="quartier"
                placeholder="Ex. Commissariat central de Sédhiou"
                value={formData.quartier}
                onChange={handleInputChange}
                error={!!errors.quartier}
              />
            </FormField>}
          </div>

          {!editingUser && (
            <FormField label="Mot de passe" error={errors.password} required>
              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                error={!!errors.password}
              />
            </FormField>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {editingUser ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

