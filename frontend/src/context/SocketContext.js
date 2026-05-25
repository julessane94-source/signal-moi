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

  // Disable socket.io for now to prevent React Error #310
  // Socket is optional - dashboard works without it
  // TODO: Fix socket.io authentication on backend then re-enable
  useEffect(() => {
    // Don't initialize socket - just keep it as null
    // This prevents connection errors from crashing the app
    return () => {}
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
