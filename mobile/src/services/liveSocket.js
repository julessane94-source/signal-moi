import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config/env'

let socket

export function connectLiveSocket(token, user) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    query: {
      role: user?.role || 'citoyen',
      userId: user?.id || user?._id || ''
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000
  })

  return socket
}

export function getLiveSocket() {
  return socket
}

export function disconnectLiveSocket() {
  socket?.disconnect()
  socket = null
}
