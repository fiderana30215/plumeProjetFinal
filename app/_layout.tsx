import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { useAuth } from '../lib/useAuth'
import { requestNotificationPermission } from '../lib/useNotifications'

export default function RootLayout() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/feed')
    }
  }, [session, loading, segments])

  if (loading) return null

  return <Slot />
}