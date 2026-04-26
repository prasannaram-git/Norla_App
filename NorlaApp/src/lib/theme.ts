// ── Norla Design System v4 — Dark/Light Theme ─────────
// Philosophy: Content IS the design. Zero decoration. Typography does everything.

export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  // ── Primary text ──
  text: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;

  // ── Brand ──
  brand: string;
  brandDark: string;
  brandBg: string;

  // ── Surfaces ──
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  cardBg: string;

  // ── Borders ──
  hairline: string;
  border: string;

  // ── Semantic ──
  success: string;
  warning: string;
  error: string;
  blue: string;

  // ── Score ──
  scoreHigh: string;
  scoreMedium: string;
  scoreLow: string;
  scoreCritical: string;

  // ── Inverted (for buttons etc.) ──
  invertedText: string;
  invertedBg: string;
}

export const LIGHT_COLORS: ColorPalette = {
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textQuaternary: '#BBBBBB',

  brand: '#10B981',
  brandDark: '#059669',
  brandBg: '#F0FDF4',

  bg: '#FFFFFF',
  bgSecondary: '#FAFAFA',
  bgTertiary: '#F5F5F5',
  cardBg: '#FAFAFA',

  hairline: '#F0F0F0',
  border: '#E8E8E8',

  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  blue: '#3B82F6',

  scoreHigh: '#22C55E',
  scoreMedium: '#EAB308',
  scoreLow: '#F97316',
  scoreCritical: '#EF4444',

  invertedText: '#FFFFFF',
  invertedBg: '#1A1A1A',
};

export const DARK_COLORS: ColorPalette = {
  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textTertiary: '#6B6B6B',
  textQuaternary: '#4A4A4A',

  brand: '#34D399',
  brandDark: '#10B981',
  brandBg: '#0D2818',

  bg: '#0A0A0A',
  bgSecondary: '#141414',
  bgTertiary: '#1E1E1E',
  cardBg: '#141414',

  hairline: '#1E1E1E',
  border: '#2A2A2A',

  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  blue: '#3B82F6',

  scoreHigh: '#22C55E',
  scoreMedium: '#EAB308',
  scoreLow: '#F97316',
  scoreCritical: '#EF4444',

  invertedText: '#1A1A1A',
  invertedBg: '#F5F5F5',
};

// Legacy static reference (used by screens not yet migrated)
export const COLORS = LIGHT_COLORS;

export const TYPE = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8 },
  title: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.4 },
  heading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 11, fontWeight: '500' as const },
  stat: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  value: { fontSize: 15, fontWeight: '600' as const },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, full: 9999 };
