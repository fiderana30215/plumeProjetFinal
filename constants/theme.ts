import { Platform } from 'react-native'

// ── Plume Relais · thème "Encre de minuit" ──────────────────────────────
// Deux palettes : sombre (par défaut, fond quasi noir + grain + doré) et
// claire (parchemin chaud + même accent doré, pour qui préfère lire de jour).

export type ThemeMode = 'dark' | 'light'

export interface ColorTokens {
  void: string
  surface: string
  surfaceRaised: string
  border: string
  borderStrong: string
  ink: string
  muted: string
  faint: string
  ember: string
  emberDim: string
  emberBorder: string
  success: string
  successDim: string
  warning: string
  warningDim: string
  danger: string
  dangerDim: string
}

export const darkColors: ColorTokens = {
  void: '#0A0908',
  surface: '#151310',
  surfaceRaised: '#1C1912',
  border: 'rgba(233,224,205,0.12)',
  borderStrong: 'rgba(233,224,205,0.24)',
  ink: '#F2EBDD',
  muted: '#9C9284',
  faint: '#655D51',
  ember: '#D4B15A',
  emberDim: 'rgba(212,177,90,0.14)',
  emberBorder: 'rgba(212,177,90,0.35)',
  success: '#7CB893',
  successDim: 'rgba(124,184,147,0.14)',
  warning: '#CC9257',
  warningDim: 'rgba(204,146,87,0.14)',
  danger: '#C06B62',
  dangerDim: 'rgba(192,107,98,0.14)',
}

export const lightColors: ColorTokens = {
  void: '#F5F0E6',
  surface: '#FFFFFF',
  surfaceRaised: '#F0E9D8',
  border: 'rgba(60,50,30,0.12)',
  borderStrong: 'rgba(60,50,30,0.24)',
  ink: '#2A2418',
  muted: '#71675A',
  faint: '#A69C8C',
  ember: '#A97D24',
  emberDim: 'rgba(169,125,36,0.12)',
  emberBorder: 'rgba(169,125,36,0.35)',
  success: '#3E8B65',
  successDim: 'rgba(62,139,101,0.12)',
  warning: '#A6641F',
  warningDim: 'rgba(166,100,31,0.12)',
  danger: '#A83E33',
  dangerDim: 'rgba(168,62,51,0.12)',
}

export const font = {
  display: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  displayItalic: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
}

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 }
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

// Styles partagés, dérivés dynamiquement d'une palette (voir useTheme()).
export function getShared(color: ColorTokens) {
  return {
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: color.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.2,
    },
    card: {
      backgroundColor: color.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: color.border,
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: color.border,
      borderRadius: radius.md,
      paddingHorizontal: 16,
      fontSize: 16,
      color: color.ink,
      backgroundColor: color.surface,
    },
    btnPrimary: {
      height: 52,
      backgroundColor: color.ember,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    btnPrimaryText: {
      color: color.void,
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
    },
  }
}

export function statusLabel(status: string, color: ColorTokens) {
  if (status === 'open') return { text: 'open', color: color.success, dim: color.successDim }
  if (status === 'in_progress') return { text: 'in_progress', color: color.warning, dim: color.warningDim }
  return { text: 'finished', color: color.muted, dim: 'rgba(156,146,132,0.14)' }
}
