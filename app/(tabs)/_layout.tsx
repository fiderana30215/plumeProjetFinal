import { Tabs } from 'expo-router'
import { color } from '../../constants/theme'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: color.ember,
      tabBarInactiveTintColor: color.faint,
      tabBarStyle: {
        backgroundColor: color.void,
        borderTopColor: color.border,
        borderTopWidth: 1,
      },
    }}>
      <Tabs.Screen name="feed" options={{ title: 'Histoires', tabBarIcon: () => null }} />
      <Tabs.Screen name="create" options={{ title: 'Créer', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: () => null }} />
    </Tabs>
  )
}
