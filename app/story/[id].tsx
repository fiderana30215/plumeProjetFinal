import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeInDown,
} from 'react-native-reanimated'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/useAuth'
import { sendLocalNotification } from '../../lib/useNotifications'
import LoadingScreen from '../../components/LoadingScreen'
import type { StoryRow, ContributionRow } from '../../types/database'

type Tab = 'story' | 'propose' | 'vote'

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
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

  const scale = useSharedValue(1)
  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  async function fetchAll() {
    const { data: storyData } = await supabase
      .from('stories').select('*').eq('id', id).single()
    if (storyData) setStory(storyData)

    const { data: canonData } = await supabase
      .from('contributions').select('*')
      .eq('story_id', id).eq('is_canon', true)
      .order('turn_number', { ascending: true })
    if (canonData) setContributions(canonData)

    const { data: proposalData } = await supabase
      .from('contributions').select('*')
      .eq('story_id', id).eq('is_canon', false)
      .order('vote_count', { ascending: false })
    if (proposalData) setProposals(proposalData)

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

  async function handleSubmit() {
    if (!newParagraph.trim()) {
      Alert.alert('Paragraphe vide', 'Écris quelque chose avant de proposer.')
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

    if (error) { Alert.alert('Erreur', error.message); return }

    setNewParagraph('')
    await sendLocalNotification('Paragraphe proposé 🪶', 'Ta proposition a été soumise au vote !')
    Alert.alert('Proposé ! 🪶', 'Ton paragraphe a été soumis.', [
      { text: 'Voir les votes', onPress: () => setTab('vote') }
    ])
  }

  async function handleVote(contributionId: string) {
    if (!userId || !story || myVote) return
    if (proposals.find(p => p.id === contributionId)?.user_id === userId) {
      Alert.alert('Interdit', 'Tu ne peux pas voter pour ta propre proposition.')
      return
    }

    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1)
    })

    setVoting(contributionId)
    const { error } = await supabase.from('votes').insert([{
      contribution_id: contributionId,
      user_id: userId,
      story_id: id,
      turn_number: story.current_turn,
    }] as any)

    if (!error) {
      await supabase.from('contributions')
        .update({ vote_count: (proposals.find(p => p.id === contributionId)?.vote_count ?? 0) + 1 } as any)
        .eq('id', contributionId)
      setMyVote(contributionId)
      await sendLocalNotification('Vote enregistré ✅', 'Ton vote a bien été pris en compte.')
    } else {
      Alert.alert('Erreur', error.message)
    }

    setVoting(null)
    fetchAll()
  }

  if (loading) return <LoadingScreen />

  if (!story) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Histoire introuvable.</Text>
      </View>
    )
  }

  const totalVotes = proposals.reduce((sum, p) => sum + p.vote_count, 0)

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{story.title}</Text>
        <Text style={styles.meta}>
          Tour {story.current_turn}/{story.max_turns} · {story.mode === 'blind' ? '🙈 Aveugle' : '👁 Tout voir'}
        </Text>
      </View>

      <View style={styles.tabs}>
        {(['story', 'propose', 'vote'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'story' ? '📖 Histoire' : t === 'propose' ? '✍️ Proposer' : `🗳️ Voter (${proposals.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.inner}>

        {tab === 'story' && (
          <>
            <Animated.View entering={FadeInDown.springify()}>
              <View style={styles.paragraph}>
                <Text style={styles.paragraphLabel}>✍️ Ouverture</Text>
                <Text style={styles.paragraphText}>{story.opening}</Text>
              </View>
            </Animated.View>
            {contributions.map((c, i) => (
              <Animated.View key={c.id} entering={FadeInDown.delay(i * 100).springify()}>
                <View style={styles.paragraph}>
                  <Text style={styles.paragraphLabel}>Tour {c.turn_number}</Text>
                  <Text style={styles.paragraphText}>{c.content}</Text>
                </View>
              </Animated.View>
            ))}
            {contributions.length === 0 && (
              <Text style={styles.muted}>Aucun paragraphe canon pour l'instant.</Text>
            )}
          </>
        )}

        {tab === 'propose' && (
          <>
            {story.mode === 'blind' && (
              <Animated.View entering={FadeInDown.springify()}>
                <View style={styles.blindWarning}>
                  <Text style={styles.blindText}>🙈 Mode aveugle — tu ne vois que le dernier paragraphe.</Text>
                </View>
              </Animated.View>
            )}
            {contributions.length > 0 && (
              <View style={styles.paragraph}>
                <Text style={styles.paragraphLabel}>Dernier paragraphe</Text>
                <Text style={styles.paragraphText}>
                  {contributions[contributions.length - 1].content}
                </Text>
              </View>
            )}
            <Text style={styles.label}>Ta suite</Text>
            <TextInput
              style={styles.editor}
              value={newParagraph}
              onChangeText={setNewParagraph}
              placeholder="Continue l'histoire..."
              placeholderTextColor="#9B8EA8"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Animated.View style={animatedBtnStyle}>
              <TouchableOpacity
                style={[styles.btn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#FFF8F0" />
                  : <Text style={styles.btnText}>Proposer ce paragraphe 🪶</Text>
                }
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {tab === 'vote' && (
          <>
            {myVote && (
              <View style={styles.votedBanner}>
                <Text style={styles.votedText}>✅ Tu as déjà voté ce tour.</Text>
              </View>
            )}
            {proposals.length === 0 ? (
              <Text style={styles.muted}>Aucune proposition pour l'instant.</Text>
            ) : (
              proposals.map((p, i) => {
                const isMyVote = myVote === p.id
                const isMyProposal = p.user_id === userId
                const percent = totalVotes > 0
                  ? Math.round((p.vote_count / totalVotes) * 100) : 0

                return (
                  <Animated.View key={p.id} entering={FadeInDown.delay(i * 100).springify()}>
                    <View style={[styles.proposalCard, isMyVote && styles.proposalCardVoted]}>
                      <Text style={styles.proposalText}>{p.content}</Text>

                      <View style={styles.voteBar}>
                        <View style={[styles.voteBarFill, { width: `${percent}%` as any }]} />
                      </View>

                      <View style={styles.proposalFooter}>
                        <Text style={styles.voteCount}>
                          {p.vote_count} vote{p.vote_count !== 1 ? 's' : ''} · {percent}%
                        </Text>
                        {!myVote && !isMyProposal && (
                          <Animated.View style={animatedBtnStyle}>
                            <TouchableOpacity
                              style={styles.voteBtn}
                              onPress={() => handleVote(p.id)}
                              disabled={voting === p.id}
                            >
                              {voting === p.id
                                ? <ActivityIndicator size="small" color="#FFF8F0" />
                                : <Text style={styles.voteBtnText}>Voter</Text>
                              }
                            </TouchableOpacity>
                          </Animated.View>
                        )}
                        {isMyProposal && (
                          <Text style={styles.myProposalTag}>Ta proposition</Text>
                        )}
                        {isMyVote && (
                          <Text style={styles.myVoteTag}>✅ Ton vote</Text>
                        )}
                      </View>
                    </View>
                  </Animated.View>
                )
              })
            )}
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
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

  header: {
    paddingTop: 56, paddingHorizontal: 24, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER, gap: 4,
  },
  back: { fontSize: 15, color: VIOLET, fontWeight: '500', marginBottom: 4 },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22, fontWeight: '600', color: INK,
  },
  meta: { fontSize: 13, color: MUTED },

  tabs: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: BORDER, backgroundColor: '#FFFFFF',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: VIOLET },
  tabText: { fontSize: 13, color: MUTED, fontWeight: '500' },
  tabTextActive: { color: VIOLET, fontWeight: '600' },

  inner: { padding: 20, gap: 14, paddingBottom: 48 },

  paragraph: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  paragraphLabel: {
    fontSize: 12, color: VIOLET, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  paragraphText: { fontSize: 16, color: INK, lineHeight: 26 },

  blindWarning: { backgroundColor: '#FAEEDA', borderRadius: 10, padding: 12 },
  blindText: { fontSize: 13, color: '#633806' },

  label: {
    fontSize: 13, fontWeight: '600', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  editor: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    padding: 16, fontSize: 16, color: INK,
    backgroundColor: '#FFFFFF', minHeight: 150,
  },

  btn: {
    height: 52, backgroundColor: VIOLET,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: CREAM, fontSize: 16, fontWeight: '600' },

  votedBanner: { backgroundColor: '#E1F5EE', borderRadius: 10, padding: 12 },
  votedText: { fontSize: 14, color: '#085041', fontWeight: '500' },

  proposalCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: BORDER, gap: 10,
  },
  proposalCardVoted: { borderColor: VIOLET, borderWidth: 2 },
  proposalText: { fontSize: 15, color: INK, lineHeight: 24 },

  voteBar: { height: 4, backgroundColor: BORDER, borderRadius: 2, overflow: 'hidden' },
  voteBarFill: { height: 4, backgroundColor: VIOLET, borderRadius: 2 },

  proposalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voteCount: { fontSize: 12, color: MUTED },
  voteBtn: {
    backgroundColor: VIOLET, paddingHorizontal: 16,
    paddingVertical: 6, borderRadius: 8,
  },
  voteBtnText: { color: CREAM, fontSize: 13, fontWeight: '600' },
  myProposalTag: { fontSize: 12, color: MUTED, fontStyle: 'italic' },
  myVoteTag: { fontSize: 12, color: VIOLET, fontWeight: '600' },

  muted: { fontSize: 15, color: MUTED, textAlign: 'center', paddingVertical: 24 },
})