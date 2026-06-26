import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'
import { API_BASE } from '../config/api'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const { user } = useAuth()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!user?.id || !token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return () => {}
    }

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || API_BASE
    const nextSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    nextSocket.on('connect', () => {
      setSocket(nextSocket)
    })

    nextSocket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message)
    })

    nextSocket.on('new_signalement_notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
    })

    return () => {
      nextSocket.disconnect()
      setSocket(null)
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
