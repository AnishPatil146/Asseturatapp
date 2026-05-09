export type ProviderName = 'binance' | 'finnhub' | 'twelvedata' | 'massive' | 'newsapi' | 'unknown'

export type UnifiedAssetType = 'crypto' | 'stock' | 'forex' | 'index' | 'unknown'

export interface OHLCV {
    timestamp: number // unix timestamp in ms
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export interface MarketState {
    symbol: string
    type: UnifiedAssetType
    provider: ProviderName
    price: number
    changePercent: number
    volume: number
    candles: OHLCV[]
    indicators: Record<string, any>
    timestamp: number
}

export interface NewsArticle {
    title: string
    url: string
    source: string
    publishedAt: string
    summary: string
    sentiment?: number
}
