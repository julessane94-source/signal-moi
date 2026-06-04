import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { Button, Card } from '../components/ui'
import {
  Bell,
  Check,
  XMark,
  ArrowLeft,
  Exclamation,
  DocumentText,
  Campaign
} from '@heroicons/react/24/outline'
import { API_BASE } from '../config/api'

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/citizen/notifications`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error('Erreur lors du chargement des notifications:', err)
      setError('Impossible de charger les notifications')
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_signalement':
        return DocumentText
      case 'new_campaign':
        return Campaign
      default:
        return Bell
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_signalement':
        return 'from-red-500 to-red-600'
      case 'new_campaign':
        return 'from-green-500 to-green-600'
      default:
        return 'from-blue-500 to-blue-600'
    }
  }

  if (!user) return null

  return (
    <>
      <Head>
        <title>Notifications - Signal-Moi</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/profile">
              <Button variant="secondary" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  {notifications.length === 0 ? 'Aucune notification' : `${notifications.length} notification(s)`}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              {error}
            </motion.div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune notification</h2>
                <p className="text-gray-600">
                  Vous recevrez des notifications lorsque de nouveaux signalements ou campagnes seront publiés.
                </p>
                <Link href="/signalements">
                  <Button className="mt-6">
                    Voir les signalements
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, idx) => {
                const Icon = getNotificationIcon(notification.type)
                const colorClass = getNotificationColor(notification.type)
                const isRead = notification.est_lu

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`p-4 ${isRead ? 'bg-gray-50 opacity-75' : 'bg-white border-l-4 border-blue-500'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClass} text-white flex-shrink-0`}>
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {notification.titre}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {isRead ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
