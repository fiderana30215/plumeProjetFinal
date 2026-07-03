import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../contexts/ThemeContext'

export default function TabLayout() {
  const { color, mode } = useTheme()

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarActiveTintColor: color.ember,
      tabBarInactiveTintColor: color.faint,
      tabBarBackground: () => (
        <BlurView
          intensity={60}
          tint={mode === 'dark' ? 'dark' : 'light'}
          style={{
            flex: 1,
            borderRadius: 28,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: color.border,
          }}
        />
      ),
      tabBarStyle: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: Platform.OS === 'ios' ? 32 : 20,
        height: 64,
        borderRadius: 28,
        borderTopWidth: 0,
        elevation: 0,
        // Le fond réel vient de tabBarBackground (BlurView) ; on garde une
        // teinte translucide ici en repli pour Android où le blur est plus limité.
        backgroundColor: mode === 'dark' ? 'rgba(20,18,16,0.55)' : 'rgba(255,255,255,0.55)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      tabBarItemStyle: { paddingTop: 8 },
    }}>
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused, color: c, size }) => (
            <Ionicons name={focused ? 'library' : 'library-outline'} size={size ?? 24} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused, color: c, size }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={(size ?? 24) + 4} color={c} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color: c, size }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size ?? 24} color={c} />
          ),
        }}
      />
    </Tabs>
  )
}