import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { signUp } from '../../lib/useAuth'

export default function RegisterScreen() {
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!pseudo.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Champs manquants', 'Tous les champs sont obligatoires.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      Alert.alert('Mots de passe différents', 'Les deux mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    const { error } = await signUp(email.trim().toLowerCase(), password, pseudo.trim())
    setLoading(false)
    if (error) {
      Alert.alert('Inscription impossible', error.message)
      return
    }
    Alert.alert('Compte créé ! 🪶', 'Vérifie ta boîte mail.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') }
    ])
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.feather}>🪶</Text>
          <Text style={styles.title}>Rejoins l'histoire</Text>
          <Text style={styles.subtitle}>Choisis ton nom de plume</Text>
        </View>

        <View style={styles.form}>
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
                placeholderTextColor="#9B8EA8"
                secureTextEntry={secure}
                autoCapitalize="none"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF8F0" />
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
  )
}

const INK = '#1C1420'
const VIOLET = '#6B3FA0'
const CREAM = '#FFF8F0'
const MUTED = '#7A6B85'
const BORDER = '#DDD0E8'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 32 },
  header: { alignItems: 'center', gap: 6 },
  feather: { fontSize: 48, marginBottom: 4 },
  title: { fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 28, fontWeight: '600', color: INK },
  subtitle: { fontSize: 15, color: MUTED, fontStyle: 'italic' },
  form: { gap: 14 },
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