import React from 'react'
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../config/env'

function getReporter(item = {}) {
  return item.reporter || item.user || item.victime || {
    telephone: item.telephone || item.user_telephone,
    email: item.email || item.user_email,
    prenom: item.prenom || item.user_prenom,
    nom: item.nom || item.user_nom
  }
}

function getPhone(item) {
  const reporter = getReporter(item)
  return reporter?.telephone || item?.telephone
}

function getEmail(item) {
  const reporter = getReporter(item)
  return reporter?.email || item?.email
}

function getCoordinates(item = {}) {
  const lat = item.latitude || item.lat || item.coordinates?.lat
  const lng = item.longitude || item.lng || item.coordinates?.lng
  return { lat, lng }
}

export function openVictimMap(item) {
  const { lat, lng } = getCoordinates(item)
  if (lat && lng) {
    Linking.openURL(`https://www.google.com/maps/?q=${lat},${lng}`)
    return
  }

  const place = item.localisation || item.adresse || item.location
  if (place) {
    Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(place)}`)
    return
  }

  Alert.alert('Position indisponible', 'Aucune position GPS ou adresse disponible pour ce dossier.')
}

export default function VictimActions({ item, compact = false }) {
  const phone = getPhone(item)
  const email = getEmail(item)
  const cleanPhone = String(phone || '').replace(/\D/g, '')

  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <Action icon="call" label="Appeler" disabled={!phone} missing="Aucun telephone pour cette victime." onPress={() => Linking.openURL(`tel:${phone}`)} />
      <Action icon="chatbubble" label="SMS" disabled={!phone} missing="Aucun telephone pour envoyer un SMS." onPress={() => Linking.openURL(`sms:${phone}`)} />
      <Action icon="logo-whatsapp" label="WhatsApp" disabled={!cleanPhone} missing="Aucun numero WhatsApp disponible." onPress={() => Linking.openURL(`https://wa.me/${cleanPhone}`)} />
      <Action icon="mail" label="Email" disabled={!email} missing="Aucun email pour cette victime." onPress={() => Linking.openURL(`mailto:${email}`)} />
      <Action icon="navigate" label="Localiser" onPress={() => openVictimMap(item)} primary />
    </View>
  )
}

function Action({ icon, label, onPress, disabled, primary, missing }) {
  function handlePress() {
    if (disabled) {
      Alert.alert('Information manquante', missing || 'Cette action n est pas disponible pour ce dossier.')
      return
    }
    onPress()
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.action, primary && styles.primaryAction, disabled && styles.disabled]}
    >
      <Ionicons name={icon} size={18} color={primary ? '#fff' : COLORS.primaryDark} />
      <Text style={[styles.label, primary && styles.primaryLabel]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  compactRow: {
    marginTop: 4
  },
  action: {
    minHeight: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  primaryAction: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary
  },
  disabled: {
    opacity: 0.38
  },
  label: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '900'
  },
  primaryLabel: {
    color: '#fff'
  }
})
