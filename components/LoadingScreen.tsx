import { View, Text, StyleSheet } from 'react-native'
import Screen from './Screen'
import Spinner from './Spinner'
import { color, font } from '../constants/theme'

export default function LoadingScreen() {
  return (
    <Screen>
      <View style={styles.root}>
        <Spinner size={44} />
        <Text style={styles.text}>un instant...</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 18 },
  text: {
    fontFamily: font.display, fontStyle: 'italic',
    fontSize: 15, color: color.muted, letterSpacing: 0.4,
  },
})
