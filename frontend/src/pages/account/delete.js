'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { API_BASE } from '../config/api'
import { motion } from 'framer-motion'
import Head from 'next/head'
import { 
  TrashIcon, 
  ExclamationIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline'

export default function DeleteAccount() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [signalementStats, setSignalementStats] = useState(null)
  const [step, setStep] = useState('intro') // 'intro', 'preview', 'confirm', 'loading'

  // Récupérer les infos sur les signalements de l'utilisateur
  const fetchSignalementStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/my-signalements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSignalementStats(data.stats)
        setStep('preview')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('❌ Erreur lors de la récupération des données')
    }
  }

  const handleDelete = async (e) => {
    e.preventDefault()

    if (!password) {
      toast.error('❌ Veuillez entrer votre mot de passe')
      return
    }

    if (confirmText !== 'SUPPRIMER MON COMPTE') {
      toast.error('❌ Veuillez taper exactement "SUPPRIMER MON COMPTE"')
      return
    }

    setStep('loading')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      const data = await res.json()

      if (!res.ok) {
        setStep('confirm')
        toast.error('❌ ' + (data.error || 'Erreur lors de la suppression'))
        return
      }

      toast.success('✅ Compte supprimé avec succès')
      localStorage.removeItem('token')
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error) {
      setStep('confirm')
      console.error('Erreur:', error)
      toast.error('❌ Erreur lors de la suppression du compte')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Connexion requise</p>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Supprimer mon compte - Signal-Moi</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header avec bouton retour */}
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
              <TrashIcon className="h-10 w-10 text-red-600" />
              Supprimer mon compte
            </h1>
            <p className="text-gray-600 mt-2">Cette action est irréversible</p>
          </motion.div>

          {/* Étape 1: Introduction */}
          {step === 'intro' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-lg p-8 mb-6"
            >
              {/* Avertissement */}
              <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-8 rounded">
                <div className="flex gap-4">
                  <ExclamationIcon className="h-8 w-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-2">⚠️ Attention!</h3>
                    <p className="text-red-800 text-sm">
                      La suppression de votre compte est <strong>définitive et irréversible</strong>. 
                      Toutes vos données personnelles seront supprimées immédiatement, sauf:
                    </p>
                    <ul className="mt-3 text-red-800 text-sm space-y-1">
                      <li>✅ <strong>Les signalements résolus</strong> (statut: Traité)</li>
                      <li>✅ <strong>Les signalements en cours</strong> (statut: En cours)</li>
                      <li>✅ <strong>Les signalements transférés</strong> (statut: Transféré)</li>
                      <li>❌ Les autres signalements et vos données personnelles seront supprimés</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Infos sur les signalements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-blue-900 mb-4">📊 Avant de continuer, regardons vos signalements</h3>
                <button
                  onClick={fetchSignalementStats}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Voir mes signalements
                </button>
              </div>

              {/* Consequences */}
              <div className="space-y-4 mb-8">
                <h3 className="font-semibold text-gray-900">Que se passera-t-il:</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex gap-3">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Votre profil sera supprimé</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Votre email et données personnelles seront supprimés</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Vous ne pourrez plus vous connecter</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Vos signalements résolus/en cours resteront accessibles aux administrateurs (anonymisés)</span>
                  </li>
                </ul>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={fetchSignalementStats}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          )}

          {/* Étape 2: Preview des signalements */}
          {step === 'preview' && signalementStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-lg p-8 mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Récapitulatif de vos signalements</h2>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-600">Total</p>
                  <p className="text-3xl font-bold text-blue-900">{signalementStats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600">Traités</p>
                  <p className="text-3xl font-bold text-green-900">{signalementStats.traite}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-yellow-600">En cours</p>
                  <p className="text-3xl font-bold text-yellow-900">{signalementStats.en_cours}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">Transférés</p>
                  <p className="text-3xl font-bold text-purple-900">{signalementStats.transfere}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center col-span-2 md:col-span-1">
                  <p className="text-sm text-red-600">À supprimer</p>
                  <p className="text-3xl font-bold text-red-900">{signalementStats.aSupprimer}</p>
                </div>
              </div>

              {/* Info conservation */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-green-900 mb-3">✅ Signalements conservés</h3>
                <p className="text-green-800 text-sm mb-3">
                  <strong>{signalementStats.traite + signalementStats.en_cours + signalementStats.transfere}</strong> signalement(s) 
                  {(signalementStats.traite + signalementStats.en_cours + signalementStats.transfere) > 1 ? 's' : ''} 
                  {' '}seront conservé{(signalementStats.traite + signalementStats.en_cours + signalementStats.transfere) > 1 ? 's' : ''} de manière anonyme:
                </p>
                <ul className="space-y-1 text-green-800 text-sm">
                  <li>• Les signalements traités</li>
                  <li>• Les signalements en cours de traitement</li>
                  <li>• Les signalements transférés</li>
                </ul>
              </div>

              {/* Info suppression */}
              {signalementStats.aSupprimer > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-orange-900 mb-3">⚠️ Signalements supprimés</h3>
                  <p className="text-orange-800 text-sm">
                    <strong>{signalementStats.aSupprimer}</strong> signalement(s) neuf/nouveau/rejeté seront définitivement supprimé(s).
                  </p>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Confirmer la suppression →
                </button>
              </div>
            </motion.div>
          )}

          {/* Étape 3: Confirmation finale */}
          {step === 'confirm' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-lg p-8 mb-6"
            >
              <h2 className="text-2xl font-bold text-red-900 mb-6">Confirmer la suppression</h2>

              {/* Avertissement final */}
              <div className="bg-red-50 border border-red-300 rounded-lg p-6 mb-8">
                <p className="text-red-900 font-semibold mb-3">Êtes-vous vraiment sûr?</p>
                <p className="text-red-800 text-sm">
                  Cette action ne peut pas être annulée. Veuillez confirmer en:
                </p>
                <ol className="mt-3 text-red-800 text-sm space-y-1">
                  <li>1. Entrant votre mot de passe</li>
                  <li>2. Tapant exactement: <span className="font-mono font-bold">SUPPRIMER MON COMPTE</span></li>
                </ol>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleDelete} className="space-y-6">
                {/* Mot de passe */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Votre mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    ℹ️ Pour confirmer votre identité
                  </p>
                </div>

                {/* Texte de confirmation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tapez pour confirmer: <span className="font-mono bg-red-100 px-2 py-1 rounded">SUPPRIMER MON COMPTE</span>
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Tapez le texte ci-dessus..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {confirmText === 'SUPPRIMER MON COMPTE' 
                      ? '✅ Texte correct' 
                      : `❌ Doit être exactement: "SUPPRIMER MON COMPTE" (${confirmText.length}/21)`}
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('preview')}
                    className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || confirmText !== 'SUPPRIMER MON COMPTE' || !password}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Suppression en cours...' : 'Supprimer définitivement mon compte'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Étape 4: Loading */}
          {step === 'loading' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-lg p-8 text-center"
            >
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Suppression en cours...</h2>
              <p className="text-gray-600">Veuillez patienté, votre compte est en cours de suppression.</p>
              <p className="text-xs text-gray-500 mt-6">Vous serez redirigé vers l'accueil dans quelques secondes</p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
