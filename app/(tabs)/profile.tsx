import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, ScrollView,
} from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth, signOut } from '../../lib/useAuth'
import type { UserRow, StoryRow } from '../../types/database'

export default function ProfileScreen() {
  const { userId } = useAuth()
  const [profile, setProfile] = useState<UserRow | null>(null)
  const [stories, setStories] = useState<StoryRow[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchProfile() {
    if (!userId) return

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: storiesData } = await supabase
      .from('stories')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (profileData) setProfile(profileData)
    if (storiesData) setStories(storiesData)
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [userId])

  async function handleSignOut() {
    Alert.alert('Déconnexion', 'Tu vas être déconnecté.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter', style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        }
      }
    ])
  }

  function statusLabel(status: string) {
    if (status === 'open') return { text: 'Ouvert', color: '#1D9E75' }
    if (status === 'in_progress') return { text: 'En cours', color: '#BA7517' }
    return { text: 'Terminé', color: '#7A6B85' }
  }

  function scoreLabel(score: number) {
    if (score >= 50) return '🏆 Maître conteur'
    if (score >= 20) return '✨ Conteur confirmé'
    if (score >= 5)  return '📖 Apprenti conteur'
    return '🪶 Nouvelle plume'
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6B3FA0" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.inner}>

      {/* Avatar et pseudo */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.pseudo?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.pseudo}>{profile?.pseudo ?? 'Anonyme'}</Text>
        <Text style={styles.badge}>{scoreLabel(profile?.score ?? 0)}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{profile?.score ?? 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{stories.length}</Text>
          <Text style={styles.statLabel}>Histoires créées</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {stories.filter(s => s.status === 'finished').length}
          </Text>
          <Text style={styles.statLabel}>Terminées</Text>
        </View>
      </View>

      {/* Mes histoires */}
      <Text style={styles.sectionTitle}>Mes histoires</Text>

      {stories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Tu n'as pas encore créé d'histoire.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/create')}
          >
            <Text style={styles.emptyBtnText}>Créer une histoire</Text>
          </TouchableOpacity>
        </View>
      ) : (
        stories.map((story) => {
          const status = statusLabel(story.status)
          return (
            <TouchableOpacity
              key={story.id}
              style={styles.card}
              onPress={() => router.push(`/story/${story.id}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{story.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.color + '22' }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>Tour {story.current_turn}/{story.max_turns}</Text>
            </TouchableOpacity>
          )
        })
      )}

      {/* Bouton déconnexion */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CREAM },
  inner: { padding: 24, gap: 16, paddingBottom: 48 },

  hero: { alignItems: 'center', gap: 8, paddingTop: 40, paddingBottom: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: VIOLET,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 36, color: '#FFF8F0', fontWeight: '600' },
  pseudo: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 24, fontWeight: '600', color: INK,
  },
  badge: { fontSize: 14, color: MUTED },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: { alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 24, fontWeight: '700', color: VIOLET },
  statLabel: { fontSize: 12, color: MUTED },
  statDivider: { width: 1, height: 40, backgroundColor: BORDER },

  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 8,
  },

  empty: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  emptyText: { fontSize: 15, color: MUTED },
  emptyBtn: { backgroundColor: VIOLET, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: CREAM, fontWeight: '600' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: INK, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: MUTED },

  signOutBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { color: '#E24B4A', fontSize: 15, fontWeight: '600' },
})