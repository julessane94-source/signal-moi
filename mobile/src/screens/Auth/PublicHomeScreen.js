import React from 'react'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config/env'
import AppLogo from '../../components/AppLogo'
import PrimaryButton from '../../components/PrimaryButton'

const heroImage = require('../../../assets/home-hero.png')

const roleCards = [
  { title: 'Citoyens', text: 'Signaler vite avec GPS, photo ou live.', icon: 'megaphone', color: COLORS.primary },
  { title: 'Police', text: 'Recevoir, localiser et intervenir.', icon: 'shield-checkmark', color: COLORS.police },
  { title: 'Collaborateurs', text: 'Suivre les dossiers et campagnes.', icon: 'people', color: '#7c3aed' },
  { title: 'Admin', text: 'Piloter les chiffres et les utilisateurs.', icon: 'stats-chart', color: COLORS.primaryDark }
]

export default function PublicHomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ImageBackground source={heroImage} resizeMode="contain" style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.overlay}>
          <View style={styles.brandRow}>
            <AppLogo size={58} />
            <View style={styles.brandTextBox}>
              <Text style={styles.brandName}>Signal-Moi</Text>
              <Text style={styles.brandSub}>Innovation & Citoyennete</Text>
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.title}>Alerter. Localiser. Intervenir.</Text>
            <Text style={styles.subtitle}>
              Une plateforme citoyenne pour transmettre les urgences aux bonnes equipes, avec position GPS et suivi.
            </Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.actions}>
        <PrimaryButton title="Se connecter" onPress={() => navigation.navigate('Login')} />
        <Pressable style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
          <Ionicons name="person-add" size={20} color={COLORS.primary} />
          <Text style={styles.registerText}>Creer un compte citoyen</Text>
        </Pressable>
      </View>

      <View style={styles.quickGrid}>
        {roleCards.map((item) => (
          <View key={item.title} style={styles.roleCard}>
            <View style={[styles.roleIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={22} color="#fff" />
            </View>
            <Text style={styles.roleTitle}>{item.title}</Text>
            <Text style={styles.roleText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footerBand}>
        <Ionicons name="location" size={22} color={COLORS.accent} />
        <Text style={styles.footerText}>Service oriente terrain pour Sedhiou et les zones couvertes.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fbfa'
  },
  content: {
    paddingBottom: 28
  },
  hero: {
    minHeight: 430,
    margin: 16,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#fff'
  },
  heroImage: {
    opacity: 1
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 22,
    backgroundColor: 'rgba(8, 31, 27, 0.08)'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  brandTextBox: {
    flex: 1
  },
  brandName: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900'
  },
  brandSub: {
    color: '#d6fffb',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  heroCopy: {
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 31, 27, 0.72)'
  },
  title: {
    color: '#fff',
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '900'
  },
  subtitle: {
    color: '#effffb',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700'
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12
  },
  registerButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10
  },
  registerText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 16
  },
  quickGrid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  roleCard: {
    width: '48%',
    minHeight: 150,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 8
  },
  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleTitle: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  roleText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  footerBand: {
    marginHorizontal: 20,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  footerText: {
    flex: 1,
    color: '#fff',
    fontWeight: '800',
    lineHeight: 20
  }
})
