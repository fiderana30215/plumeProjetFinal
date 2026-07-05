import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image,
  Platform, KeyboardAvoidingView,
} from 'react-native'
// NB: Alert.alert(title, message, buttons) n'est pas interactif sur
// react-native-web — les callbacks des boutons ne sont jamais déclenchés.
// confirmAsync() bascule sur window.confirm sur le web, Alert.alert natif ailleurs.
function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false)
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ])
  })
}
import { useState, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { uploadImageToStorage, resolveExtension } from '../lib/uploadImage'
import { useAuth, signOut } from '../lib/useAuth'
import Screen from '../components/Screen'
import Spinner from '../components/Spinner'
import type { UserRow } from '../types/database'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { translations, Language } from '../contexts/translations'
import { font, radius, ColorTokens } from '../constants/theme'

const MIN_PASSWORD_LENGTH = 8
const MAX_PSEUDO_LENGTH = 24
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024 // 5 Mo

export default function ProfileEditScreen() {
  const { color, shared, mode, toggleTheme } = useTheme()
  const { t, lang, setLang } = useLanguage()
  const { userId } = useAuth()

  const [profile, setProfile] = useState<UserRow | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [pseudo, setPseudo] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const loadProfile = useCallback(async () => {
    if (!userId) return
    setLoadingProfile(true)
    setLoadError('')

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      setLoadError(error.message)
    } else if (data) {
      setProfile(data)
      setPseudo(data.pseudo ?? '')
      setAvatarUri(data.avatar_url ?? null)
    }
    setLoadingProfile(false)
  }, [userId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(t.common.error, t.profileEdit.permissionDenied ?? t.common.error)
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled || !result.assets?.[0]?.uri || !userId) return

    setUploadingAvatar(true)
    try {
      const asset = result.assets[0]
      const uri = asset.uri
      const ext = resolveExtension(uri, asset.mimeType)
      const path = `${userId}/avatar.${ext}`
      const contentType = asset.mimeType || (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`)

      const { error: uploadError, tooLarge } = await uploadImageToStorage({
        bucket: 'avatars',
        path,
        uri,
        mimeType: contentType,
        maxSizeBytes: MAX_AVATAR_SIZE_BYTES,
      })

      if (tooLarge) {
        Alert.alert(t.common.error, t.profileEdit.avatarTooLarge ?? t.common.error)
        return
      }
      if (uploadError) {
        Alert.alert(t.common.error, uploadError)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        Alert.alert(t.common.error, updateError.message)
        return
      }

      setAvatarUri(publicUrl)
    } catch {
      Alert.alert(t.common.error, t.profileEdit.avatarUploadFailed ?? t.common.error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const pseudoTrimmed = pseudo.trim()
  const pseudoUnchanged = pseudoTrimmed === (profile?.pseudo ?? '')
  const pseudoValid = pseudoTrimmed.length > 0 && pseudoTrimmed.length <= MAX_PSEUDO_LENGTH

  async function handleSaveProfile() {
    if (!userId || !pseudoValid || pseudoUnchanged) return
    setProfileError('')
    setSavingProfile(true)

    const { error } = await supabase
      .from('users')
      .update({ pseudo: pseudoTrimmed })
      .eq('id', userId)

    setSavingProfile(false)

    if (error) {
      setProfileError(error.message)
      return
    }
    setProfile((prev) => prev ? { ...prev, pseudo: pseudoTrimmed } : prev)
    Alert.alert(t.profileEdit.profileSaved)
  }

  async function handleChangePassword() {
    setPasswordError('')
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t.auth.passwordTooShort)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t.auth.passwordMismatch)
      return
    }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordError(error.message)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    Alert.alert(t.profileEdit.passwordChanged)
  }

  async function handleSignOut() {
    const confirmed = await confirmAsync(t.profile.signOutConfirmTitle, t.profile.signOutConfirmBody)
    if (!confirmed) return
    await signOut()
    router.replace('/(auth)/login')
  }

  const styles = makeStyles(color)
  const languages: { key: Language, label: string }[] = [
    { key: 'fr', label: translations.fr.profileEdit.french },
    { key: 'en', label: translations.en.profileEdit.english },
    { key: 'mg', label: translations.mg.profileEdit.malagasy },
  ]

  if (loadingProfile) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Spinner size={28} dotColor={color.ember} />
        </View>
      </Screen>
    )
  }

  if (loadError) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.error}>{loadError}</Text>
          <TouchableOpacity style={[shared.btnPrimary, styles.retryBtn]} onPress={loadProfile}>
            <Text style={shared.btnPrimaryText}>{t.common.retry ?? t.profileEdit.saveProfile}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.back}>{t.common.back}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t.profileEdit.title}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={pickAvatar}
              disabled={uploadingAvatar}
              style={styles.avatarWrap}
              accessibilityRole="button"
              accessibilityLabel={t.profileEdit.changeAvatar}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {pseudo?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <Spinner size={28} dotColor={color.ink} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar} hitSlop={8}>
              <Text style={styles.avatarChangeText}>{t.profileEdit.changeAvatar}</Text>
            </TouchableOpacity>
          </View>

          {/* Pseudo */}
          <View style={[shared.card, styles.card]}>
            <View style={styles.labelRow}>
              <Text style={shared.label}>{t.profileEdit.pseudoLabel}</Text>
              <Text style={styles.counter}>{pseudoTrimmed.length}/{MAX_PSEUDO_LENGTH}</Text>
            </View>
            <TextInput
              style={shared.input}
              value={pseudo}
              onChangeText={setPseudo}
              maxLength={MAX_PSEUDO_LENGTH}
              placeholderTextColor={color.faint}
              autoCapitalize="none"
            />
            {!!profileError && <Text style={styles.error}>{profileError}</Text>}
            <TouchableOpacity
              style={[
                shared.btnPrimary,
                (savingProfile || pseudoUnchanged || !pseudoValid) && styles.btnDisabled,
              ]}
              onPress={handleSaveProfile}
              disabled={savingProfile || pseudoUnchanged || !pseudoValid}
            >
              {savingProfile
                ? <Spinner size={20} dotColor={color.void} />
                : <Text style={shared.btnPrimaryText}>{t.profileEdit.saveProfile}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Mot de passe */}
          <View style={[shared.card, styles.card]}>
            <Text style={styles.sectionTitle}>{t.profileEdit.passwordSection}</Text>
            <View style={styles.field}>
              <Text style={shared.label}>{t.profileEdit.newPassword}</Text>
              <TextInput
                style={shared.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder={t.auth.passwordPlaceholderMin}
                placeholderTextColor={color.faint}
              />
            </View>
            <View style={styles.field}>
              <Text style={shared.label}>{t.profileEdit.confirmNewPassword}</Text>
              <TextInput
                style={shared.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={color.faint}
              />
            </View>
            {!!passwordError && <Text style={styles.error}>{passwordError}</Text>}
            <TouchableOpacity
              style={[shared.btnPrimary, savingPassword && styles.btnDisabled]}
              onPress={handleChangePassword}
              disabled={savingPassword}
            >
              {savingPassword
                ? <Spinner size={20} dotColor={color.void} />
                : <Text style={shared.btnPrimaryText}>{t.profileEdit.changePassword}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Apparence */}
          <View style={[shared.card, styles.card]}>
            <Text style={styles.sectionTitle}>{t.profileEdit.appearanceSection}</Text>
            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segment, mode === 'dark' && styles.segmentActive]}
                onPress={() => mode !== 'dark' && toggleTheme()}
                accessibilityRole="button"
              >
                <Ionicons
                  name="moon"
                  size={16}
                  color={mode === 'dark' ? color.ember : color.muted}
                  style={styles.segmentIcon}
                />
                <Text style={[styles.segmentText, mode === 'dark' && styles.segmentTextActive]}>
                  {t.profileEdit.dark}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, mode === 'light' && styles.segmentActive]}
                onPress={() => mode !== 'light' && toggleTheme()}
                accessibilityRole="button"
              >
                <Ionicons
                  name="sunny"
                  size={16}
                  color={mode === 'light' ? color.ember : color.muted}
                  style={styles.segmentIcon}
                />
                <Text style={[styles.segmentText, mode === 'light' && styles.segmentTextActive]}>
                  {t.profileEdit.light}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Langue */}
          <View style={[shared.card, styles.card]}>
            <Text style={styles.sectionTitle}>{t.profileEdit.languageSection}</Text>
            <View style={styles.langList}>
              {languages.map((l) => (
                <TouchableOpacity
                  key={l.key}
                  style={[styles.langRow, lang === l.key && styles.langRowActive]}
                  onPress={() => setLang(l.key)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.langText, lang === l.key && styles.langTextActive]}>{l.label}</Text>
                  {lang === l.key && <Ionicons name="checkmark" size={18} color={color.ember} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Déconnexion */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={18} color={color.danger} style={styles.signOutIcon} />
            <Text style={styles.signOutText}>{t.profile.signOut}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function makeStyles(color: ColorTokens) {
  return StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
    retryBtn: { paddingHorizontal: 32 },
    header: {
      paddingTop: 56, paddingHorizontal: 24, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: color.border, gap: 4,
    },
    back: { fontSize: 15, color: color.ember, fontWeight: '500', marginBottom: 4 },
    title: { fontFamily: font.display, fontSize: 22, fontWeight: '600', color: color.ink },

    inner: { padding: 24, gap: 16, paddingBottom: 48 },

    avatarSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
    avatarWrap: { width: 96, height: 96 },
    avatarImg: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: color.emberBorder },
    avatarPlaceholder: {
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: color.emberDim, borderWidth: 1, borderColor: color.emberBorder,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarPlaceholderText: { fontSize: 38, color: color.ember, fontFamily: font.display, fontWeight: '600' },
    avatarOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center', alignItems: 'center',
    },
    avatarChangeText: { fontSize: 14, color: color.ember, fontWeight: '600' },

    card: { padding: 20, gap: 14 },
    field: { gap: 8 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    counter: { fontSize: 12, color: color.faint },
    sectionTitle: { fontFamily: font.display, fontSize: 17, fontWeight: '600', color: color.ink },
    error: { fontSize: 13, color: color.danger },
    btnDisabled: { opacity: 0.6 },

    segmented: {
      flexDirection: 'row', borderWidth: 1, borderColor: color.border,
      borderRadius: radius.md, overflow: 'hidden',
    },
    segment: {
      flex: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', backgroundColor: color.surface, gap: 6,
    },
    segmentActive: { backgroundColor: color.emberDim },
    segmentIcon: { marginTop: -1 },
    segmentText: { fontSize: 14, color: color.muted, fontWeight: '500' },
    segmentTextActive: { color: color.ember, fontWeight: '700' },

    langList: { gap: 4 },
    langRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.sm,
    },
    langRowActive: { backgroundColor: color.emberDim },
    langText: { fontSize: 15, color: color.muted },
    langTextActive: { color: color.ink, fontWeight: '600' },

    signOutBtn: {
      marginTop: 4, height: 48, borderRadius: radius.md,
      borderWidth: 1, borderColor: color.dangerDim,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    signOutIcon: { marginTop: -1 },
    signOutText: { color: color.danger, fontSize: 15, fontWeight: '600' },
  })
}