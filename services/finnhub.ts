import { OHLCV } from '../lib/types/market'

const BASE_URL = 'https://finnhub.io/api/v1'

export const fetchFinnhubCandles = async (symbol: string, resolution: string = '5', count: number = 200): Promise<OHLCV[]> => {
    const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
    if (!API_KEY) {
        console.error('Finnhub API key missing')
        return []
    }

    const to = Math.floor(Date.now() / 1000)
    // rough estimation for `from` based on resolution and count
    const resMap: Record<string, number> = {
        '1': 60, '5': 300, '15': 900, '30': 1800, '60': 3600, 'D': 86400, 'W': 604800, 'M': 2592000
    }
    const step = resMap[resolution] || 300
    const from = to - (step * count)

    try {
        const response = await fetch(`${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${API_KEY}`)
        
        if (!response.ok) {
            throw new Error(`Finnhub API Error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.s !== 'ok') {
            return []
        }

        const candles: OHLCV[] = []
        for (let i = 0; i < data.t.length; i++) {
            candles.push({
                timestamp: data.t[i] * 1000,
                open: data.o[i],
                high: data.h[i],
                low: data.l[i],
                close: data.c[i],
                volume: data.v[i],
            })
        }
        return candles
    } catch (error) {
        console.error('fetchFinnhubCandles failed:', error)
        return []
    }
}
