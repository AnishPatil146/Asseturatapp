import { OHLCV } from '../lib/types/market'

const BASE_URL = 'https://api.binance.com/api/v3'

export const fetchBinanceCandles = async (symbol: string, interval: string = '5m', limit: number = 200): Promise<OHLCV[]> => {
    // Binance format is just the raw symbol like BTCUSDT
    const formattedSymbol = symbol.replace('/', '').toUpperCase()
    
    try {
        const response = await fetch(`${BASE_URL}/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`)
        
        if (!response.ok) {
            throw new Error(`Binance API Error: ${response.statusText}`)
        }

        const data = await response.json()
        
        // Binance kline format:
        // [ Open time, Open, High, Low, Close, Volume, Close time, Quote asset volume, Number of trades, Taker buy base asset volume, Taker buy quote asset volume, Ignore ]
        return data.map((d: any) => ({
            timestamp: d[0],
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
            volume: parseFloat(d[5]),
        }))
    } catch (error) {
        console.error('fetchBinanceCandles failed:', error)
        return []
    }
}
