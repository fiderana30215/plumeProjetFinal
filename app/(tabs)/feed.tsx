import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Animated,
} from 'react-native'
import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import LoadingScreen from '../../components/LoadingScreen'
import Screen from '../../components/Screen'
import type { StoryRow } from '../../types/database'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { font, radius, statusLabel, ColorTokens } from '../../constants/theme'

function AnimatedCard({ item, index, onPress, color, t }: {
  item: StoryRow, index: number, onPress: () => void, color: ColorTokens, t: any,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400,
        delay: index * 80, useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 400,
        delay: index * 80, useNativeDriver: false,
      }),
    ]).start()
  }, [])

  const status = statusLabel(item.status, color)
  const statusText = status.text === 'open' ? t.profile.statusOpen
    : status.text === 'in_progress' ? t.profile.statusInProgress
    : t.profile.statusFinished

  const styles = makeStyles(color)

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
      marginBottom: 12,
    }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: status.dim }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.cardOpening} numberOfLines={2}>{item.opening}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            {item.mode === 'blind' ? t.feed.blind : t.feed.full}
          </Text>
          <Text style={styles.cardMeta}>{t.feed.turn} {item.current_turn}/{item.max_turns}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function FABButton({ onPress, color }: { onPress: () => void, color: ColorTokens }) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 300, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: 300, useNativeDriver: false }),
    ]).start()
  }, [])

  const styles = makeStyles(color)

  return (
    <Animated.View style={[styles.fabWrapper, {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }]}>
      <TouchableOpacity style={styles.fab} onPress={onPress}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function FeedScreen() {
  const { color } = useTheme()
  const { t } = useLanguage()
  const [stories, setStories] = useState<StoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchStories() {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

    if (!error && data) setStories(data as StoryRow[])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    fetchStories()
    const channel = supabase
      .channel('stories-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, fetchStories)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStories()
  }, [])

  if (loading) return <LoadingScreen />

  const styles = makeStyles(color)

  return (
    <Screen>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.feed.title}</Text>
          <Text style={styles.subtitle}>{t.feed.subtitle}</Text>
        </View>

        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.ember} />
          }
          contentContainerStyle={stories.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🪶</Text>
              <Text style={styles.emptyText}>{t.feed.empty}</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text style={styles.emptyBtnText}>{t.feed.createFirst}</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => (
            <AnimatedCard
              item={item as StoryRow}
              index={index}
              color={color}
              t={t}
              onPress={() => router.push({
                pathname: '/story/[id]',
                params: { id: item.id }
              } as any)}
            />
          )}
        />

        <FABButton color={color} onPress={() => router.push('/(tabs)/create')} />
      </View>
    </Screen>
  )
}

function makeStyles(color: ColorTokens) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: color.border,
    },
    title: { fontFamily: font.display, fontSize: 28, fontWeight: '600', color: color.ink },
    subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 14, color: color.muted, marginTop: 2 },
    list: { padding: 16 },
    emptyContainer: { flex: 1 },
    card: {
      backgroundColor: color.surface, borderRadius: radius.lg,
      borderWidth: 1, borderColor: color.border, padding: 16, gap: 8,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    cardTitle: { fontSize: 17, fontWeight: '600', color: color.ink, flex: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
    badgeText: { fontSize: 12, fontWeight: '600' },
    cardOpening: { fontSize: 14, color: color.muted, lineHeight: 20 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    cardMeta: { fontSize: 12, color: color.faint },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 80 },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: 16, color: color.muted },
    emptyBtn: { backgroundColor: color.ember, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.md },
    emptyBtnText: { color: color.void, fontWeight: '700', fontSize: 15 },
    fabWrapper: { position: 'absolute', bottom: 24, right: 24 },
    fab: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: color.ember,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: color.ember, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    fabText: { color: color.void, fontSize: 28, lineHeight: 32 },
  })
}
