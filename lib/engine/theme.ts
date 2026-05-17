// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Institutional Design Token System (Phase 6)
//
// Deep dark palette • Binance-gold accent • WCAG AA
// References: Binance (order book), TradingView (chart), Groww (tables)
// ═══════════════════════════════════════════════════════════════

export const THEME = {
  // ── Backgrounds (4-tier depth system) ────────────────────
  bg:           '#0A0E17',      // L0 — deepest canvas
  bgPanel:      '#111827',      // L1 — elevated panels
  bgSurface:    '#1A1F2E',      // L2 — cards, inputs
  bgHover:      '#222838',      // L3 — hover / active
  bgElevated:   '#2A3142',      // L4 — tooltips, popovers

  // ── Borders (1px, low-opacity — no heavy dividers) ───────
  border:       'rgba(255,255,255,0.04)',
  borderLight:  'rgba(255,255,255,0.07)',
  borderFocus:  'rgba(240,185,11,0.30)',

  // ── Text (4-tier hierarchy) ──────────────────────────────
  text:         '#E8ECF5',      // primary
  textSecondary:'#8891A8',      // labels, headers
  textMuted:    '#515B74',      // axis labels, hints
  textDim:      '#2D3548',      // watermarks

  // ── Semantic — Bullish / Bearish (Neon MNC-grade) ────────
  bull:         '#00E676',      // neon green
  bear:         '#FF3B69',      // neon red/pink
  bullDim:      'rgba(0,230,118,0.15)',
  bearDim:      'rgba(255,59,105,0.15)',
  bullMuted:    'rgba(0,230,118,0.07)',
  bearMuted:    'rgba(255,59,105,0.07)',
  bullGlow:     'rgba(0,230,118,0.40)',
  bearGlow:     'rgba(255,59,105,0.40)',

  // ── Primary Accent (Binance Gold) ────────────────────────
  accent:       '#F0B90B',      // active tabs, key highlights
  accentDim:    'rgba(240,185,11,0.12)',
  accentGlow:   'rgba(240,185,11,0.35)',
  accentMuted:  'rgba(240,185,11,0.06)',

  // ── Secondary Accents ────────────────────────────────────
  blue:         '#4F8EF7',      // line/area chart stroke
  blueGlow:     'rgba(79,142,247,0.35)',
  amber:        '#FFB020',
  purple:       '#A78BFA',
  magenta:      '#F472B6',

  // ── Chart-specific tokens ────────────────────────────────
  grid:         'rgba(255,255,255,0.025)',
  gridStrong:   'rgba(255,255,255,0.05)',
  crosshair:    'rgba(255,255,255,0.30)',
  crosshairBg:  '#111827',
  lastPriceLine:'rgba(240,185,11,0.55)',

  // Candle
  wickBull:     '#00E676',
  wickBear:     '#FF3B69',
  bodyBullHollow: 'transparent',
  bodyBullSolid:  '#00E676',
  bodyBearSolid:  '#FF3B69',

  // HUD / tooltips
  hud:          'rgba(10,14,23,0.96)',
  hudBorder:    'rgba(255,255,255,0.06)',

  // ── Overlays (TA zones) ──────────────────────────────────
  fvgBull:      'rgba(0,230,118,0.06)',
  fvgBear:      'rgba(255,59,105,0.06)',
  obBull:       'rgba(0,230,118,0.10)',
  obBear:       'rgba(255,59,105,0.10)',

  // ── Typography ───────────────────────────────────────────
  fontMono:     "'Roboto Mono', 'JetBrains Mono', monospace",
  fontSans:     "'Inter', 'DM Sans', -apple-system, sans-serif",
} as const

export type Theme = typeof THEME
