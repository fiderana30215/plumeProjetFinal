import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
} from 'react-native'
import { useState, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import type { UserRow, StoryRow } from '../../types/database'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { font, radius, ColorTokens } from '../../constants/theme'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { color, shared } = useTheme()
  const { t } = useLanguage()
  const { userId } = useAuth()

  const [profile, setProfile] = useState<UserRow | null>(null)
  const [stories, setStories] = useState<StoryRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On consulte son propre profil : direction l'onglet Profil (avec édition, histoires privées...)
    if (id && userId && id === userId) {
      router.replace('/(tabs)/profile')
      return
    }
    if (!id) return

    let cancelled = false
    async function load() {
      const [{ data: profileData }, { data: storiesData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', id).single(),
        supabase.from('stories').select('*')
          .eq('owner_id', id).eq('visibility', 'public')
          .order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      if (profileData) setProfile(profileData)
      if (storiesData) setStories(storiesData)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, userId])

  function scoreLabel(score: number) {
    if (score >= 50) return t.profile.scoreMaster
    if (score >= 20) return t.profile.scoreConfirmed
    if (score >= 5) return t.profile.scoreApprentice
    return t.profile.scoreNew
  }

  function statusText(status: string) {
    if (status === 'open') return t.profile.statusOpen
    if (status === 'in_progress') return t.profile.statusInProgress
    return t.profile.statusFinished
  }

  const styles = makeStyles(color)

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Spinner size={40} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>{t.common.back}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.root} contentContainerStyle={styles.inner}>

        <View style={styles.hero}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.pseudo?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <Text style={styles.pseudo}>{profile?.pseudo ?? '—'}</Text>
          <Text style={styles.badge}>{scoreLabel(profile?.score ?? 0)}</Text>
        </View>

        <View style={[shared.card, styles.statsRow]}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile?.score ?? 0}</Text>
            <Text style={styles.statLabel}>{t.profile.pointsLabel}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{stories.length}</Text>
            <Text style={styles.statLabel}>{t.profile.storiesCreated}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {stories.filter(s => s.status === 'finished').length}
            </Text>
            <Text style={styles.statLabel}>{t.profile.storiesFinished}</Text>
          </View>
        </View>

        <Text style={[shared.label, styles.sectionTitle]}>{t.userProfile.storiesTitle}</Text>

        {stories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t.userProfile.empty}</Text>
          </View>
        ) : (
          stories.map((story) => {
            const statusColor = story.status === 'open' ? color.success
              : story.status === 'in_progress' ? color.warning
              : color.muted
            const statusDim = story.status === 'open' ? color.successDim
              : story.status === 'in_progress' ? color.warningDim
              : 'rgba(156,146,132,0.14)'
            return (
              <TouchableOpacity
                key={story.id}
                style={[shared.card, styles.card]}
                onPress={() => router.push(`/story/${story.id}` as any)}
                activeOpacity={0.85}
              >
                {story.cover_url && (
                  <Image source={{ uri: story.cover_url }} style={styles.cardCover} resizeMode="cover" />
                )}
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{story.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusDim }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText(story.status)}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{t.story.turn} {story.current_turn}/{story.max_turns}</Text>
              </TouchableOpacity>
            )
          })
        )}

      </ScrollView>
    </Screen>
  )
}

function makeStyles(color: ColorTokens) {
  return StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8,
    },
    back: { fontSize: 15, color: color.ember, fontWeight: '500' },
    inner: { padding: 24, paddingTop: 8, gap: 16, paddingBottom: 48 },

    hero: { alignItems: 'center', gap: 8, paddingBottom: 8 },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: color.emberDim,
      borderWidth: 1, borderColor: color.emberBorder,
      justifyContent: 'center', alignItems: 'center',
    },
    avatarImg: {
      width: 80, height: 80, borderRadius: 40,
      borderWidth: 1, borderColor: color.emberBorder,
    },
    avatarText: { fontSize: 34, color: color.ember, fontWeight: '600', fontFamily: font.display },
    pseudo: { fontFamily: font.display, fontSize: 24, fontWeight: '600', color: color.ink },
    badge: { fontSize: 14, color: color.muted, fontStyle: 'italic' },

    statsRow: {
      flexDirection: 'row',
      padding: 20,
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    stat: { alignItems: 'center', gap: 4 },
    statNumber: { fontSize: 24, fontWeight: '700', color: color.ember, fontFamily: font.display },
    statLabel: { fontSize: 12, color: color.muted },
    statDivider: { width: 1, height: 40, backgroundColor: color.border },

    sectionTitle: { marginTop: 8 },

    empty: { alignItems: 'center', gap: 12, paddingVertical: 24 },
    emptyText: { fontSize: 15, color: color.muted, textAlign: 'center' },

    card: { padding: 16, gap: 6, overflow: 'hidden' },
    cardCover: { width: '100%', height: 120, borderRadius: radius.md, marginBottom: 4 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontSize: 16, fontWeight: '600', color: color.ink, flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
    statusText: { fontSize: 12, fontWeight: '600' },
    cardMeta: { fontSize: 13, color: color.faint },
  })
}