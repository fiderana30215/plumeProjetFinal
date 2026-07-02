import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { darkColors, lightColors, getShared, ColorTokens, ThemeMode } from '../constants/theme'

const STORAGE_KEY = 'plume_theme_mode'

interface ThemeContextValue {
  mode: ThemeMode
  color: ColorTokens
  shared: ReturnType<typeof getShared>
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setModeState(saved)
    })
  }, [])

  function setMode(next: ThemeMode) {
    setModeState(next)
    AsyncStorage.setItem(STORAGE_KEY, next)
  }

  function toggleTheme() {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }

  const color = mode === 'dark' ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ mode, color, shared: getShared(color), toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
