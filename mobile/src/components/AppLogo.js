import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { COLORS, resolveMediaUrl } from '../config/env'
import { getSiteConfig } from '../services/api'

const localLogo = require('../../assets/logo.png')

export default function AppLogo({ size = 44 }) {
  const [logoUrl, setLogoUrl] = useState(null)

  useEffect(() => {
    let mounted = true
    getSiteConfig()
      .then((config) => {
        if (mounted && config?.logoUrl) setLogoUrl(resolveMediaUrl(config.logoUrl))
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Image
      source={logoUrl ? { uri: logoUrl } : localLogo}
      style={[styles.image, { width: size, height: size, borderRadius: size / 4 }]}
      resizeMode="contain"
    />
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8e6e2',
    shadowColor: '#10201d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3
  },
  fallback: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    color: '#fff',
    fontWeight: '900'
  }
})
