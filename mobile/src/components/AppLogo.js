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
    backgroundColor: '#fff'
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
