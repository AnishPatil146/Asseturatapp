import { UnifiedAssetType, ProviderName } from '../lib/types/market'

export const detectAssetType = (symbol: string): { type: UnifiedAssetType, provider: ProviderName } => {
    const s = symbol.toUpperCase()

    // Crypto detection
    if (s.endsWith('USDT') || s.endsWith('BTC') || s.endsWith('ETH') || s.includes('BTC/') || s.includes('ETH/')) {
        return { type: 'crypto', provider: 'binance' }
    }

    // Forex detection (contains slash or exactly 6 chars of known fiat, but let's be strict)
    if (s.includes('/') && (s.includes('USD') || s.includes('EUR') || s.includes('GBP') || s.includes('JPY') || s.includes('AUD') || s.includes('CAD'))) {
        return { type: 'forex', provider: 'twelvedata' }
    }

    // Index detection
    if (['SPY', 'QQQ', 'DIA', 'VIX', 'NDX', 'SPX', 'DXY'].includes(s)) {
        return { type: 'index', provider: 'massive' }
    }

    // Default to Stock for symbols like AAPL, TSLA
    // Checking typical stock symbols (no slashes, alphabetic)
    if (/^[A-Z]{1,5}$/.test(s)) {
        return { type: 'stock', provider: 'finnhub' }
    }

    return { type: 'unknown', provider: 'unknown' }
}

export const needsNewsProvider = (type: UnifiedAssetType): boolean => {
    return true // All assets can benefit from news
}
