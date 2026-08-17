import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { COLORS } from '../config/env'

export default function PrimaryButton({ title, onPress, loading, disabled, tone = 'primary', style }) {
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
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800'
  }
})
