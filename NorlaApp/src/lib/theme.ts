// ── Norla Design System v3 — Google/Apple-level minimal ─────────
// Philosophy: Content IS the design. Zero decoration. Typography does everything.

export const COLORS = {
  // ── Primary text ──
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textQuaternary: '#BBBBBB',

  // ── Brand (used very sparingly — only active states) ──
  brand: '#10B981',
  brandDark: '#059669',
  brandBg: '#F0FDF4',

  // ── Surfaces ──
  white: '#FFFFFF',
  bg: '#FFFFFF',
  bgSecondary: '#FAFAFA',

  // ── Borders — hairline only ──
  hairline: '#F0F0F0',
  border: '#E8E8E8',

  // ── Semantic ──
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
  blue: '#3B82F6',

  // ── Score colors ──
  scoreHigh: '#22C55E',
  scoreMedium: '#EAB308',
  scoreLow: '#F97316',
  scoreCritical: '#EF4444',
};

export const TYPE = {
  // Display — for page titles
  display: { fontSize: 32, fontWeight: '700' as const, color: COLORS.text, letterSpacing: -0.8 },
  // Title — for section headings
  title: { fontSize: 20, fontWeight: '600' as const, color: COLORS.text, letterSpacing: -0.4 },
  // Heading — for card titles
  heading: { fontSize: 16, fontWeight: '600' as const, color: COLORS.text },
  // Body
  body: { fontSize: 15, fontWeight: '400' as const, color: COLORS.text, lineHeight: 22 },
  // Caption
  caption: { fontSize: 13, fontWeight: '400' as const, color: COLORS.textSecondary },
  // Micro
  micro: { fontSize: 11, fontWeight: '500' as const, color: COLORS.textTertiary },
  // Stat number
  stat: { fontSize: 28, fontWeight: '700' as const, color: COLORS.text, letterSpacing: -0.5 },
  // Table value
  value: { fontSize: 15, fontWeight: '600' as const, color: COLORS.text },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const RADIUS = { sm: 8, md: 12, lg: 16, full: 9999 };
