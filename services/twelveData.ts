import { OHLCV } from '../lib/types/market'

const BASE_URL = 'https://api.twelvedata.com'

export const fetchTwelveDataCandles = async (symbol: string, interval: string = '5min', outputsize: number = 200): Promise<OHLCV[]> => {
    const API_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY
    if (!API_KEY) {
        console.error('TwelveData API key missing')
        return []
    }

    try {
        const response = await fetch(`${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`)
        
        if (!response.ok) {
            throw new Error(`TwelveData API Error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.status !== 'ok') {
            return []
        }

        const candles: OHLCV[] = data.values.map((d: any) => ({
            // TwelveData returns timestamps as string 'YYYY-MM-DD HH:MM:SS'
            timestamp: new Date(d.datetime).getTime(),
            open: parseFloat(d.open),
            high: parseFloat(d.high),
            low: parseFloat(d.low),
            close: parseFloat(d.close),
            volume: parseFloat(d.volume),
        }))

        // TwelveData returns newest first, so we reverse to have oldest first
        return candles.reverse()
    } catch (error) {
        console.error('fetchTwelveDataCandles failed:', error)
        return []
    }
}
