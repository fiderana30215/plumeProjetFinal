import { View, Image, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

// Fond commun à tous les écrans : lueur diffuse en haut à gauche, grain de
// papier par-dessus. S'adapte à la palette sombre ou claire du thème actif.

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
      {mode === 'dark' && (
        <View style={styles.grain} pointerEvents="none">
          <Image
            source={require('../assets/grain.png')}
            style={styles.grainImg}
            resizeMode="cover"
          />
        </View>
      )}
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
  grain: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  grainImg: {
    width: '100%', height: '100%',
    opacity: 0.5,
  },
  content: { flex: 1 },
})
