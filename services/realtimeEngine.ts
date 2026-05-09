import { fetchBinanceCandles } from './binance'
import { fetchFinnhubCandles } from './finnhub'
import { fetchTwelveDataCandles } from './twelveData'
import { fetchMassiveCandles } from './massive'
import { detectAssetType } from './providerRouter'
import { wsManager } from './websocketManager'
import { useMarketEngineStore } from '../lib/store/useMarketEngineStore'

// A ref-like mechanism to avoid race conditions. 
// If fetch is requested multiple times, only the latest request ID should apply its data.
let currentRequestId = 0

export const initializeMarketData = async (symbol: string) => {
    const requestId = ++currentRequestId
    
    const store = useMarketEngineStore.getState()
    store.setLoading(true)
    
    // 1. Strict cleanup of old connections
    wsManager.disconnect()
    
    const { type, provider } = detectAssetType(symbol)
    store.setSymbolInfo(symbol, type, provider)
    
    console.log({
        action: 'initializeMarketData',
        selectedSymbol: symbol,
        assetType: type,
        provider: provider
    })

    try {
        let historicalCandles: any[] = []

        // 2. Fetch Historical Data based on Provider
        if (provider === 'binance') {
            historicalCandles = await fetchBinanceCandles(symbol)
        } else if (provider === 'finnhub') {
            historicalCandles = await fetchFinnhubCandles(symbol)
        } else if (provider === 'twelvedata') {
            historicalCandles = await fetchTwelveDataCandles(symbol)
        } else if (provider === 'massive') {
            historicalCandles = await fetchMassiveCandles(symbol)
        } else {
            console.warn(`No provider logic implemented for: ${provider}`)
            historicalCandles = []
        }

        // 3. Race condition protection: Ignore if a newer request came in
        if (requestId !== currentRequestId) return

        store.setCandles(historicalCandles)

        // 4. Initialize WebSocket for Live Updates
        if (provider === 'binance' || provider === 'finnhub') {
            wsManager.connect(symbol, provider, (candle) => {
                // strict check inside store update
                if (useMarketEngineStore.getState().selectedSymbol === symbol) {
                    useMarketEngineStore.getState().updateRealtimeCandle({
                        timestamp: candle.time,
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: candle.volume,
                    })
                }
            })
        }
    } catch (error) {
        if (requestId !== currentRequestId) return
        console.error('Market initialization failed:', error)
        store.setLoading(false)
    }
}
