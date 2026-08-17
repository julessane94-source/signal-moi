import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import PrimaryButton from '../../components/PrimaryButton'
import { sendLiveSession } from '../../services/api'
import { connectLiveSocket } from '../../services/liveSocket'
import { useAuth } from '../../context/AuthContext'
import { useLocation } from '../../context/LocationContext'

const FRAME_INTERVAL_MS = 2200

export default function LiveCameraScreen({ route, navigation }) {
  const cameraRef = useRef(null)
  const timerRef = useRef(null)
  const { token, user } = useAuth()
  const { position, address, requestCurrentLocation } = useLocation()
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions()
  const [running, setRunning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [frameCount, setFrameCount] = useState(0)
  const [facing, setFacing] = useState('back')

  const sessionId = useMemo(() => route?.params?.sessionId || `mobile-live-${Date.now()}`, [route?.params?.sessionId])
  const type = route?.params?.type || 'danger'
  const description = route?.params?.description || `Alerte live mobile: ${type}`

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      sendLiveSession({ action: 'stop', sessionId }).catch(() => {})
    }
  }, [sessionId])

  async function ensurePermissions() {
    const camera = cameraPermission?.granted ? cameraPermission : await requestCameraPermission()
    const microphone = microphonePermission?.granted ? microphonePermission : await requestMicrophonePermission()
    return camera?.granted && microphone?.granted
  }

  function buildBasePayload(coords) {
    return {
      sessionId,
      type,
      titre: `Live mobile: ${type}`,
      description,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
      localisation: [address?.street, address?.city, address?.region].filter(Boolean).join(', ')
    }
  }

  async function sendFrame() {
    if (!cameraRef.current) return
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.35,
        skipProcessing: true
      })
      if (!photo?.base64) return

      const coords = position || await requestCurrentLocation()
      const frame = `data:image/jpg;base64,${photo.base64}`
      const payload = {
        ...buildBasePayload(coords),
        action: 'frame',
        frame
      }
      await sendLiveSession(payload)
      connectLiveSocket(token, user)?.emit('live_recording_frame', payload)
      setFrameCount((count) => count + 1)
    } catch (error) {
      // La camera peut etre occupee entre deux captures; on ignore et le prochain intervalle reprend.
    }
  }

  async function startLive() {
    if (running || starting) return
    if (!cameraReady) {
      Alert.alert('Caméra en préparation', 'Patientez une seconde, le direct sera disponible dès que la caméra est prête.')
      return
    }

    setStarting(true)
    try {
      const allowed = await ensurePermissions()
      if (!allowed) {
        Alert.alert('Permissions requises', 'Autorisez la caméra et le micro dans les paramètres du téléphone pour lancer le live.')
        return
      }

      const coords = position || await requestCurrentLocation()
      if (!coords) {
        Alert.alert('GPS requis', 'Autorisez la localisation pour lancer le live.')
        return
      }

      const payload = { ...buildBasePayload(coords), action: 'start' }
      try {
        await sendLiveSession(payload)
      } catch (error) {
        Alert.alert('Transmission indisponible', 'La caméra est prête, mais le serveur ne répond pas. Vérifiez votre connexion puis réessayez.')
        return
      }
      const socket = connectLiveSocket(token, user)
      socket?.emit('live_recording_started', payload)
      socket?.emit('live_recording_location', payload)
      setRunning(true)
      await sendFrame()
      timerRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS)
    } catch (error) {
      Alert.alert('Impossible de démarrer le live', 'Fermez les autres applications utilisant la caméra, puis réessayez.')
    } finally {
      setStarting(false)
    }
  }

  async function stopLive() {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setRunning(false)
    const payload = { action: 'stop', sessionId, type }
    await sendLiveSession(payload).catch(() => {})
    connectLiveSocket(token, user)?.emit('live_recording_stopped', payload)
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} mode="picture" onCameraReady={() => setCameraReady(true)} onMountError={() => Alert.alert('Caméra indisponible', 'La caméra ne peut pas être ouverte sur cet appareil.')}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" color="#fff" size={26} />
          </Pressable>
          <View style={styles.status}>
            <View style={[styles.dot, running && styles.dotLive]} />
            <Text style={styles.statusText}>{running ? 'LIVE POLICE' : 'Pret'}</Text>
          </View>
          <Pressable onPress={() => setFacing((value) => value === 'back' ? 'front' : 'back')} style={styles.iconButton}>
            <Ionicons name="camera-reverse" color="#fff" size={24} />
          </Pressable>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.title}>Session {sessionId}</Text>
          <Text style={styles.meta}>{frameCount} image(s) transmise(s) a la police</Text>
          <Text style={styles.meta}>
            {position ? `GPS ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : 'GPS en attente'}
          </Text>
          {running ? (
            <PrimaryButton title="Arreter le live" tone="danger" onPress={stopLive} />
          ) : (
            <PrimaryButton title={starting ? 'Démarrage du live...' : cameraReady ? 'Démarrer le live' : 'Préparation caméra...'} tone="danger" onPress={startLive} disabled={starting} />
          )}
        </View>
      </CameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  topBar: {
    paddingTop: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#94a3b8' },
  dotLive: { backgroundColor: COLORS.danger },
  statusText: { color: '#fff', fontWeight: '900' },
  bottomPanel: {
    margin: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.62)',
    padding: 18,
    gap: 10
  },
  title: { color: '#fff', fontSize: 17, fontWeight: '900' },
  meta: { color: '#dbeafe', fontWeight: '700' }
})
