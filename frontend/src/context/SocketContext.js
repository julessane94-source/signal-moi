import { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useState([])
  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL, {
        auth: { token },
        transports: ['websocket']
      })

      newSocket.on('connect', () => {
        console.log('Socket connecté')
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
  }, [user, token])

  const sendMessage = (destinataireId, contenu, signalementId = null) => {
    if (socket) {
      socket.emit('send_message', { destinataireId, contenu, signalementId })
    }
  }

  const markAsRead = (messageId) => {
    if (socket) {
      socket.emit('mark_message_read', messageId)
    }
  }

  const sendTyping = (destinataireId) => {
    if (socket) {
      socket.emit('typing', { destinataireId })
    }
  }

  const value = {
    socket,
    notifications,
    sendMessage,
    markAsRead,
    sendTyping
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
