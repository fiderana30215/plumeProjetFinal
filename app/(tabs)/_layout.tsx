import { Tabs } from 'expo-router'
import { useTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'

export default function TabLayout() {
  const { color } = useTheme()
  const { t } = useLanguage()

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
      <Tabs.Screen name="feed" options={{ title: t.tabs.stories, tabBarIcon: () => null }} />
      <Tabs.Screen name="create" options={{ title: t.tabs.create, tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: t.tabs.profile, tabBarIcon: () => null }} />
    </Tabs>
  )
}
