import { OHLCV } from '../lib/types/market'

const BASE_URL = 'https://api.massive.com'

export const fetchMassiveCandles = async (symbol: string, interval: string = '5m', limit: number = 200): Promise<OHLCV[]> => {
    const API_KEY = process.env.NEXT_PUBLIC_MASSIVE_API_KEY
    if (!API_KEY) {
        console.error('Massive API key missing')
        return []
    }

    try {
        const response = await fetch(`${BASE_URL}/v1/markets/candles?symbol=${symbol}&interval=${interval}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        })
        
        if (!response.ok) {
            throw new Error(`Massive API Error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data.candles) {
            return []
        }

        return data.candles.map((d: any) => ({
            timestamp: d.timestamp, // assuming ms
            open: parseFloat(d.open),
            high: parseFloat(d.high),
            low: parseFloat(d.low),
            close: parseFloat(d.close),
            volume: parseFloat(d.volume),
        }))
    } catch (error) {
        console.error('fetchMassiveCandles failed:', error)
        return []
    }
}
