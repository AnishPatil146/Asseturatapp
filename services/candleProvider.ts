export interface NormalizedCandle {
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

export type Provider = 'binance' | 'mock'

export interface SymbolConfig {
    symbol: string
    provider: Provider
    basePrice: number
    label: string
}

export const SYMBOL_CONFIG: Record<string, SymbolConfig> = {
    CRYPTO: {
        symbol: 'BTCUSDT',
        provider: 'binance',
        basePrice: 67000,
        label: 'BTC/USDT',
    },
    STOCKS: {
        symbol: 'AAPL',
        provider: 'mock',
        basePrice: 189,
        label: 'AAPL',
    },
    FOREX: {
        symbol: 'EUR/USD',
        provider: 'mock',
        basePrice: 1.0842,
        label: 'EUR/USD',
    },
    OPTIONS: {
        symbol: 'SPX',
        provider: 'mock',
        basePrice: 5612,
        label: 'SPX',
    },
}

export function generateCandles(
    basePrice: number,
    count: number = 200,
    barMs: number = 5 * 60 * 1000
): NormalizedCandle[] {
    const candles: NormalizedCandle[] = []
    let price = basePrice
    const now = Date.now()

    for (let i = count - 1; i >= 0; i--) {
        const time = Math.floor((now - i * barMs) / barMs) * barMs
        const open = price
        const vol = price * (0.002 + Math.random() * 0.005)
        const dir = Math.random() > 0.47 ? 1 : -1
        const close = open + dir * vol * (0.3 + Math.random() * 0.7)
        const high = Math.max(open, close) + vol * Math.random() * 0.4
        const low = Math.min(open, close) - vol * Math.random() * 0.4

        candles.push({
            time,
            open,
            high,
            low,
            close,
            volume: 80 + Math.random() * 720,
        })
        price = close
    }
    return candles
}

export function mergeCandle(
    candles: NormalizedCandle[],
    update: NormalizedCandle
): NormalizedCandle[] {
    if (candles.length === 0) return [update]
    const last = candles[candles.length - 1]

    if (last.time === update.time) {
        const updated = [...candles]
        updated[updated.length - 1] = {
            ...last,
            high: Math.max(last.high, update.close),
            low: Math.min(last.low, update.close),
            close: update.close,
            volume: last.volume + update.volume * 0.05,
        }
        return updated
    }

    if (update.time > last.time) {
        return [...candles.slice(-299), update]
    }

    return candles
}