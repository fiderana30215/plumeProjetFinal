import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Image,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { signIn } from '../../lib/useAuth'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { font, radius } from '../../constants/theme'

export default function LoginScreen() {
  const { color, shared } = useTheme()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError(t.auth.missingFieldsLogin)
      return
    }
    setError('')
    setLoading(true)
    const { error } = await signIn(email.trim().toLowerCase(), password)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    router.replace('/(tabs)/feed')
  }

  const styles = makeStyles(color)

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="cover" />
            <Text style={styles.subtitle}>{t.auth.loginSubtitle}</Text>
          </View>

          <View style={[shared.card, styles.card]}>
            <View style={styles.field}>
              <Text style={shared.label}>{t.auth.email}</Text>
              <TextInput
                style={shared.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.emailPlaceholder}
                placeholderTextColor={color.faint}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={shared.label}>{t.auth.password}</Text>
              <TextInput
                style={shared.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.passwordPlaceholder}
                placeholderTextColor={color.faint}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[shared.btnPrimary, styles.btnMargin, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <Spinner size={22} dotColor={color.void} />
                : <Text style={shared.btnPrimaryText}>{t.auth.signIn}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.auth.noAccount}</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>{t.auth.createAccount}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function makeStyles(color: any) {
  return StyleSheet.create({
    root: { flex: 1 },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 32 },
    header: { alignItems: 'center', gap: 8 ,marginTop: -30},
    logo: {
      width: 300, height: 260, borderRadius: 0,
      marginBottom: 8, borderWidth: 0, borderColor: color.emberBorder,
    },
    subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 15, color: color.muted },
    card: { padding: 20, gap: 16 },
    field: { gap: 8 },
    error: { fontSize: 13, color: color.danger },
    btnMargin: { marginTop: 4 },
    btnDisabled: { opacity: 0.6 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 15, color: color.muted },
    footerLink: { fontSize: 15, color: color.ember, fontWeight: '600' },
  })
}