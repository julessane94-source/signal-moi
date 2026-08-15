import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../config/env'

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('[SignalMoiMobile]', error)
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Signal Moi n a pas pu demarrer</Text>
          <Text style={styles.text}>{String(this.state.error?.message || this.state.error)}</Text>
          <Text style={styles.hint}>Reinstallez l APK apres `npm install` et `eas build -p android --profile preview`.</Text>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fbfa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    color: COLORS.ink,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center'
  },
  text: {
    color: COLORS.danger,
    marginTop: 12,
    textAlign: 'center'
  },
  hint: {
    color: COLORS.muted,
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 22
  }
})
