import React from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../../config/env'

const logo = require('../../../assets/logo.png')

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator color={COLORS.primary} size="large" />
      <Text style={styles.text}>Signal Moi charge votre espace...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.soft,
    gap: 18
  },
  logo: {
    width: 140,
    height: 92
  },
  text: {
    color: COLORS.muted,
    fontSize: 15
  }
})
