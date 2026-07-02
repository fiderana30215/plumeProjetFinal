import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Alert, ScrollView,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { signUp } from '../../lib/useAuth'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import { color, font, shared } from '../../constants/theme'

export default function RegisterScreen() {
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
    if (!pseudo.trim() || !email.trim() || !password || !confirm) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
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
    Alert.alert('Compte créé 🪶', 'Vérifie ta boîte mail.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') }
    ])
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.feather}>🪶</Text>
            <Text style={styles.title}>Rejoins l'histoire</Text>
            <Text style={styles.subtitle}>Choisis ton nom de plume</Text>
          </View>

          <View style={styles.card}>
            {[
              { label: 'Pseudo', value: pseudo, setter: setPseudo, placeholder: 'TonNomDePlume', secure: false },
              { label: 'E-mail', value: email, setter: setEmail, placeholder: 'toi@exemple.com', secure: false },
              { label: 'Mot de passe', value: password, setter: setPassword, placeholder: '8 caractères minimum', secure: true },
              { label: 'Confirmer', value: confirm, setter: setConfirm, placeholder: 'Répète ton mot de passe', secure: true },
            ].map(({ label, value, setter, placeholder, secure }) => (
              <View key={label} style={styles.field}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
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
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading
                ? <Spinner size={22} dotColor={color.void} />
                : <Text style={styles.btnText}>Créer mon compte</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 28 },
  header: { alignItems: 'center', gap: 8 },
  feather: { fontSize: 40, marginBottom: 4 },
  title: { fontFamily: font.display, fontSize: 28, fontWeight: '600', color: color.ink },
  subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 15, color: color.muted },
  card: { ...shared.card, padding: 20, gap: 14 },
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
