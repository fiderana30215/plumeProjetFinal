import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Platform,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { supabase } from '../../lib/supabase'
import LoadingScreen from '../../components/LoadingScreen'
import type { StoryRow } from '../../types/database'

export default function FeedScreen() {
  const [stories, setStories] = useState<StoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchStories() {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

    if (!error && data) setStories(data)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    fetchStories()

    const channel = supabase
      .channel('stories-feed')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
      }, () => fetchStories())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStories()
  }, [])

  function statusLabel(status: string) {
    if (status === 'open') return { text: 'Ouvert', color: '#1D9E75' }
    if (status === 'in_progress') return { text: 'En cours', color: '#BA7517' }
    return { text: 'Terminé', color: '#7A6B85' }
  }

  if (loading) return <LoadingScreen />

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Plume Relais</Text>
        <Text style={styles.subtitle}>Histoires en cours</Text>
      </View>

      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6B3FA0"
          />
        }
        contentContainerStyle={stories.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🪶</Text>
            <Text style={styles.emptyText}>Aucune histoire pour l'instant.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Text style={styles.emptyBtnText}>Créer la première</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => {
          const status = statusLabel(item.status)
          return (
            <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/story/${item.id}` as any)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: status.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: status.color }]}>{status.text}</Text>
                  </View>
                </View>
                <Text style={styles.cardOpening} numberOfLines={2}>{item.opening}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>
                    {item.mode === 'blind' ? '🙈 À l\'aveugle' : '👁 Tout voir'}
                  </Text>
                  <Text style={styles.cardMeta}>
                    Tour {item.current_turn}/{item.max_turns}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )
        }}
      />

      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.fabWrapper}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const INK    = '#1C1420'
const VIOLET = '#6B3FA0'
const CREAM  = '#FFF8F0'
const MUTED  = '#7A6B85'
const BORDER = '#DDD0E8'

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },

  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28, fontWeight: '600', color: INK,
  },
  subtitle: { fontSize: 14, color: MUTED, marginTop: 2 },

  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: INK, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardOpening: { fontSize: 14, color: MUTED, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  cardMeta: { fontSize: 12, color: MUTED },

  empty: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 12, paddingTop: 80,
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, color: MUTED },
  emptyBtn: {
    backgroundColor: VIOLET,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnText: { color: CREAM, fontWeight: '600', fontSize: 15 },

  fabWrapper: { position: 'absolute', bottom: 24, right: 24 },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: VIOLET,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: VIOLET, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: CREAM, fontSize: 28, lineHeight: 32 },
})