import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Animated, Image, TextInput,
} from 'react-native'
import { useState, useEffect, useCallback, useRef } from 'react'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import LoadingScreen from '../../components/LoadingScreen'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import type { StoryRow, UserRow } from '../../types/database'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { font, radius, statusLabel, ColorTokens } from '../../constants/theme'

const SEARCH_DEBOUNCE_MS = 350
const SEARCH_RESULT_LIMIT = 8

function AnimatedCard({ item, index, onPress, color, t }: {
  item: StoryRow, index: number, onPress: () => void, color: ColorTokens, t: any,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400,
        delay: index * 80, useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 400,
        delay: index * 80, useNativeDriver: false,
      }),
    ])
    anim.start()
    // Annule l'animation si le composant se démonte pendant qu'elle tourne
    // (ex: la liste se re-render suite à une mise à jour temps réel) —
    // sans ça, l'animation continue d'essayer d'agir sur un nœud DOM
    // retiré, ce qui déclenche des erreurs "removeChild" en cascade sur web.
    return () => anim.stop()
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
        {item.cover_url && (
          <Image source={{ uri: item.cover_url }} style={styles.cardCover} resizeMode="cover" />
        )}
        <View style={styles.cardBody}>
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
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

function FABButton({ onPress, color }: { onPress: () => void, color: ColorTokens }) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: 300, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: 300, useNativeDriver: false }),
    ])
    anim.start()
    return () => anim.stop()
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

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [storyResults, setStoryResults] = useState<StoryRow[]>([])
  const [userResults, setUserResults] = useState<UserRow[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Recherche débouncée : dès que l'utilisateur tape, on attend qu'il
  // s'arrête (350ms) avant d'interroger Supabase, pour ne pas spammer
  // une requête à chaque frappe.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const q = query.trim()
    if (q.length === 0) {
      setStoryResults([])
      setUserResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const escaped = q.replace(/[%_]/g, '\\$&')
      const [{ data: storiesData }, { data: usersData }] = await Promise.all([
        supabase
          .from('stories')
          .select('*')
          .eq('visibility', 'public')
          .or(`title.ilike.%${escaped}%,opening.ilike.%${escaped}%`)
          .order('created_at', { ascending: false })
          .limit(SEARCH_RESULT_LIMIT),
        supabase
          .from('users')
          .select('*')
          .ilike('pseudo', `%${escaped}%`)
          .limit(SEARCH_RESULT_LIMIT),
      ])
      setStoryResults((storiesData as StoryRow[]) ?? [])
      setUserResults((usersData as UserRow[]) ?? [])
      setSearching(false)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStories()
  }, [])

  if (loading) return <LoadingScreen />

  const styles = makeStyles(color)
  const isSearchMode = query.trim().length > 0
  const hasResults = storyResults.length > 0 || userResults.length > 0

  return (
    <Screen>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.feed.title}</Text>
          <Text style={styles.subtitle}>{t.feed.subtitle}</Text>

          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={t.search.placeholder}
              placeholderTextColor={color.faint}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searching && <Spinner size={16} dotColor={color.ember} />}
            {!!query && !searching && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearchMode ? (
          <FlatList
            data={[]}
            keyExtractor={() => 'search'}
            renderItem={null}
            contentContainerStyle={styles.searchResults}
            ListHeaderComponent={
              <View>
                {!searching && !hasResults && (
                  <Text style={styles.searchEmpty}>{t.search.noResults}</Text>
                )}

                {userResults.length > 0 && (
                  <View style={styles.searchSection}>
                    <Text style={styles.searchSectionTitle}>{t.search.sectionProfiles}</Text>
                    {userResults.map((u) => (
                      <TouchableOpacity
                        key={u.id}
                        style={styles.userRow}
                        onPress={() => router.push(`/user/${u.id}` as any)}
                        activeOpacity={0.8}
                      >
                        {u.avatar_url ? (
                          <Image source={{ uri: u.avatar_url }} style={styles.userAvatarImg} />
                        ) : (
                          <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>
                              {u.pseudo?.charAt(0).toUpperCase() ?? '?'}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.userPseudo} numberOfLines={1}>{u.pseudo}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {storyResults.length > 0 && (
                  <View style={styles.searchSection}>
                    <Text style={styles.searchSectionTitle}>{t.search.sectionStories}</Text>
                    {storyResults.map((item, index) => (
                      <AnimatedCard
                        key={item.id}
                        item={item}
                        index={index}
                        color={color}
                        t={t}
                        onPress={() => router.push({
                          pathname: '/story/[id]',
                          params: { id: item.id }
                        } as any)}
                      />
                    ))}
                  </View>
                )}
              </View>
            }
          />
        ) : (
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
        )}

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
      borderBottomWidth: 1, borderBottomColor: color.border, gap: 12,
    },
    title: { fontFamily: font.display, fontSize: 28, fontWeight: '600', color: color.ink },
    subtitle: { fontFamily: font.display, fontStyle: 'italic', fontSize: 14, color: color.muted, marginTop: 2 },

    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1, borderColor: color.border, borderRadius: radius.pill,
      backgroundColor: color.surface, paddingHorizontal: 14, height: 44,
    },
    searchIcon: { fontSize: 14 },
    searchInput: { flex: 1, fontSize: 15, color: color.ink, height: '100%' },
    searchClear: { fontSize: 14, color: color.faint, padding: 4 },

    searchResults: { padding: 16, paddingBottom: 100 },
    searchEmpty: { textAlign: 'center', fontSize: 15, color: color.muted, paddingTop: 40 },
    searchSection: { marginBottom: 20 },
    searchSectionTitle: {
      fontSize: 13, fontWeight: '700', color: color.faint,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
    },
    userRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 10, paddingHorizontal: 12,
      backgroundColor: color.surface, borderRadius: radius.md,
      borderWidth: 1, borderColor: color.border, marginBottom: 8,
    },
    userAvatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: color.emberDim, borderWidth: 1, borderColor: color.emberBorder,
      justifyContent: 'center', alignItems: 'center',
    },
    userAvatarImg: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: color.emberBorder },
    userAvatarText: { fontSize: 16, color: color.ember, fontWeight: '600', fontFamily: font.display },
    userPseudo: { fontSize: 15, color: color.ink, fontWeight: '600', flex: 1 },

    list: { padding: 16 },
    emptyContainer: { flex: 1 },
    card: {
      backgroundColor: color.surface, borderRadius: radius.lg,
      borderWidth: 1, borderColor: color.border, overflow: 'hidden',
    },
    cardCover: { width: '100%', height: 140 },
    cardBody: { padding: 16, gap: 8 },
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