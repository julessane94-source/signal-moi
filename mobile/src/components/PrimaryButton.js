import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../config/env'

export default function PrimaryButton({ title, onPress, loading, disabled, tone = 'primary', style, icon }) {
  const backgroundColor = tone === 'danger' ? COLORS.danger : tone === 'police' ? COLORS.police : COLORS.primary

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed || loading || disabled ? 0.78 : 1 },
        style
      ]}
    >
        {loading ? <ActivityIndicator color="#fff" /> : <View style={styles.content}>{icon ? <Ionicons name={icon} size={18} color="#fff" /> : null}<Text style={styles.text}>{title}</Text></View>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900'
  }
})
