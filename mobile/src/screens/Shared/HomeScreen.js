import React, { useEffect, useState } from 'react'
import { ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native'
import { COLORS, resolveMediaUrl } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import { getSiteConfig } from '../../services/api'

const fallbackImages = [
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1200&q=70',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70'
]

export default function HomeScreen() {
  const [images, setImages] = useState(fallbackImages)

  useEffect(() => {
    getSiteConfig()
      .then((config) => {
        const configured = config?.home_page?.images || config?.homePage?.images || []
        const resolved = configured.map(resolveMediaUrl).filter(Boolean)
        if (resolved.length) setImages(resolved)
      })
      .catch(() => {})
  }, [])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Signal Moi" subtitle="Alerte, traitement et collaboration" />
      <ImageBackground source={{ uri: images[0] }} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.overlay}>
          <Text style={styles.heroTitle}>Signaler vite, agir mieux.</Text>
          <Text style={styles.heroText}>Citoyens, police, collaborateurs et admin travaillent sur les memes donnees Render.</Text>
        </View>
      </ImageBackground>
      <View style={styles.grid}>
        <Card title="Signalement" text="GPS, preuve, live et suivi citoyen." image={images[0]} />
        <Card title="Traitement police" text="Alertes, localisation et contact victime." image={images[1] || images[0]} />
        <Card title="Collaboration" text="Campagnes, plaidoyers, statistiques et signatures." image={images[2] || images[0]} />
      </View>
    </ScrollView>
  )
}

function Card({ title, text, image }) {
  return (
    <ImageBackground source={{ uri: image }} style={styles.card} imageStyle={styles.cardImage}>
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardText}>{text}</Text>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  content: { paddingBottom: 28 },
  hero: { margin: 20, height: 240, borderRadius: 24, overflow: 'hidden' },
  heroImage: { borderRadius: 24 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end', padding: 20 },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900' },
  heroText: { color: '#eefdf9', marginTop: 8, lineHeight: 22, fontWeight: '700' },
  grid: { paddingHorizontal: 20, gap: 12 },
  card: { height: 150, borderRadius: 20, overflow: 'hidden' },
  cardImage: { borderRadius: 20 },
  cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.34)', justifyContent: 'flex-end', padding: 16 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  cardText: { color: '#eefdf9', marginTop: 4 },
})
