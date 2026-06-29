import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui'
import {
  Bars3Icon as Bars3,
  XMarkIcon as XMark,
  HomeIcon as Home,
  InformationCircleIcon as InformationCircle,
  DocumentTextIcon as DocumentText,
  UserGroupIcon as UserGroup,
  EnvelopeIcon as Envelope,
  UserCircleIcon as UserCircle,
  ArrowRightOnRectangleIcon as ArrowRightOnRectangle,
  CogIcon as Cog,
  HeartIcon as Heart,
  BellIcon as Bell,
  Squares2X2Icon as Squares2X2
} from '@heroicons/react/24/outline'

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase()
  if (['admin', 'administrateur'].includes(value)) return 'admin'
  if (['police', 'policier', 'force_ordre'].includes(value)) return 'police'
  if (['collaborateur', 'collaborator'].includes(value)) return 'collaborateur'
  if (['citoyen', 'citizen', 'user'].includes(value)) return 'citoyen'
  return value
}
export default function Navbar() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/icons/icon-192x192.png')
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        // Recuperer le logo depuis la base de donnees (base64)
        const res = await fetch(`${API_BASE}/api/auth/site-config`)
        const data = await res.json()
        setLogoUrl(data.logoUrl || '/icons/icon-192x192.png')
      } catch (err) {
        console.warn('Impossible de charger le logo depuis BD, utilisation du fallback:', err.message)
        setLogoUrl('/icons/icon-192x192.png')
      }
    }

    fetchLogo()
  }, [])

  // Charger le compteur de notifications quand l'utilisateur se connecte
  useEffect(() => {
    if (!user) {
      setNotificationCount(0)
      return
    }

    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/citizen/notifications/count`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
        const data = await res.json()
        setNotificationCount(data.unreadCount || 0)
      } catch (err) {
        console.warn('Impossible de charger le compteur de notifications:', err.message)
      }
    }

    fetchNotificationCount()
    // Rafraichir le compteur toutes les 30 secondes
    const interval = setInterval(fetchNotificationCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  const getImageUrl = (url) => {
    if (!url) return '/icons/icon-192x192.png'
    if (url.startsWith('data:')) return url

    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url)
        if (parsed.pathname.startsWith('/uploads/')) return `${API_BASE}${parsed.pathname}${parsed.search || ''}`
        return parsed.pathname || '/icons/icon-192x192.png'
      } catch (err) {
        return '/icons/icon-192x192.png'
      }
    }

    if (url.startsWith('/uploads/')) return `${API_BASE}${url}`
    return url
  }

  const role = normalizeRole(user?.role)
  const dashboardHref = role === 'admin' ? '/admin/dashboard' :
    role === 'police' ? '/police/dashboard' :
    role === 'collaborateur' ? '/collaborator/dashboard' : '/citizen/dashboard'
  const isLoggedIn = Boolean(user)
  const showPublicNavigation = !loading && !isLoggedIn
  const showPrivateNavigation = !loading && isLoggedIn
  const navigation = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'A propos', href: '/about', icon: InformationCircle },
    { name: 'Signalements', href: '/signalements', icon: DocumentText },
    { name: 'Campagnes', href: '/campagnes', icon: UserGroup },
    { name: 'Plaidoyers', href: '/plaidoyers', icon: DocumentText },
    { name: 'Contact', href: '/contact', icon: Envelope },
  ]

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
            <img src={getImageUrl(logoUrl)} alt="Logo Signal-Moi" className="h-10 w-10 rounded-lg object-cover shadow-md" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Signal-Moi</span>
          </Link>
        </motion.div>

        {showPublicNavigation && (
          <div className="hidden md:flex items-center gap-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/' ? router.pathname === item.href : router.pathname.startsWith(item.href)
              return (
                <Link key={item.name} href={item.href}>
                  <motion.a
                    whileHover={{ y: -1 }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </motion.a>
                </Link>
              )
            })}
          </div>
        )}

        <div className="hidden md:flex items-center gap-3">
          <Link href="/donate">
            <motion.a whileHover={{ scale: 1.05 }} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700">
              <Heart className="h-5 w-5" />
              Soutenir
            </motion.a>
          </Link>
          {showPublicNavigation ? (
            <>
              <Link href="/login">
                <motion.a whileHover={{ scale: 1.02 }} className="text-slate-700 hover:text-slate-900">
                  Connexion
                </motion.a>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="sm" className="rounded-full">
                  Inscription
                </Button>
              </Link>
            </>
          ) : showPrivateNavigation ? (
            <div className="flex items-center gap-3">
              <Link href={dashboardHref}>
                <motion.a whileHover={{ scale: 1.02 }} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">
                  <Squares2X2 className="h-4 w-4" />
                  Tableau de bord
                </motion.a>
              </Link>
              {role === 'citoyen' && (
                <Link href="/citizen/signalement">
                  <Button variant="danger" size="sm" className="rounded-full px-5">
                    Signaler
                  </Button>
                </Link>
              )}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-900 transition hover:bg-slate-200 relative"
                >
                  <UserCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{user?.prenom}</span>
                  {notificationCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </motion.div>
                  )}
                </motion.button>
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
                      onMouseLeave={() => setProfileDropdownOpen(false)}
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{user?.prenom} {user?.nom}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      <Link href="/profile">
                        <motion.a whileHover={{ backgroundColor: '#f8fafc' }} className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:text-slate-900">
                          <UserCircle className="h-4 w-4" /> Mon profil
                        </motion.a>
                      </Link>
                      <Link href={dashboardHref}>
                        <motion.a whileHover={{ backgroundColor: '#f8fafc' }} className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:text-slate-900">
                          <Squares2X2 className="h-4 w-4" /> Tableau de bord
                        </motion.a>
                      </Link>
                      <Link href="/settings">
                        <motion.a whileHover={{ backgroundColor: '#f8fafc' }} className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:text-slate-900">
                          <Cog className="h-4 w-4" /> Parametres
                        </motion.a>
                      </Link>
                      <Link href="/notifications">
                        <motion.a whileHover={{ backgroundColor: '#f8fafc' }} className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:text-slate-900 relative">
                          <Bell className="h-4 w-4" />
                          Notifications
                          {notificationCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                          )}
                        </motion.a>
                      </Link>
                      <motion.button
                        whileHover={{ backgroundColor: '#fef2f2' }}
                        onClick={() => {
                          logout()
                          setProfileDropdownOpen(false)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <ArrowRightOnRectangle className="h-4 w-4" /> Deconnexion
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <XMark className="h-6 w-6" /> : <Bars3 className="h-6 w-6" />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-slate-200 bg-white/95 px-4 py-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <span className="text-sm font-semibold text-slate-900">Menu</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{user ? `Bonjour, ${user.prenom}` : 'Visiteur'}</span>
            </div>
            {showPublicNavigation && (
              <div className="px-4 py-4 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = item.href === '/' ? router.pathname === item.href : router.pathname.startsWith(item.href)
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <motion.a
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100"
                        style={isActive ? { backgroundColor: '#f8fafc' } : undefined}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </motion.a>
                    </Link>
                  )
                })}
              </div>
            )}
            <div className="px-4 py-4 space-y-2">
              <Link href="/donate" onClick={() => setMobileMenuOpen(false)}>
                <motion.a className="flex items-center justify-center gap-2 w-full rounded-full bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700">
                  <Heart className="h-5 w-5" />
                  Soutenir
                </motion.a>
              </Link>

              {showPublicNavigation ? (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <motion.a className="block rounded-2xl px-4 py-3 text-center text-slate-700 transition hover:bg-slate-100">
                      Connexion
                    </motion.a>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full rounded-full">
                      Inscription
                    </Button>
                  </Link>
                </>
              ) : showPrivateNavigation ? (
                <>
                  {role === 'citoyen' && (
                    <Link href="/citizen/signalement" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="danger" className="w-full rounded-full text-white">
                        Signaler
                      </Button>
                    </Link>
                  )}
                  <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                    <motion.a className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100">
                      <Squares2X2 className="h-5 w-5" />
                      Tableau de bord
                    </motion.a>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <motion.a className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100">
                      <UserCircle className="h-5 w-5" />
                      {user?.prenom}
                    </motion.a>
                  </Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <motion.a className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100">
                      <Cog className="h-5 w-5" />
                      Parametres
                    </motion.a>
                  </Link>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-50 px-4 py-3 text-rose-600"
                  >
                    <ArrowRightOnRectangle className="h-5 w-5" />
                    Deconnexion
                  </motion.button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
