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
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <motion.div whileHover={{ scale: 1.03 }}>
          <Link href="/" className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2 text-white shadow-sm shadow-slate-200/20 transition hover:bg-slate-800">
            <span className="text-2xl">🚨</span>
            <span className="text-lg font-semibold tracking-tight">Signal-Moi</span>
          </Link>
        </motion.div>

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

        <div className="hidden md:flex items-center gap-3">
          {!user ? (
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
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/citizen/signalement">
                <Button variant="danger" size="sm" className="rounded-full px-5">
                  🚨 Signaler
                </Button>
              </Link>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-900 transition hover:bg-slate-200"
                >
                  <UserCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{user?.prenom}</span>
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
                          <UserCircleIcon className="h-4 w-4" /> Mon profil
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
                        <ArrowRightOnRectangleIcon className="h-4 w-4" /> Déconnexion
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
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

              {!user ? (
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
              ) : (
                <>
                  <Link href="/citizen/signalement" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="danger" className="w-full rounded-full text-white">
                      🚨 Signaler
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <motion.a className="flex items-center gap-3 rounded-2xl px-4 py-3 text-slate-700 transition hover:bg-slate-100">
                      <UserCircleIcon className="h-5 w-5" />
                      {user?.prenom}
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