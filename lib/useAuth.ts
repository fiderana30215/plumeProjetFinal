import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { Session, AuthError } from '@supabase/supabase-js'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading, userId: session?.user.id ?? null }
}

export async function signUp(email: string, password: string, pseudo: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) return { error }

  const { error: profileError } = await supabase
    .from('users')
    .insert([{ id: data.user.id, pseudo }] as any)

  return { error: profileError }
}

export async function signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

export async function signOut() {
  await supabase.auth.signOut()
}