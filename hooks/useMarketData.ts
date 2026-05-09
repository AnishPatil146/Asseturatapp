import { useEffect } from 'react'
import { useMarketEngineStore } from '../lib/store/useMarketEngineStore'
import { initializeMarketData } from '../services/realtimeEngine'

export const useMarketData = (symbol: string) => {
    const { 
        selectedSymbol, 
        candles, 
        loadingState, 
        assetType, 
        provider, 
        websocketStatus 
    } = useMarketEngineStore()

    useEffect(() => {
        if (symbol && symbol !== selectedSymbol) {
            initializeMarketData(symbol)
        } else if (symbol && candles.length === 0 && !loadingState) {
            // initial load case if not already loaded
            initializeMarketData(symbol)
        }
    }, [symbol, selectedSymbol, candles.length, loadingState])

    // Mount logic if no symbol provided
    useEffect(() => {
        if (!symbol && selectedSymbol && candles.length === 0) {
            initializeMarketData(selectedSymbol)
        }
    }, [symbol, selectedSymbol, candles.length])

    return {
        symbol: selectedSymbol,
        candles,
        isLoading: loadingState,
        assetType,
        provider,
        websocketStatus
    }
}
