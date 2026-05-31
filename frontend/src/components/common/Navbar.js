import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  EnvelopeIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const navigation = [
    { name: 'Accueil', href: '/', icon: HomeIcon },
    { name: 'À propos', href: '/about', icon: InformationCircleIcon },
    { name: 'Signalements', href: '/signalements', icon: DocumentTextIcon },
    { name: 'Campagnes', href: '/campagnes', icon: UserGroupIcon },
    { name: 'Plaidoyers', href: '/plaidoyers', icon: DocumentTextIcon },
    { name: 'Contact', href: '/contact', icon: EnvelopeIcon },
  ]

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 fixed w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚨</span>
              <span className="text-xl font-bold bg-gradient-to-r from-red-300 to-orange-400 bg-clip-text text-transparent">
                Signal-Moi
              </span>
            </Link>
          </motion.div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = router.pathname === item.href
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`text-white transition-colors px-3 py-2 rounded-full flex items-center gap-2 cursor-pointer group relative ${isActive ? 'bg-white/15 shadow-sm' : 'hover:text-indigo-100 hover:bg-white/10'}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></div>
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!user ? (
              <>
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <button className="text-white hover:text-indigo-100 transition-colors">
                      Connexion
                    </button>
                  </motion.div>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Inscription
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/citizen/signalement">
                  <Button
                    size="sm"
                    variant="danger"
                    className="text-white"
                  >
                    🚨 Signaler
                  </Button>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 text-white hover:text-indigo-100 transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">{user?.prenom}</span>
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                        onMouseLeave={() => setProfileDropdownOpen(false)}
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">
                            {user?.prenom} {user?.nom}
                          </p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <Link href="/profile">
                          <motion.div
                            whileHover={{ backgroundColor: '#f0f9ff' }}
                            className="px-4 py-2 text-gray-700 hover:text-indigo-600 cursor-pointer flex items-center gap-2"
                            onClick={() => setProfileDropdownOpen(false)}
                          >
                            <UserCircleIcon className="h-4 w-4" />
                            Mon profil
                          </motion.div>
                        </Link>
                        <motion.button
                          whileHover={{ backgroundColor: '#fee2e2' }}
                          onClick={() => {
                            logout()
                            setProfileDropdownOpen(false)
                          }}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          Déconnexion
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-indigo-700 border-t border-indigo-500"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="flex items-center gap-3 py-3 px-3 text-white hover:bg-indigo-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </motion.div>
                  </Link>
                )
              })}

              {!user ? (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div className="py-3 px-3 text-white hover:bg-indigo-600 rounded-lg">
                      Connexion
                    </motion.div>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      className="w-full"
                      variant="secondary"
                    >
                      Inscription
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/citizen/signalement" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      className="w-full text-white"
                      variant="danger"
                    >
                      🚨 Signaler
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div className="flex items-center gap-3 py-3 px-3 text-white hover:bg-indigo-600 rounded-lg">
                      <UserCircleIcon className="h-5 w-5" />
                      {user?.prenom} {user?.nom}
                    </motion.div>
                  </Link>
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left flex items-center gap-3 py-3 px-3 text-red-300 hover:bg-indigo-600 rounded-lg"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    Déconnexion
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}