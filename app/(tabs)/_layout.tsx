import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#6B3FA0',
      tabBarStyle: {
        backgroundColor: '#FFF8F0',
        borderTopColor: '#DDD0E8',
      },
    }}>
      <Tabs.Screen name="feed" options={{ title: 'Histoires', tabBarIcon: () => null }} />
      <Tabs.Screen name="create" options={{ title: 'Créer', tabBarIcon: () => null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: () => null }} />
    </Tabs>
  )
}