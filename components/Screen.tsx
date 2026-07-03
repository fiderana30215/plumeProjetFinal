import { View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

// Fond commun à tous les écrans : lueur diffuse en haut à gauche.
// S'adapte à la palette sombre ou claire du thème actif.

export default function Screen({ children, style }: { children: React.ReactNode, style?: ViewStyle }) {
  const { mode, color } = useTheme()

  return (
    <View style={[styles.root, { backgroundColor: color.void }, style]}>
      <View
        style={[styles.glow, {
          backgroundColor: mode === 'dark' ? 'rgba(212,177,90,0.06)' : 'rgba(169,125,36,0.08)',
        }]}
        pointerEvents="none"
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: 'absolute', top: -120, left: -80,
    width: 420, height: 420, borderRadius: 210,
  },
  content: { flex: 1 },
})