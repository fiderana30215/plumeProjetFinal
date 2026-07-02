import { Platform } from 'react-native'

// ── Plume Relais · thème "Encre de minuit" ──────────────────────────────
// Fond presque noir à chaud, grain de papier ancien, liseré doré comme
// une plume trempée dans l'encre. Inspiré des écrans "coming soon"
// sombres et texturés : bordures fines, typographie italique, calme.

export const color = {
  void: '#0A0908',          // fond général
  surface: '#151310',       // cartes, champs
  surfaceRaised: '#1C1912', // éléments surélevés (tabs actifs, modales)
  border: 'rgba(233,224,205,0.12)',
  borderStrong: 'rgba(233,224,205,0.24)',
  ink: '#F2EBDD',           // texte principal, parchemin chaud
  muted: '#9C9284',         // texte secondaire
  faint: '#655D51',         // texte tertiaire / placeholders

  ember: '#D4B15A',         // accent doré — la plume, l'encre qui brille
  emberDim: 'rgba(212,177,90,0.14)',
  emberBorder: 'rgba(212,177,90,0.35)',

  success: '#7CB893',
  successDim: 'rgba(124,184,147,0.14)',
  warning: '#CC9257',
  warningDim: 'rgba(204,146,87,0.14)',
  danger: '#C06B62',
  dangerDim: 'rgba(192,107,98,0.14)',
}

export const font = {
  display: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  displayItalic: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
}

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
}

// Styles partagés réutilisés tels quels dans plusieurs écrans
export const shared = {
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

export function statusLabel(status: string) {
  if (status === 'open') return { text: 'Ouvert', color: color.success, dim: color.successDim }
  if (status === 'in_progress') return { text: 'En cours', color: color.warning, dim: color.warningDim }
  return { text: 'Terminé', color: color.muted, dim: 'rgba(156,146,132,0.14)' }
}
