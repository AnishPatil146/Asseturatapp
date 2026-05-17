// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Unified Global Store (Zustand)
// Single source of truth synchronizing Chart, OrderBook,
// TradePanel, and Watchlist across the entire dashboard
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand'
import type {
  OHLCV, ChartType, IndicatorConfig, IndicatorResult,
  OrderBookLevel, WatchlistItem, Position, ChartViewport,
} from '../engine/types'
import { computeIndicators, type TAInput, type TAResult } from '../engine/indicators'

// ── Maximum candles in memory (circular buffer behavior) ────
const MAX_CANDLES = 2000

export type AssetType = 'CRYPTO' | 'STOCKS' | 'FOREX' | 'OPTIONS'

export interface AssetInfo {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  high24h: number
  low24h: number
  volume: string
}

interface TradingStore {
  // ── Symbol & Asset Selection ─────────────────────────────
  activeAsset: AssetType
  selectedSymbol: string
  assets: Record<AssetType, AssetInfo>
  setActiveAsset: (asset: AssetType) => void
  setSelectedSymbol: (symbol: string) => void

  // ── Chart State ──────────────────────────────────────────
  chartType: ChartType
  setChartType: (type: ChartType) => void
  timeframe: string
  setTimeframe: (tf: string) => void

  // ── OHLCV Data ───────────────────────────────────────────
  candles: OHLCV[]
  setCandles: (candles: OHLCV[]) => void
  mergeCandle: (candle: OHLCV) => void
  clearCandles: () => void

  // ── Indicators ───────────────────────────────────────────
  indicatorConfigs: IndicatorConfig[]
  indicatorResults: TAResult[]
  addIndicator: (config: IndicatorConfig) => void
  removeIndicator: (id: string) => void
  toggleIndicator: (id: string) => void
  recalculateIndicators: () => void

  // ── Order Book ───────────────────────────────────────────
  asks: OrderBookLevel[]
  bids: OrderBookLevel[]
  setOrderBook: (asks: OrderBookLevel[], bids: OrderBookLevel[]) => void

  // ── Watchlist ────────────────────────────────────────────
  watchlist: WatchlistItem[]
  setWatchlist: (items: WatchlistItem[]) => void
  updateWatchlistPrice: (symbol: string, price: number, change: number) => void

  // ── Positions ────────────────────────────────────────────
  positions: Position[]
  setPositions: (positions: Position[]) => void

  // ── Connection Status ────────────────────────────────────
  wsStatus: 'disconnected' | 'connecting' | 'live' | 'simulated'
  setWsStatus: (status: 'disconnected' | 'connecting' | 'live' | 'simulated') => void

  // ── Market open ──────────────────────────────────────────
  isMarketOpen: boolean
  setMarketOpen: (open: boolean) => void
}

export const useTradingStore = create<TradingStore>((set, get) => ({
  // ── Symbol & Asset ───────────────────────────────────────
  activeAsset: 'CRYPTO',
  selectedSymbol: 'BTCUSDT',
  assets: {
    CRYPTO: {
      symbol: 'BTC/USDT', name: 'Bitcoin',
      price: 67420.50, change: 1247.32, changePct: 2.34,
      high24h: 69110.00, low24h: 65880.00, volume: '2.41B',
    },
    STOCKS: {
      symbol: 'AAPL/USD', name: 'Apple Inc.',
      price: 189.45, change: -1.67, changePct: -0.87,
      high24h: 192.30, low24h: 187.10, volume: '48.2M',
    },
    FOREX: {
      symbol: 'EUR/USD', name: 'Euro / Dollar',
      price: 1.0842, change: 0.0013, changePct: 0.12,
      high24h: 1.0891, low24h: 1.0798, volume: '3.2T',
    },
    OPTIONS: {
      symbol: 'SPX 4800C', name: 'S&P 500 Call',
      price: 142.50, change: 7.60, changePct: 5.60,
      high24h: 155.00, low24h: 135.20, volume: '12.4K',
    },
  },

  setActiveAsset: (asset) => set({ activeAsset: asset }),
  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  // ── Chart ────────────────────────────────────────────────
  chartType: 'candlestick',
  setChartType: (type) => set({ chartType: type }),
  timeframe: '5m',
  setTimeframe: (tf) => set({ timeframe: tf }),

  // ── OHLCV (with circular buffer management) ──────────────
  candles: [],
  setCandles: (candles) => {
    const trimmed = candles.length > MAX_CANDLES
      ? candles.slice(-MAX_CANDLES)
      : candles
    set({ candles: trimmed })
    // Auto-recalculate indicators when candles change
    setTimeout(() => get().recalculateIndicators(), 0)
  },
  mergeCandle: (candle) => set((state) => {
    if (state.candles.length === 0) return { candles: [candle] }
    const last = state.candles[state.candles.length - 1]

    if (last.timestamp === candle.timestamp) {
      // Update existing candle
      const updated = [...state.candles]
      updated[updated.length - 1] = {
        ...last,
        high: Math.max(last.high, candle.close, candle.high),
        low: Math.min(last.low, candle.close, candle.low),
        close: candle.close,
        volume: last.volume + candle.volume * 0.05,
      }
      return { candles: updated }
    } else if (candle.timestamp > last.timestamp) {
      // New candle — enforce circular buffer
      const next = [...state.candles, candle]
      return { candles: next.length > MAX_CANDLES ? next.slice(-MAX_CANDLES) : next }
    }
    return state
  }),
  clearCandles: () => set({ candles: [], indicatorResults: [] }),

  // ── Indicators ───────────────────────────────────────────
  indicatorConfigs: [
    { id: 'ema-20', type: 'ema', params: { period: 20 }, color: '#F5A623', visible: true, pane: 'overlay' },
    { id: 'ema-50', type: 'ema', params: { period: 50 }, color: '#8B5CF6', visible: true, pane: 'overlay' },
  ],
  indicatorResults: [],
  addIndicator: (config) => set((s) => ({
    indicatorConfigs: [...s.indicatorConfigs, config],
  })),
  removeIndicator: (id) => set((s) => ({
    indicatorConfigs: s.indicatorConfigs.filter(c => c.id !== id),
    indicatorResults: s.indicatorResults.filter(r => r.id !== id),
  })),
  toggleIndicator: (id) => set((s) => ({
    indicatorConfigs: s.indicatorConfigs.map(c =>
      c.id === id ? { ...c, visible: !c.visible } : c
    ),
  })),
  recalculateIndicators: () => {
    const state = get()
    if (state.candles.length < 2) return

    const input: TAInput = {
      timestamps: state.candles.map(c => c.timestamp),
      open: state.candles.map(c => c.open),
      high: state.candles.map(c => c.high),
      low: state.candles.map(c => c.low),
      close: state.candles.map(c => c.close),
      volume: state.candles.map(c => c.volume),
    }

    const results = computeIndicators(
      input,
      state.indicatorConfigs.filter(c => c.visible).map(c => ({
        id: c.id,
        type: c.type,
        params: c.params,
      })),
    )
    set({ indicatorResults: results })
  },

  // ── Order Book ───────────────────────────────────────────
  asks: [],
  bids: [],
  setOrderBook: (asks, bids) => set({ asks, bids }),

  // ── Watchlist ────────────────────────────────────────────
  watchlist: [],
  setWatchlist: (items) => set({ watchlist: items }),
  updateWatchlistPrice: (symbol, price, change) => set((s) => ({
    watchlist: s.watchlist.map(w =>
      w.symbol === symbol ? { ...w, price, changePct: change } : w
    ),
  })),

  // ── Positions ────────────────────────────────────────────
  positions: [],
  setPositions: (positions) => set({ positions }),

  // ── Connection ───────────────────────────────────────────
  wsStatus: 'disconnected',
  setWsStatus: (status) => set({ wsStatus: status }),

  // ── Market ───────────────────────────────────────────────
  isMarketOpen: true,
  setMarketOpen: (open) => set({ isMarketOpen: open }),
}))

// Keep old store export for backward compatibility
export const useMarketStore = useTradingStore
