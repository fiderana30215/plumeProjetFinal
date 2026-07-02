import { View, Text, StyleSheet } from 'react-native'
import Screen from './Screen'
import Spinner from './Spinner'
import { useTheme } from '../contexts/ThemeContext'
import { font } from '../constants/theme'

export default function LoadingScreen() {
  const { color } = useTheme()
  return (
    <Screen>
      <View style={styles.root}>
        <Spinner size={44} />
        <Text style={[styles.text, { color: color.muted }]}>un instant...</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18 },
  text: {
    fontFamily: font.display, fontStyle: 'italic',
    fontSize: 15, letterSpacing: 0.4,
  },
})
