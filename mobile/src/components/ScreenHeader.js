import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../config/env'
import AppLogo from './AppLogo'

export default function ScreenHeader({ title, subtitle, right }) {
  return (
    <View style={styles.header}>
      <AppLogo />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: 'rgba(247, 251, 250, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 231, 227, 0.75)'
  },
  textWrap: {
    flex: 1
  },
  title: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  subtitle: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18
  }
})
