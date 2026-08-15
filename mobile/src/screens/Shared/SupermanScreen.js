import React, { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { COLORS } from '../../config/env'
import ScreenHeader from '../../components/ScreenHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { getSupermanReply } from '../../services/superman'

const quick = [
  'Je veux signaler',
  'Comment participer a une campagne ?',
  'Comment marche le live police ?',
  'Comment telecharger les statistiques ?',
  'Comment payer avec Wave ?'
]

export default function SupermanScreen() {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Bonjour. Je suis SUPERMAN, assistant Signal Moi. Posez votre question avec des mots simples.' }
  ])
  const [input, setInput] = useState('')

  function send(text = input) {
    if (!text.trim()) return
    const reply = getSupermanReply(text)
    setMessages((current) => [...current, { from: 'user', text }, { from: 'bot', text: reply }])
    setInput('')
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="SUPERMAN" subtitle="Assistant Signal Moi" />
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>S</Text>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.bubbleText, item.from === 'user' && styles.userText]}>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.quickRow}>
        {quick.slice(0, 3).map((item) => (
          <Pressable key={item} onPress={() => send(item)} style={styles.quick}>
            <Text style={styles.quickText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput value={input} onChangeText={setInput} placeholder="Votre question..." style={styles.input} />
        <PrimaryButton title="Envoyer" onPress={() => send()} style={styles.sendButton} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fbfa' },
  avatar: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1d4ed8',
    borderWidth: 5,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '900' },
  messages: { padding: 20, gap: 10 },
  bubble: { maxWidth: '84%', borderRadius: 18, padding: 14 },
  botBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignSelf: 'flex-start' },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end' },
  bubbleText: { color: COLORS.ink, lineHeight: 21 },
  userText: { color: '#fff', fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 8 },
  quick: { flex: 1, backgroundColor: COLORS.soft, borderRadius: 12, padding: 8 },
  quickText: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '800' },
  inputRow: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.border },
  input: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: '#f2f6f5', paddingHorizontal: 14 },
  sendButton: { minHeight: 48, paddingHorizontal: 12 }
})
