import React, { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { COLORS } from '../../config/env'
import PrimaryButton from '../../components/PrimaryButton'
import { createSignalement } from '../../services/api'
import { useLocation } from '../../context/LocationContext'
import { REPORT_TYPES, getReportTypeLabel } from '../../constants/reportTypes'

export default function CreateSignalementScreen({ navigation, route }) {
  const { position, address, requestCurrentLocation } = useLocation()
  const [selectedType, setSelectedType] = useState(route?.params?.type || 'violence')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (route?.params?.type && REPORT_TYPES.some((item) => item.type === route.params.type)) {
      setSelectedType(route.params.type)
    }
  }, [route?.params?.type])

  async function pickMedia(source = 'library') {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission requise', source === 'camera' ? 'Autorisez la caméra pour prendre une preuve.' : 'Autorisez les fichiers pour joindre une preuve.')
      return
    }

    const pickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.75,
      allowsMultipleSelection: source !== 'camera',
      videoMaxDuration: 180
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions)
    if (!result.canceled) setFiles((current) => [...current, ...result.assets])
  }

  async function startLive() {
    const coords = position || (await requestCurrentLocation())
    if (!coords) {
      Alert.alert('GPS requis', 'Activez la localisation avant le live.')
      return
    }

    const params = {
      sessionId: `mobile-live-${Date.now()}`,
      type: selectedType,
      description: description || `Alerte live mobile: ${selectedType}`,
      latitude: coords.latitude,
      longitude: coords.longitude
    }
    openRootScreen('LiveCamera', params)
  }

  function openRootScreen(screenName, params) {
    let current = navigation
    while (current?.getParent?.()) {
      const parent = current.getParent()
      if (!parent) break
      current = parent
    }
    current?.navigate?.(screenName, params)
  }

  async function submit() {
    setLoading(true)
    try {
      const coords = position || (await requestCurrentLocation())
      if (!coords) {
        Alert.alert('GPS requis', 'Activez la localisation pour que la police voie le bon lieu.')
        return
      }

      const localisation = [address?.district, address?.subregion, address?.city, address?.region]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(', ') || `GPS ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
      const label = getReportTypeLabel(selectedType)

      await createSignalement({
        titre: title.trim() || `Signalement : ${label}`,
        type: selectedType,
        description: description || `Signalement rapide: ${label}`,
        localisation,
        latitude: coords.latitude,
        longitude: coords.longitude,
        files
      })

      setDescription('')
      setTitle('')
      setFiles([])
      Alert.alert('Signalement envoye', 'Votre alerte a ete transmise avec votre position GPS.')
    } catch (error) {
      Alert.alert('Envoi impossible', error.response?.data?.message || 'Reessayez dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Faire un signalement</Text>
      <Text style={styles.subtitle}>Choisissez un type, ajoutez votre position et une preuve photo ou vidéo si possible.</Text>

      <View style={styles.quickGrid}>
        {REPORT_TYPES.map((item) => {
          const active = selectedType === item.type
          return (
            <Pressable
              key={item.type}
              onPress={() => setSelectedType(item.type)}
              style={[styles.quickButton, active && { borderColor: item.tone, backgroundColor: '#fff' }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.tone }]}>
                <Ionicons name={item.icon} size={26} color="#fff" />
              </View>
              <Text style={styles.quickText}>{item.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Titre du signalement (facultatif)"
        placeholderTextColor="#8a9a96"
        style={styles.titleInput}
      />

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Expliquez en quelques mots, ou laissez vide."
        placeholderTextColor="#8a9a96"
        multiline
        style={styles.textarea}
      />

      <View style={styles.actions}>
        <Pressable style={styles.secondaryButton} onPress={() => pickMedia('library')}>
          <Ionicons name="image" size={21} color={COLORS.primary} />
          <Text style={styles.secondaryText}>Galerie : photo ou vidéo ({files.length})</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => pickMedia('camera')}>
          <Ionicons name="camera" size={21} color={COLORS.primary} />
          <Text style={styles.secondaryText}>Prendre une preuve</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={startLive}>
          <Ionicons name="videocam" size={21} color={COLORS.danger} />
          <Text style={styles.secondaryText}>Lancer un live</Text>
        </Pressable>
      </View>

      <View style={styles.locationBox}>
        <Ionicons name="navigate" size={22} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.locationTitle}>Localisation automatique</Text>
          <Text style={styles.locationText}>
            {position ? `${[address?.district || address?.subregion, address?.city].filter(Boolean).join(' · ') || 'GPS actif'} · ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : 'Appuyez pour activer le GPS'}
          </Text>
        </View>
        <Pressable onPress={requestCurrentLocation}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <PrimaryButton title="Envoyer le signalement" onPress={submit} loading={loading} tone="danger" />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbfa'
  },
  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 34,
    gap: 18
  },
  title: {
    color: COLORS.ink,
    fontSize: 28,
    fontWeight: '900'
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 22
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickButton: {
    width: '47%',
    minHeight: 108,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 16,
    justifyContent: 'space-between'
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickText: {
    color: COLORS.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  titleInput: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    color: COLORS.ink,
    fontSize: 16
  },
  textarea: {
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    padding: 16,
    color: COLORS.ink,
    fontSize: 16,
    textAlignVertical: 'top'
  },
  actions: {
    gap: 10
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  secondaryText: {
    color: COLORS.ink,
    fontWeight: '800'
  },
  locationBox: {
    borderRadius: 18,
    backgroundColor: COLORS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  locationTitle: {
    color: COLORS.ink,
    fontWeight: '900'
  },
  locationText: {
    color: COLORS.muted,
    marginTop: 3
  }
})
