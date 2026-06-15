import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'

type Mode = 'full' | 'blind'
type Visibility = 'public' | 'private'

export default function CreateStoryScreen() {
  const { userId } = useAuth()
  const [title, setTitle] = useState('')
  const [opening, setOpening] = useState('')
  const [mode, setMode] = useState<Mode>('full')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [maxTurns, setMaxTurns] = useState('10')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!title.trim() || !opening.trim()) {
      Alert.alert('Champs manquants', 'Le titre et le paragraphe d\'ouverture sont obligatoires.')
      return
    }
    if (!userId) {
      Alert.alert('Erreur', 'Tu dois être connecté.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('stories').insert([{
      title: title.trim(),
      opening: opening.trim(),
      mode,
      visibility,
      max_turns: parseInt(maxTurns) || 10,
      turn_duration: 60,
      owner_id: userId,
    }] as any)
    setLoading(false)

    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }

    Alert.alert('Histoire créée ! 🪶', 'Ton histoire est maintenant disponible.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)/feed') }
    ])
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

      <Text style={styles.pageTitle}>Nouvelle histoire</Text>

      {/* Titre */}
      <View style={styles.field}>
        <Text style={styles.label}>Titre</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Le titre de ton histoire..."
          placeholderTextColor="#9B8EA8"
          maxLength={80}
        />
      </View>

      {/* Paragraphe d'ouverture */}
      <View style={styles.field}>
        <Text style={styles.label}>Paragraphe d'ouverture</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={opening}
          onChangeText={setOpening}
          placeholder="Il était une fois..."
          placeholderTextColor="#9B8EA8"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* Mode */}
      <View style={styles.field}>
        <Text style={styles.label}>Mode</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'full' && styles.toggleActive]}
            onPress={() => setMode('full')}
          >
            <Text style={[styles.toggleText, mode === 'full' && styles.toggleTextActive]}>
              👁 Tout voir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'blind' && styles.toggleActive]}
            onPress={() => setMode('blind')}
          >
            <Text style={[styles.toggleText, mode === 'blind' && styles.toggleTextActive]}>
              🙈 À l'aveugle
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {mode === 'blind'
            ? 'Chaque auteur ne voit que le dernier paragraphe.'
            : 'Tout le monde voit l\'histoire complète.'}
        </Text>
      </View>

      {/* Visibilité */}
      <View style={styles.field}>
        <Text style={styles.label}>Visibilité</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, visibility === 'public' && styles.toggleActive]}
            onPress={() => setVisibility('public')}
          >
            <Text style={[styles.toggleText, visibility === 'public' && styles.toggleTextActive]}>
              🌍 Publique
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, visibility === 'private' && styles.toggleActive]}
            onPress={() => setVisibility('private')}
          >
            <Text style={[styles.toggleText, visibility === 'private' && styles.toggleTextActive]}>
              🔒 Privée
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Nombre de tours */}
      <View style={styles.field}>
        <Text style={styles.label}>Nombre de tours max</Text>
        <TextInput
          style={[styles.input, styles.inputSmall]}
          value={maxTurns}
          onChangeText={setMaxTurns}
          keyboardType="number-pad"
          maxLength={3}
        />
      </View>

      {/* Bouton créer */}
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFF8F0" />
          : <Text style={styles.btnText}>Créer l'histoire 🪶</Text>
        }
      </TouchableOpacity>

    </ScrollView>
  )
}

const INK    = '#1C1420'
const VIOLET = '#6B3FA0'
const CREAM  = '#FFF8F0'
const MUTED  = '#7A6B85'
const BORDER = '#DDD0E8'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  inner: { padding: 24, gap: 20, paddingBottom: 48 },
  pageTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 26, fontWeight: '600', color: INK, marginBottom: 8,
  },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: INK, backgroundColor: '#FFFFFF' },
  inputSmall: { width: 80 },
  textarea: { minHeight: 120, paddingTop: 12 },
  toggle: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', backgroundColor: '#FFFFFF' },
  toggleActive: { backgroundColor: VIOLET, borderColor: VIOLET },
  toggleText: { fontSize: 14, color: MUTED, fontWeight: '500' },
  toggleTextActive: { color: CREAM },
  hint: { fontSize: 12, color: MUTED, fontStyle: 'italic' },
  btn: { height: 52, backgroundColor: VIOLET, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: CREAM, fontSize: 16, fontWeight: '600' },
})