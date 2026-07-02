import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { signIn } from '../../lib/useAuth'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import { color, font, radius, shared } from '../../constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Remplis l'e-mail et le mot de passe.")
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

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.feather}>🪶</Text>
            <Text style={styles.title}>Plume Relais</Text>
            <Text style={styles.subtitle}>Reprends le fil de l'histoire</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="toi@exemple.com"
                placeholderTextColor={color.faint}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={color.faint}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <Spinner size={22} dotColor={color.void} />
                : <Text style={styles.btnText}>Se connecter</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Créer un compte</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 32 },
  header: { alignItems: 'center', gap: 8 },
  feather: { fontSize: 40, marginBottom: 4 },
  title: { fontFamily: font.display, fontSize: 32, fontWeight: '600', color: color.ink, letterSpacing: 0.3 },
  subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 15, color: color.muted },
  card: {
    ...shared.card,
    padding: 20, gap: 16,
  },
  field: { gap: 8 },
  label: shared.label,
  input: shared.input,
  error: { fontSize: 13, color: color.danger },
  btn: { ...shared.btnPrimary, marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: shared.btnPrimaryText,
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 15, color: color.muted },
  footerLink: { fontSize: 15, color: color.ember, fontWeight: '600' },
})
