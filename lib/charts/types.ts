// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/charts/types.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface OHLCV {
    t: number   // unix timestamp in milliseconds
    o: number   // open
    h: number   // high
    l: number   // low
    c: number   // close
    v: number   // volume
}

export type ChartType = 'candle' | 'line' | 'area' | 'bar'

export type Timeframe = '1min' | '5min' | '15min' | '30min' | '1h' | '4h' | '1day'

export const TIMEFRAME_MS: Record<Timeframe, number> = {
    '1min': 60_000,
    '5min': 300_000,
    '15min': 900_000,
    '30min': 1_800_000,
    '1h': 3_600_000,
    '4h': 14_400_000,
    '1day': 86_400_000,
}

export interface ChartTheme {
    bg: string
    bg2: string
    bg3: string
    bg4: string
    border: string
    border2: string
    green: string
    green2: string
    red: string
    red2: string
    text: string
    muted: string
    dimmed: string
}

export const ASSETURA_THEME: ChartTheme = {
    bg: '#08090d',
    bg2: '#0e1117',
    bg3: '#141720',
    bg4: '#1a1e2a',
    border: '#1e2333',
    border2: '#252b3d',
    green: '#00d4a0',
    green2: '#00a87e',
    red: '#ff4d6a',
    red2: '#cc3d55',
    text: '#e2e8f0',
    muted: '#64748b',
    dimmed: '#334155',
}

export interface ChartPadding {
    top: number
    right: number
    bottom: number
    left: number
}

export const DEFAULT_PADDING: ChartPadding = { top: 20, right: 20, bottom: 36, left: 68 }

export interface ChartOptions {
    type: ChartType
    theme?: ChartTheme
    padding?: Partial<ChartPadding>
    gridLines?: number
    showVolumeBars?: boolean
    volumeHeightRatio?: number
    font?: string
    monoFont?: string
    timeFormat?: (ts: number, data: OHLCV[]) => string
    priceFormat?: (p: number) => string
}