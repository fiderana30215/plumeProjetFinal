import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Alert, ScrollView, Image,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { signUp } from '../../lib/useAuth'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { font } from '../../constants/theme'

export default function RegisterScreen() {
  const { color, shared } = useTheme()
  const { t } = useLanguage()
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
    if (!pseudo.trim() || !email.trim() || !password || !confirm) {
      setError(t.auth.missingFieldsRegister)
      return
    }
    if (password.length < 8) {
      setError(t.auth.passwordTooShort)
      return
    }
    if (password !== confirm) {
      setError(t.auth.passwordMismatch)
      return
    }
    setError('')
    setLoading(true)
    const { error } = await signUp(email.trim().toLowerCase(), password, pseudo.trim())
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    Alert.alert(t.auth.accountCreatedTitle, t.auth.accountCreatedBody, [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') }
    ])
  }

  const styles = makeStyles(color)

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="cover" />
            <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>
          </View>

          <View style={[shared.card, styles.card]}>
            {[
              { label: t.auth.pseudo, value: pseudo, setter: setPseudo, placeholder: t.auth.pseudoPlaceholder, secure: false },
              { label: t.auth.email, value: email, setter: setEmail, placeholder: t.auth.emailPlaceholder, secure: false },
              { label: t.auth.password, value: password, setter: setPassword, placeholder: t.auth.passwordPlaceholderMin, secure: true },
              { label: t.auth.confirmPassword, value: confirm, setter: setConfirm, placeholder: t.auth.confirmPasswordPlaceholder, secure: true },
            ].map(({ label, value, setter, placeholder, secure }) => (
              <View key={label} style={styles.field}>
                <Text style={shared.label}>{label}</Text>
                <TextInput
                  style={shared.input}
                  value={value}
                  onChangeText={setter}
                  placeholder={placeholder}
                  placeholderTextColor={color.faint}
                  secureTextEntry={secure}
                  autoCapitalize="none"
                />
              </View>
            ))}

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[shared.btnPrimary, styles.btnMargin, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <Spinner size={22} dotColor={color.void} />
                : <Text style={shared.btnPrimaryText}>{t.auth.signUp}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.auth.haveAccount}</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>{t.auth.signIn}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function makeStyles(color: any) {
  return StyleSheet.create({
    root: { flex: 1 },
    inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 28 },
    header: { alignItems: 'center', gap: 8,marginTop: -50 },
    logo: {
      width: 350, height: 300, borderRadius: 0,
      marginBottom: 8, borderWidth: 0, borderColor: color.emberBorder,
    },
    subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 15, color: color.muted },
    card: { padding: 20, gap: 14 },
    field: { gap: 8 },
    error: { fontSize: 13, color: color.danger },
    btnMargin: { marginTop: 4 },
    btnDisabled: { opacity: 0.6 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 15, color: color.muted },
    footerLink: { fontSize: 15, color: color.ember, fontWeight: '600' },
  })
}