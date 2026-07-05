import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Platform,
  KeyboardAvoidingView, Image,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { uploadImageToStorage, resolveExtension } from '../../lib/uploadImage'
import { useAuth } from '../../lib/useAuth'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { font, radius, ColorTokens } from '../../constants/theme'

const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo

type Mode = 'full' | 'blind'
type Visibility = 'public' | 'private'

export default function CreateStoryScreen() {
  const { color, shared } = useTheme()
  const { t } = useLanguage()
  const { userId } = useAuth()

  const [title, setTitle] = useState('')
  const [opening, setOpening] = useState('')
  const [mode, setMode] = useState<Mode>('full')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [maxTurns, setMaxTurns] = useState(10)
  const [turnDuration, setTurnDuration] = useState(60)
  const [submitting, setSubmitting] = useState(false)

  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)

  function adjust(setter: (v: number) => void, value: number, delta: number, min: number, max: number) {
    setter(Math.min(max, Math.max(min, value + delta)))
  }

  async function pickCover() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    })
    if (result.canceled || !result.assets?.[0]?.uri || !userId) return

    setUploadingCover(true)
    try {
      const asset = result.assets[0]
      const uri = asset.uri
      const ext = resolveExtension(uri, asset.mimeType)
      const path = `${userId}/${Date.now()}.${ext}`
      const contentType = asset.mimeType || (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`)

      const { error: uploadError, tooLarge } = await uploadImageToStorage({
        bucket: 'covers',
        path,
        uri,
        mimeType: contentType,
        maxSizeBytes: MAX_COVER_SIZE_BYTES,
      })

      if (tooLarge) {
        Alert.alert(t.common.error, t.profileEdit.avatarTooLarge ?? t.common.error)
        return
      }
      if (uploadError) {
        Alert.alert(t.common.error, uploadError)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('covers').getPublicUrl(path)
      setCoverUrl(`${publicUrlData.publicUrl}?t=${Date.now()}`)
    } catch {
      Alert.alert(t.common.error, t.create.coverUploadFailed)
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleCreate() {
    if (!title.trim() || !opening.trim()) {
      Alert.alert(t.create.missingFieldsTitle, t.create.missingFieldsBody)
      return
    }
    if (!userId) {
      Alert.alert(t.common.error, t.create.notAuthBody)
      return
    }

    setSubmitting(true)
    const { data, error } = await supabase
      .from('stories')
      .insert([{
        title: title.trim(),
        opening: opening.trim(),
        mode,
        max_turns: maxTurns,
        turn_duration: turnDuration,
        visibility,
        owner_id: userId,
        cover_url: coverUrl,
      }])
      .select()
      .single()
    setSubmitting(false)

    if (error) {
      Alert.alert(t.common.error, error.message)
      return
    }

    setTitle('')
    setOpening('')
    setMode('full')
    setVisibility('public')
    setMaxTurns(10)
    setTurnDuration(60)
    setCoverUrl(null)

    router.replace(`/story/${data.id}` as any)
  }

  const styles = makeStyles(color)

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.feather}>🪶</Text>
            <Text style={styles.title}>{t.create.title}</Text>
            <Text style={styles.subtitle}>{t.create.subtitle}</Text>
          </View>

          <View style={[shared.card, styles.card]}>
            <View style={styles.field}>
              <Text style={shared.label}>{t.create.coverLabel}</Text>
              <TouchableOpacity
                style={styles.coverPicker}
                onPress={pickCover}
                disabled={uploadingCover}
                accessibilityRole="button"
                accessibilityLabel={coverUrl ? t.create.changeCover : t.create.addCover}
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={styles.coverImg} resizeMode="cover" />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Text style={styles.coverPlaceholderIcon}>🖼️</Text>
                    <Text style={styles.coverPlaceholderText}>{t.create.addCover}</Text>
                  </View>
                )}
                {uploadingCover && (
                  <View style={styles.coverOverlay}>
                    <Spinner size={26} dotColor={color.ink} />
                  </View>
                )}
                {!!coverUrl && !uploadingCover && (
                  <View style={styles.coverChangeBadge}>
                    <Text style={styles.coverChangeBadgeText}>{t.create.changeCover}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={shared.label}>{t.create.titleLabel}</Text>
              <TextInput
                style={shared.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t.create.titlePlaceholder}
                placeholderTextColor={color.faint}
              />
            </View>

            <View style={styles.field}>
              <Text style={shared.label}>{t.create.openingLabel}</Text>
              <TextInput
                style={styles.editor}
                value={opening}
                onChangeText={setOpening}
                placeholder={t.create.openingPlaceholder}
                placeholderTextColor={color.faint}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <Text style={shared.label}>{t.create.modeLabel}</Text>
              <View style={styles.segmented}>
                <TouchableOpacity
                  style={[styles.segment, mode === 'full' && styles.segmentActive]}
                  onPress={() => setMode('full')}
                >
                  <Text style={[styles.segmentText, mode === 'full' && styles.segmentTextActive]}>{t.create.modeFull}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, mode === 'blind' && styles.segmentActive]}
                  onPress={() => setMode('blind')}
                >
                  <Text style={[styles.segmentText, mode === 'blind' && styles.segmentTextActive]}>{t.create.modeBlind}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={shared.label}>{t.create.visibilityLabel}</Text>
              <View style={styles.segmented}>
                <TouchableOpacity
                  style={[styles.segment, visibility === 'public' && styles.segmentActive]}
                  onPress={() => setVisibility('public')}
                >
                  <Text style={[styles.segmentText, visibility === 'public' && styles.segmentTextActive]}>{t.create.visibilityPublic}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, visibility === 'private' && styles.segmentActive]}
                  onPress={() => setVisibility('private')}
                >
                  <Text style={[styles.segmentText, visibility === 'private' && styles.segmentTextActive]}>{t.create.visibilityPrivate}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.rowItem]}>
                <Text style={shared.label}>{t.create.maxTurns}</Text>
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
                <Text style={shared.label}>{t.create.turnDuration}</Text>
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
              style={[shared.btnPrimary, submitting && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting
                ? <Spinner size={22} dotColor={color.void} />
                : <Text style={shared.btnPrimaryText}>{t.create.submit}</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function makeStyles(color: ColorTokens) {
  return StyleSheet.create({
    root: { flex: 1 },
    inner: { flexGrow: 1, padding: 24, paddingBottom: 48, gap: 28 },
    header: { alignItems: 'center', gap: 8, paddingTop: 12 },
    feather: { fontSize: 36 },
    title: { fontFamily: font.display, fontSize: 26, fontWeight: '600', color: color.ink },
    subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 14, color: color.muted },

    card: { padding: 20, gap: 18 },
    field: { gap: 8 },

    coverPicker: {
      width: '100%', aspectRatio: 3 / 4, maxHeight: 220,
      borderRadius: radius.md, overflow: 'hidden',
    },
    coverImg: { width: '100%', height: '100%' },
    coverPlaceholder: {
      flex: 1, borderWidth: 1, borderColor: color.border, borderStyle: 'dashed',
      borderRadius: radius.md, backgroundColor: color.surface,
      alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    coverPlaceholderIcon: { fontSize: 28 },
    coverPlaceholderText: { fontSize: 14, color: color.muted, fontWeight: '500' },
    coverOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center', justifyContent: 'center',
    },
    coverChangeBadge: {
      position: 'absolute', bottom: 8, right: 8,
      backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    coverChangeBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

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

    btnDisabled: { opacity: 0.6 },
  })
}