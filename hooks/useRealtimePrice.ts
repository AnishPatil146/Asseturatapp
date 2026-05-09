import { useMarketEngineStore } from '../lib/store/useMarketEngineStore'

export const useRealtimePrice = () => {
    const candles = useMarketEngineStore(state => state.candles)
    const selectedSymbol = useMarketEngineStore(state => state.selectedSymbol)
    
    if (candles.length === 0) return { price: 0, change: 0, changePercent: 0, symbol: selectedSymbol }

    const latest = candles[candles.length - 1]
    const previous = candles.length > 1 ? candles[candles.length - 2] : latest

    const price = latest.close
    const change = price - previous.close
    const changePercent = previous.close !== 0 ? (change / previous.close) * 100 : 0

    return {
        symbol: selectedSymbol,
        price,
        change,
        changePercent,
        high: latest.high,
        low: latest.low,
        volume: latest.volume
    }
}
