import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (user && token) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const opts = { auth: { token }, transports: ['websocket'] }
      console.info('Socket: attempting connect', { socketUrl, opts: { transports: opts.transports } })
      const newSocket = io(socketUrl, opts)

      newSocket.on('connect', () => {
        console.log('Socket connecté -> id=', newSocket.id)
      })

      newSocket.on('connect_error', (err) => {
        console.error('Socket connect_error:', err && err.message)
      })

      newSocket.on('reconnect_attempt', (attempt) => {
        console.info('Socket reconnect attempt', attempt)
      })

      newSocket.on('new_message', (message) => {
        toast.info(`Nouveau message de ${message.expediteurNom}`)
        setNotifications(prev => [message, ...prev])
      })

      newSocket.on('new_signalement_notification', (signalement) => {
        toast.warning(`Nouveau signalement: ${signalement.title}`)
        setNotifications(prev => [signalement, ...prev])
      })

      newSocket.on('status_updated', (data) => {
        toast.info(`Votre signalement #${data.signalementId} est maintenant ${data.nouveauStatut}`)
        setNotifications(prev => [data, ...prev])
      })

      newSocket.on('user_typing', (data) => {
        // Gérer l'indicateur de frappe
        console.log(`${data.expediteurNom} est en train d'écrire...`)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket déconnecté')
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user?.id])

  const sendMessage = useCallback((destinataireId, contenu, signalementId = null) => {
    if (socket) {
      socket.emit('send_message', { destinataireId, contenu, signalementId })
    }
  }, [socket])

  const markAsRead = useCallback((messageId) => {
    if (socket) {
      socket.emit('mark_message_read', messageId)
    }
  }, [socket])

  const sendTyping = useCallback((destinataireId) => {
    if (socket) {
      socket.emit('typing', { destinataireId })
    }
  }, [socket])

  const value = useMemo(() => ({
    socket,
    notifications,
    sendMessage,
    markAsRead,
    sendTyping
  }), [socket, notifications, sendMessage, markAsRead, sendTyping])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
