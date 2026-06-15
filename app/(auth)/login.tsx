import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { signIn } from '../../lib/useAuth'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Champs manquants', 'Remplis l\'e-mail et le mot de passe.')
      return
    }
    setLoading(true)
    const { error } = await signIn(email.trim().toLowerCase(), password)
    setLoading(false)
    if (error) {
      Alert.alert('Connexion impossible', error.message)
      return
    }
    router.replace('/(tabs)/feed')
  }

  return (
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

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="toi@exemple.com"
              placeholderTextColor="#9B8EA8"
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
              placeholderTextColor="#9B8EA8"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF8F0" />
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
  )
}

const INK = '#1C1420'
const VIOLET = '#6B3FA0'
const CREAM = '#FFF8F0'
const MUTED = '#7A6B85'
const BORDER = '#DDD0E8'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 36 },
  header: { alignItems: 'center', gap: 6 },
  feather: { fontSize: 48, marginBottom: 4 },
  title: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 32, fontWeight: '600', color: INK },
  subtitle: { fontSize: 15, color: MUTED, fontStyle: 'italic' },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { height: 52, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: INK, backgroundColor: '#FFFFFF' },
  btn: { height: 52, backgroundColor: VIOLET, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: CREAM, fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 15, color: MUTED },
  footerLink: { fontSize: 15, color: VIOLET, fontWeight: '600' },
})