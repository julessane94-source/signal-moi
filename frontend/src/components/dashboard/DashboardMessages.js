import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { API_BASE } from '../../config/api'

export default function DashboardMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      const messageList = Array.isArray(data) ? data : []
      setMessages(messageList)
      setUnreadCount(messageList.filter(m => !m.read).length)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Vos messages</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {unreadCount} nouveau
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-gray-500">Aucun message pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.slice(0, 5).map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border-l-4 ${
                msg.read
                  ? 'bg-gray-50 border-gray-300'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{msg.from || 'Signal-Moi'}</p>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{msg.subject || msg.content}</p>
                  <span className="text-xs text-gray-500 mt-2 inline-block">
                    {new Date(msg.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {!msg.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {messages.length > 5 && (
        <Link href="/citizen/messages">
          <button className="w-full mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
            Voir tous les messages →
          </button>
        </Link>
      )}
    </div>
  )
}
