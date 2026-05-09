import { create } from 'zustand'
import { OHLCV, UnifiedAssetType, ProviderName } from '../types/market'

interface MarketEngineState {
    selectedSymbol: string
    assetType: UnifiedAssetType
    provider: ProviderName
    websocketProvider: ProviderName | null
    candles: OHLCV[]
    indicators: Record<string, any>
    websocketStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
    loadingState: boolean

    // Actions
    setSymbolInfo: (symbol: string, type: UnifiedAssetType, provider: ProviderName) => void
    setCandles: (candles: OHLCV[]) => void
    updateRealtimeCandle: (candle: OHLCV) => void
    setWebsocketStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error', provider: ProviderName | null) => void
    setLoading: (loading: boolean) => void
    setIndicators: (indicators: Record<string, any>) => void
    clearMarketData: () => void
}

export const useMarketEngineStore = create<MarketEngineState>((set) => ({
    selectedSymbol: 'BTCUSDT',
    assetType: 'crypto',
    provider: 'binance',
    websocketProvider: null,
    candles: [],
    indicators: {},
    websocketStatus: 'disconnected',
    loadingState: true,

    setSymbolInfo: (symbol, type, provider) => set({ 
        selectedSymbol: symbol, 
        assetType: type, 
        provider: provider 
    }),

    setCandles: (candles) => set({ candles, loadingState: false }),

    updateRealtimeCandle: (candle) => set((state) => {
        if (state.candles.length === 0) return { candles: [candle] }

        const lastCandle = state.candles[state.candles.length - 1]
        // If the new candle is in the same timeframe, update it
        // Depending on timeframe, we'll assume here if the timestamp is the same or very close
        if (candle.timestamp === lastCandle.timestamp) {
            const newCandles = [...state.candles]
            newCandles[newCandles.length - 1] = candle
            return { candles: newCandles }
        } else if (candle.timestamp > lastCandle.timestamp) {
            // New candle added
            return { candles: [...state.candles, candle] }
        }
        return state
    }),

    setWebsocketStatus: (status, provider) => set({ websocketStatus: status, websocketProvider: provider }),

    setLoading: (loading) => set({ loadingState: loading }),

    setIndicators: (indicators) => set({ indicators }),

    clearMarketData: () => set({
        candles: [],
        indicators: {},
        loadingState: true
    })
}))
