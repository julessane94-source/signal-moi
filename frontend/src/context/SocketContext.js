import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'
import { API_BASE } from '../config/api'
import { toast } from 'react-toastify'
import {
  notifyRealtimeEvent,
  prepareRealtimeAlerts,
  requestRealtimeNotificationPermission,
  unlockRealtimeAudio
} from '../utils/realtimeAlerts'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

const getSocketUrl = () => {
  const explicitUrl = process.env.NEXT_PUBLIC_WS_URL
  const baseUrl = explicitUrl || API_BASE

  try {
    const parsed = new URL(baseUrl)
    if (parsed.pathname.replace(/\/+$/, '') === '/api') {
      parsed.pathname = '/'
    }
    return parsed.toString().replace(/\/$/, '')
  } catch (error) {
    return baseUrl.replace(/\/api\/?$/, '')
  }
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const socketRef = useRef(null)
  const { user } = useAuth()

  useEffect(() => {
    const cleanup = prepareRealtimeAlerts()
    return cleanup
  }, [])

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
    }

    if (!user?.id || !token) {
      return () => {}
    }

    const socketUrl = getSocketUrl()
    const nextSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1000
    })

    socketRef.current = nextSocket
    setSocket(nextSocket)

    const emitUserAlert = (event, payload) => {
      notifyRealtimeEvent({
        role: user?.role,
        event,
        payload,
        toast
      })
    }

    nextSocket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message)
    })

    nextSocket.on('new_signalement_notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
      emitUserAlert('new_signalement_notification', notification)
    })

    nextSocket.on('signalement_received', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
      emitUserAlert('signalement_received', notification)
    })

    nextSocket.on('live_recording_started', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
      emitUserAlert('live_recording_started', notification)
    })

    nextSocket.on('followed_case_update', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
      emitUserAlert('followed_case_update', notification)
    })

    nextSocket.on('message_received', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20))
      emitUserAlert('message_received', notification)
    })

    return () => {
      nextSocket.off('new_signalement_notification')
      nextSocket.off('signalement_received')
      nextSocket.off('live_recording_started')
      nextSocket.off('followed_case_update')
      nextSocket.off('message_received')
      nextSocket.disconnect()
      if (socketRef.current === nextSocket) {
        socketRef.current = null
      }
      setSocket(null)
    }
  }, [user?.id, user?.role])

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
    requestNotificationPermission: requestRealtimeNotificationPermission,
    unlockNotificationSound: unlockRealtimeAudio,
    sendMessage,
    markAsRead,
    sendTyping
  }), [socket, notifications, sendMessage, markAsRead, sendTyping])

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
