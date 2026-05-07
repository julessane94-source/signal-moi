import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'A propos', href: '/about' },
    { name: 'Signalements', href: '/signalements' },
    { name: 'Campagnes', href: '/campagnes' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚨</span>
              <span className="text-xl font-bold text-indigo-600">Signal-Moi</span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {!user && navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            
            {!user ? (
              <>
                <Link href="/login">
                  <button className="text-gray-700 hover:text-indigo-600">Connexion</button>
                </Link>
                <Link href="/register">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Inscription
                  </button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/citizen/signalement">
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                    <span>🚨</span>
                    <span>Signaler</span>
                  </button>
                </Link>
                <div className="flex items-center space-x-3">
                  <Link href="/profile">
                    <button className="text-gray-700 hover:text-indigo-600 transition-colors">
                      Profil
                    </button>
                  </Link>
                  <span className="text-sm text-gray-600">
                    {user.prenom} {user.nom}
                  </span>
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Deconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bouton mobile */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-2">
            {!user && navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-gray-700 hover:text-indigo-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {!user ? (
              <>
                <Link href="/login" className="block py-2 text-gray-700">
                  Connexion
                </Link>
                <Link href="/register" className="block py-2 bg-indigo-600 text-white text-center rounded-lg">
                  Inscription
                </Link>
              </>
            ) : (
              <>
                <Link href="/citizen/signalement" className="block py-2 bg-red-600 text-white text-center rounded-lg">
                  🚨 Signaler
                </Link>
                <Link href="/profile" className="block py-2 text-gray-700">
                  Profil
                </Link>
                <button onClick={logout} className="block w-full text-left py-2 text-red-600">
                  Deconnexion
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}