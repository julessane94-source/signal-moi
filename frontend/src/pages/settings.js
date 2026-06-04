import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Chatbot from '../components/Chatbot'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import {
  CogIcon,
  TrashIcon as Trash,
  ArrowRightOnRectangleIcon as ArrowRightOnRectangle,
  UserIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

export default function Settings() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Connexion requise</p>
          <Link href="/login">
            <button className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg">
              Se connecter
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Paramètres - Signal-Moi</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Retour
            </button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <CogIcon className="h-10 w-10 text-indigo-600" />
              Paramètres
            </h1>
            <p className="text-gray-600 mt-2">Gérez votre compte et vos préférences</p>
          </motion.div>

          {/* Profil utilisateur */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.prenom?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.prenom} {user.nom}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">
                    {user.role === 'citoyen' ? '🧑‍🦰 Citoyen' : 
                     user.role === 'admin' ? '👨‍💼 Administrateur' :
                     user.role === 'collaborateur' ? '🤝 Collaborateur' :
                     user.role === 'police' ? '👮 Police' : user.role}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sections */}
          <div className="space-y-6">
            {/* Paramètres de compte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-600" />
                Compte
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700">Email</span>
                  <span className="text-gray-900 font-semibold">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700">Rôle</span>
                  <span className="text-gray-900 font-semibold">{user.role}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-700">Membre depuis</span>
                  <span className="text-gray-900 font-semibold">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Sécurité */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                Sécurité
              </h3>
              <div className="space-y-4">
                <button className="w-full text-left flex justify-between items-center py-3 px-4 hover:bg-gray-50 rounded-lg transition border border-gray-200">
                  <span className="text-gray-700">Changer mon mot de passe</span>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {/* Déconnexion */}
              <button
                onClick={() => {
                  logout()
                  router.push('/')
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
              >
                <ArrowRightOnRectangle className="h-5 w-5" />
                Me déconnecter
              </button>

              {/* Supprimer le compte */}
              <Link href="/account/delete">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition"
                >
                  <Trash className="h-5 w-5" />
                  Supprimer mon compte
                </motion.button>
              </Link>
            </motion.div>

            {/* Info légale */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 rounded-lg p-6 text-xs text-gray-600 text-center border border-gray-200"
            >
              <p>En supprimant votre compte, vous acceptez que vos données personnelles soient supprimées de façon définitive.</p>
              <p className="mt-2">Les signalements résolus et en cours seront conservés de manière anonyme.</p>
            </motion.div>
          </div>
        </div>
      </div>
      <Chatbot />
    </>
  )
}
