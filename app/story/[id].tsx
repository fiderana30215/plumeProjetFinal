import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Platform,
  KeyboardAvoidingView, Animated,
} from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { sendLocalNotification } from '../../lib/useNotifications'
import LoadingScreen from '../../components/LoadingScreen'
import Screen from '../../components/Screen'
import Spinner from '../../components/Spinner'
import type { StoryRow, ContributionRow } from '../../types/database'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { font, radius, ColorTokens } from '../../constants/theme'

type Tab = 'story' | 'propose' | 'vote'

export default function StoryScreen() {
  const { color, shared } = useTheme()
  const { t } = useLanguage()
  const params = useLocalSearchParams<{ id?: string }>()

  // Sur web, l'id peut venir des params OU de l'URL directement
  const rawId = (params?.id as string) || ''
  const urlId = typeof window !== 'undefined'
    ? window.location?.pathname?.split('/story/')?.[1]?.split('?')?.[0] || ''
    : ''
  const id = (rawId && rawId !== 'undefined') ? rawId : urlId

  const { userId } = useAuth()

  const [story, setStory] = useState<StoryRow | null>(null)
  const [contributions, setContributions] = useState<ContributionRow[]>([])
  const [proposals, setProposals] = useState<ContributionRow[]>([])
  const [newParagraph, setNewParagraph] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [voting, setVoting] = useState<string | null>(null)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('story')

  const scaleAnim = useRef(new Animated.Value(1)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 400, useNativeDriver: false,
    }).start()
  }, [tab])

  async function fetchAll() {
    if (!id) return

    const { data: storyData } = await supabase
      .from('stories').select('*').eq('id', id).single()
    if (storyData) setStory(storyData as StoryRow)

    const { data: canonData } = await supabase
      .from('contributions').select('*')
      .eq('story_id', id).eq('is_canon', true)
      .order('turn_number', { ascending: true })
    if (canonData) setContributions(canonData as ContributionRow[])

    const { data: proposalData } = await supabase
      .from('contributions').select('*')
      .eq('story_id', id).eq('is_canon', false)
      .order('vote_count', { ascending: false })
    if (proposalData) setProposals(proposalData as ContributionRow[])

    if (userId && storyData) {
      const { data: voteData } = await (supabase
        .from('votes').select('contribution_id')
        .eq('user_id', userId)
        .eq('story_id', id)
        .eq('turn_number', (storyData as any).current_turn)
        .single() as any)
      if (voteData) setMyVote((voteData as any).contribution_id)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    fetchAll()

    const channel = supabase
      .channel(`story-${id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'contributions', filter: `story_id=eq.${id}`
      }, fetchAll)
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'votes', filter: `story_id=eq.${id}`
      }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  function animateAndVote(contributionId: string) {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: false }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start()
    handleVote(contributionId)
  }

  async function handleSubmit() {
    if (!newParagraph.trim()) {
      Alert.alert(t.story.emptyParagraphTitle, t.story.emptyParagraphBody)
      return
    }
    if (!userId || !story) return

    setSubmitting(true)
    const { error } = await (supabase.from('contributions') as any).insert([{
      story_id: id,
      user_id: userId,
      content: newParagraph.trim(),
      turn_number: story.current_turn,
    }])
    setSubmitting(false)

    if (error) { Alert.alert(t.common.error, error.message); return }

    setNewParagraph('')
    await sendLocalNotification(
      'Paragraphe proposé 🪶',
      'Ta proposition a été soumise au vote !'
    )
    Alert.alert(t.story.proposedTitle, t.story.proposedBody, [
      { text: t.story.seeVotes, onPress: () => setTab('vote') }
    ])
  }

  async function handleVote(contributionId: string) {
    if (!userId || !story || myVote) return
    if (proposals.find(p => p.id === contributionId)?.user_id === userId) {
      Alert.alert(t.story.forbiddenTitle, t.story.forbiddenBody)
      return
    }

    setVoting(contributionId)
    // Vote atomique côté base de données (insertion + incrémentation du
    // compteur dans la même transaction) : évite les compteurs faux qui
    // survenaient avec un update séparé basé sur l'état local.
    const { error } = await supabase.rpc('cast_vote', {
      p_contribution_id: contributionId,
      p_story_id: id,
      p_turn_number: story.current_turn,
    })

    if (!error) {
      setMyVote(contributionId)
      await sendLocalNotification(
        'Vote enregistré ✅',
        'Ton vote a bien été pris en compte.'
      )
    } else {
      Alert.alert(t.common.error, error.message)
    }

    setVoting(null)
    fetchAll()
  }

  if (loading) return <LoadingScreen />

  const styles = makeStyles(color)

  if (!story) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.muted}>{t.story.notFound} (id: {id || '—'})</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: color.ember }}>{t.common.back}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    )
  }

  const totalVotes = proposals.reduce((sum, p) => sum + p.vote_count, 0)

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>{t.common.back}</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{story.title}</Text>
          <Text style={styles.meta}>
            {t.story.turn} {story.current_turn}/{story.max_turns} · {story.mode === 'blind' ? t.feed.blind : t.feed.full}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['story', 'propose', 'vote'] as Tab[]).map((tb) => (
            <TouchableOpacity
              key={tb}
              style={[styles.tab, tab === tb && styles.tabActive]}
              onPress={() => setTab(tb)}
            >
              <Text style={[styles.tabText, tab === tb && styles.tabTextActive]}>
                {tb === 'story' ? t.story.tabStory : tb === 'propose' ? t.story.tabPropose : `${t.story.tabVote} (${proposals.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.ScrollView
          contentContainerStyle={styles.inner}
          style={{ opacity: fadeAnim }}
        >
          {/* Onglet Histoire */}
          {tab === 'story' && (
            <>
              <View style={styles.paragraph}>
                <Text style={styles.paragraphLabel}>{t.story.opening}</Text>
                <Text style={styles.paragraphText}>{story.opening}</Text>
              </View>
              {contributions.map((c) => (
                <View key={c.id} style={styles.paragraph}>
                  <Text style={styles.paragraphLabel}>{t.story.turn} {c.turn_number}</Text>
                  <Text style={styles.paragraphText}>{c.content}</Text>
                </View>
              ))}
              {contributions.length === 0 && (
                <Text style={styles.muted}>{t.story.noCanon}</Text>
              )}
            </>
          )}

          {/* Onglet Proposer */}
          {tab === 'propose' && (
            <>
              {story.mode === 'blind' && (
                <View style={styles.blindWarning}>
                  <Text style={styles.blindText}>{t.story.blindWarning}</Text>
                </View>
              )}
              {contributions.length > 0 && (
                <View style={styles.paragraph}>
                  <Text style={styles.paragraphLabel}>{t.story.lastParagraph}</Text>
                  <Text style={styles.paragraphText}>
                    {contributions[contributions.length - 1].content}
                  </Text>
                </View>
              )}
              <Text style={shared.label}>{t.story.yourTurn}</Text>
              <TextInput
                style={styles.editor}
                value={newParagraph}
                onChangeText={setNewParagraph}
                placeholder={t.story.editorPlaceholder}
                placeholderTextColor={color.faint}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  style={[shared.btnPrimary, submitting && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting
                    ? <Spinner size={22} dotColor={color.void} />
                    : <Text style={shared.btnPrimaryText}>{t.story.submit}</Text>
                  }
                </TouchableOpacity>
              </Animated.View>
            </>
          )}

          {/* Onglet Vote */}
          {tab === 'vote' && (
            <>
              {myVote && (
                <View style={styles.votedBanner}>
                  <Text style={styles.votedText}>{t.story.alreadyVoted}</Text>
                </View>
              )}
              {proposals.length === 0 ? (
                <Text style={styles.muted}>{t.story.noProposals}</Text>
              ) : (
                proposals.map((p) => {
                  const isMyVote     = myVote === p.id
                  const isMyProposal = p.user_id === userId
                  const percent      = totalVotes > 0
                    ? Math.round((p.vote_count / totalVotes) * 100) : 0

                  return (
                    <View key={p.id} style={[styles.proposalCard, isMyVote && styles.proposalCardVoted]}>
                      <Text style={styles.proposalText}>{p.content}</Text>

                      <View style={styles.voteBar}>
                        <View style={[styles.voteBarFill, { width: `${percent}%` as any }]} />
                      </View>

                      <View style={styles.proposalFooter}>
                        <Text style={styles.voteCount}>
                          {p.vote_count} · {percent}%
                        </Text>
                        {!myVote && !isMyProposal && (
                          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                              style={styles.voteBtn}
                              onPress={() => animateAndVote(p.id)}
                              disabled={voting === p.id}
                            >
                              {voting === p.id
                                ? <Spinner size={16} dotColor={color.void} />
                                : <Text style={styles.voteBtnText}>{t.story.vote}</Text>
                              }
                            </TouchableOpacity>
                          </Animated.View>
                        )}
                        {isMyProposal && (
                          <Text style={styles.myProposalTag}>{t.story.yourProposal}</Text>
                        )}
                        {isMyVote && (
                          <Text style={styles.myVoteTag}>{t.story.yourVote}</Text>
                        )}
                      </View>
                    </View>
                  )
                })
              )}
            </>
          )}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

function makeStyles(color: ColorTokens) {
  return StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

    header: {
      paddingTop: 56, paddingHorizontal: 24, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: color.border, gap: 4,
    },
    back: { fontSize: 15, color: color.ember, fontWeight: '500', marginBottom: 4 },
    title: { fontFamily: font.display, fontSize: 22, fontWeight: '600', color: color.ink },
    meta: { fontSize: 13, color: color.muted },

    tabs: {
      flexDirection: 'row', borderBottomWidth: 1,
      borderBottomColor: color.border, backgroundColor: color.surface,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: color.ember },
    tabText: { fontSize: 13, color: color.muted, fontWeight: '500' },
    tabTextActive: { color: color.ember, fontWeight: '600' },

    inner: { padding: 20, gap: 14, paddingBottom: 48 },

    paragraph: {
      backgroundColor: color.surface, borderRadius: radius.lg,
      borderWidth: 1, borderColor: color.border, padding: 16, gap: 8,
    },
    paragraphLabel: {
      fontSize: 12, color: color.ember, fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: 0.8,
    },
    paragraphText: { fontSize: 16, color: color.ink, lineHeight: 26 },

    blindWarning: { backgroundColor: color.warningDim, borderRadius: radius.sm, padding: 12 },
    blindText: { fontSize: 13, color: color.warning },

    editor: {
      borderWidth: 1, borderColor: color.border, borderRadius: radius.md,
      padding: 16, fontSize: 16, color: color.ink,
      backgroundColor: color.surface, minHeight: 150,
    },

    btnDisabled: { opacity: 0.6 },

    votedBanner: { backgroundColor: color.successDim, borderRadius: radius.sm, padding: 12 },
    votedText: { fontSize: 14, color: color.success, fontWeight: '500' },

    proposalCard: {
      backgroundColor: color.surface, borderRadius: radius.lg,
      borderWidth: 1, borderColor: color.border, padding: 16, gap: 10,
    },
    proposalCardVoted: { borderColor: color.emberBorder, borderWidth: 1.5 },
    proposalText: { fontSize: 15, color: color.ink, lineHeight: 24 },

    voteBar: { height: 4, backgroundColor: color.border, borderRadius: 2, overflow: 'hidden' },
    voteBarFill: { height: 4, backgroundColor: color.ember, borderRadius: 2 },

    proposalFooter: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    voteCount: { fontSize: 12, color: color.muted },
    voteBtn: {
      backgroundColor: color.ember, paddingHorizontal: 16,
      paddingVertical: 6, borderRadius: radius.sm, minWidth: 56, alignItems: 'center',
    },
    voteBtnText: { color: color.void, fontSize: 13, fontWeight: '700' },
    myProposalTag: { fontSize: 12, color: color.muted, fontStyle: 'italic' },
    myVoteTag: { fontSize: 12, color: color.ember, fontWeight: '600' },

    muted: { fontSize: 15, color: color.muted, textAlign: 'center', paddingVertical: 24 },
  })
}