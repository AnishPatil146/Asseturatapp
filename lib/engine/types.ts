// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Core Type Definitions
// ═══════════════════════════════════════════════════════════════

export interface OHLCV {
  timestamp: number  // unix ms
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type ChartType = 'candlestick' | 'bar' | 'line' | 'area' | 'heikinashi' | 'baseline'

export interface ChartViewport {
  xMin: number   // timestamp left edge
  xMax: number   // timestamp right edge
  yMin: number   // price bottom
  yMax: number   // price top
}

export interface CrosshairState {
  x: number
  y: number
  price: number
  timestamp: number
  candle: OHLCV | null
  visible: boolean
}

export interface IndicatorConfig {
  id: string
  type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger' | 'vwap'
  params: Record<string, number>
  color: string
  visible: boolean
  pane: 'overlay' | 'sub'  // overlay = main chart, sub = separate pane
}

export interface IndicatorResult {
  id: string
  type: string
  values: Float64Array
  extra?: Record<string, Float64Array>  // e.g. MACD signal, histogram
  timestamps: Float64Array
}

export interface OrderBookLevel {
  price: number
  qty: number
  total: number
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change24h: number
  changePct: number
  volume: string
  sparkline: number[]
  assetType: 'crypto' | 'stock' | 'forex' | 'index'
}

export interface Position {
  id: string
  symbol: string
  side: 'long' | 'short'
  qty: number
  entryPrice: number
  currentPrice: number
  unrealizedPnL: number
  realizedPnL: number
  marginUsed: number
  timestamp: number
}

export type OrderType = 'market' | 'limit' | 'stop' | 'oco'

export interface OrderRequest {
  symbol: string
  side: 'buy' | 'sell'
  type: OrderType
  qty: number
  price?: number       // for limit
  stopPrice?: number   // for stop / OCO
  limitPrice?: number  // for OCO
}
