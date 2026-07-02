import { View, Image, StyleSheet, ViewStyle } from 'react-native'
import { color } from '../constants/theme'

// Fond commun à tous les écrans : noir chaud, lueur diffuse en haut à
// gauche (comme une bougie hors champ), grain de papier par-dessus.
// C'est la signature visuelle du thème "Encre de minuit".

export default function Screen({ children, style }: { children: React.ReactNode, style?: ViewStyle }) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.grain} pointerEvents="none">
        <Image
          source={require('../assets/grain.png')}
          style={styles.grainImg}
          resizeMode="cover"
        />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.void },
  glow: {
    position: 'absolute', top: -120, left: -80,
    width: 420, height: 420, borderRadius: 210,
    backgroundColor: 'rgba(212,177,90,0.06)',
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
