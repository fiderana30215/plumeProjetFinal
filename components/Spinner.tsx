import { View, StyleSheet } from 'react-native'
import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { color } from '../constants/theme'

// Le loader signature de Plume Relais : douze points disposés en cercle,
// qui s'éteignent un à un comme des lettres qui s'écrivent — écho direct
// du loader "coming soon" qui a inspiré ce thème.

export default function Spinner({ size = 40, dotColor = color.ember }: { size?: number, dotColor?: string }) {
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [])

  const dots = Array.from({ length: 12 })
  const radius = size / 2
  const dotSize = size * 0.11

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size, transform: [{ rotate: spin }] }]}>
      {dots.map((_, i) => {
        const angle = (i / dots.length) * 2 * Math.PI
        const x = radius + radius * 0.72 * Math.cos(angle) - dotSize / 2
        const y = radius + radius * 0.72 * Math.sin(angle) - dotSize / 2
        const opacity = 0.15 + (i / dots.length) * 0.85
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x, top: y,
              width: dotSize, height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: dotColor,
              opacity,
            }}
          />
        )
      })}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
})
