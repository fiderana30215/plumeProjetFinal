import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Configuration globale
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Demande la permission au premier lancement
export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Plume Relais',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6B3FA0',
    })
  }

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// Envoie une notification locale immédiate
export async function sendLocalNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    })
  } catch (e) {
    console.log('Notification ignorée:', e)
  }
}