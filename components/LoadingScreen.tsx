import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing
} from 'react-native-reanimated'
import { useEffect } from 'react'

export default function LoadingScreen() {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  return (
    <View style={styles.root}>
      <Animated.Text style={[styles.feather, animatedStyle]}>🪶</Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#FFF8F0',
  },
  feather: { fontSize: 48 },
})