import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import { color, font, radius, shared } from '../../constants/theme'

type Mode = 'full' | 'blind'
type Visibility = 'public' | 'private'

export default function CreateStoryScreen() {
  const { userId } = useAuth()

  const [title, setTitle] = useState('')
  const [opening, setOpening] = useState('')
  const [mode, setMode] = useState<Mode>('full')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [maxTurns, setMaxTurns] = useState(10)
  const [turnDuration, setTurnDuration] = useState(60)
  const [submitting, setSubmitting] = useState(false)

  function adjust(setter: (v: number) => void, value: number, delta: number, min: number, max: number) {
    setter(Math.min(max, Math.max(min, value + delta)))
  }

  async function handleCreate() {
    if (!title.trim() || !opening.trim()) {
      Alert.alert('Champs manquants', "Le titre et l'ouverture sont obligatoires.")
      return
    }
    if (!userId) {
      Alert.alert('Erreur', 'Tu dois être connecté pour créer une histoire.')
      return
    }

    setSubmitting(true)
    const { data, error } = await (supabase.from('stories') as any)
      .insert([{
        title: title.trim(),
        opening: opening.trim(),
        mode,
        max_turns: maxTurns,
        turn_duration: turnDuration,
        visibility,
        owner_id: userId,
      }])
      .select()
      .single()
    setSubmitting(false)

    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }

    setTitle('')
    setOpening('')
    setMode('full')
    setVisibility('public')
    setMaxTurns(10)
    setTurnDuration(60)

    router.replace(`/story/${data.id}` as any)
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.feather}>🪶</Text>
            <Text style={styles.title}>Nouvelle histoire</Text>
            <Text style={styles.subtitle}>Pose la première pierre du récit</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Titre</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Le nom de ton histoire"
                placeholderTextColor={color.faint}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ouverture</Text>
              <TextInput
                style={styles.editor}
                value={opening}
                onChangeText={setOpening}
                placeholder="Écris le tout premier paragraphe..."
                placeholderTextColor={color.faint}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mode</Text>
              <View style={styles.segmented}>
                <TouchableOpacity
                  style={[styles.segment, mode === 'full' && styles.segmentActive]}
                  onPress={() => setMode('full')}
                >
                  <Text style={[styles.segmentText, mode === 'full' && styles.segmentTextActive]}>👁 Tout voir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, mode === 'blind' && styles.segmentActive]}
                  onPress={() => setMode('blind')}
                >
                  <Text style={[styles.segmentText, mode === 'blind' && styles.segmentTextActive]}>🙈 Aveugle</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Visibilité</Text>
              <View style={styles.segmented}>
                <TouchableOpacity
                  style={[styles.segment, visibility === 'public' && styles.segmentActive]}
                  onPress={() => setVisibility('public')}
                >
                  <Text style={[styles.segmentText, visibility === 'public' && styles.segmentTextActive]}>Publique</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, visibility === 'private' && styles.segmentActive]}
                  onPress={() => setVisibility('private')}
                >
                  <Text style={[styles.segmentText, visibility === 'private' && styles.segmentTextActive]}>Privée</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.rowItem]}>
                <Text style={styles.label}>Tours max</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjust(setMaxTurns, maxTurns, -1, 2, 50)}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{maxTurns}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjust(setMaxTurns, maxTurns, 1, 2, 50)}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.field, styles.rowItem]}>
                <Text style={styles.label}>Durée / tour (min)</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjust(setTurnDuration, turnDuration, -15, 5, 1440)}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{turnDuration}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => adjust(setTurnDuration, turnDuration, 15, 5, 1440)}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, submitting && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting
                ? <Spinner size={22} dotColor={color.void} />
                : <Text style={styles.btnText}>Lancer l'histoire 🪶</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flexGrow: 1, padding: 24, paddingBottom: 48, gap: 28 },
  header: { alignItems: 'center', gap: 8, paddingTop: 12 },
  feather: { fontSize: 36 },
  title: { fontFamily: font.display, fontSize: 26, fontWeight: '600', color: color.ink },
  subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 14, color: color.muted },

  card: { ...shared.card, padding: 20, gap: 18 },
  field: { gap: 8 },
  label: shared.label,
  input: shared.input,
  editor: {
    borderWidth: 1, borderColor: color.border, borderRadius: radius.md,
    padding: 16, fontSize: 16, color: color.ink,
    backgroundColor: color.surface, minHeight: 130,
  },

  segmented: {
    flexDirection: 'row', borderWidth: 1, borderColor: color.border,
    borderRadius: radius.md, overflow: 'hidden',
  },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: color.surface },
  segmentActive: { backgroundColor: color.emberDim },
  segmentText: { fontSize: 13, color: color.muted, fontWeight: '500' },
  segmentTextActive: { color: color.ember, fontWeight: '700' },

  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  stepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: color.border, borderRadius: radius.md,
    paddingHorizontal: 4, height: 52,
  },
  stepperBtn: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 20, color: color.ember, fontWeight: '600' },
  stepperValue: { fontSize: 16, color: color.ink, fontWeight: '600' },

  btn: shared.btnPrimary,
  btnDisabled: { opacity: 0.6 },
  btnText: shared.btnPrimaryText,
})