// Re-export from unified trading store for backward compatibility
export { useTradingStore as useMarketStore } from './useTradingStore'
export type { AssetType, AssetInfo } from './useTradingStore'

// Keep the Asset interface for backward compat
export type Asset = {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  high24h: number
  low24h: number
  volume: string
}