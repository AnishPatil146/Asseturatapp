import { create } from 'zustand'

export type AssetType = 'CRYPTO' | 'STOCKS' | 'FOREX' | 'OPTIONS'

export interface Asset {
    symbol: string
    name: string
    price: number
    change: number
    changePct: number
    high24h: number
    low24h: number
    volume: string
}

interface MarketState {
    activeAsset: AssetType
    assets: Record<AssetType, Asset>
    isMarketOpen: boolean
    setActiveAsset: (asset: AssetType) => void
    updatePrice: (type: AssetType, price: number) => void
    setMarketOpen: (open: boolean) => void
}

export const useMarketStore = create<MarketState>((set) => ({
    activeAsset: 'CRYPTO',
    isMarketOpen: true,

    assets: {
        CRYPTO: {
            symbol: 'BTC/USDT', name: 'Bitcoin',
            price: 67420.50, change: 1247.32, changePct: 2.34,
            high24h: 69110.00, low24h: 65880.00, volume: '2.41B',
        },
        STOCKS: {
            symbol: 'AAPL/USD', name: 'Apple Inc.',
            price: 189.45, change: -1.67, changePct: -0.87,
            high24h: 192.30, low24h: 187.10, volume: '48.2M',
        },
        FOREX: {
            symbol: 'EUR/USD', name: 'Euro / Dollar',
            price: 1.0842, change: 0.0013, changePct: 0.12,
            high24h: 1.0891, low24h: 1.0798, volume: '3.2T',
        },
        OPTIONS: {
            symbol: 'SPX 4800C', name: 'S&P 500 Call',
            price: 142.50, change: 7.60, changePct: 5.60,
            high24h: 155.00, low24h: 135.20, volume: '12.4K',
        },
    },

    setActiveAsset: (asset) => set({ activeAsset: asset }),
    setMarketOpen: (open) => set({ isMarketOpen: open }),

    updatePrice: (type, price) =>
        set((state) => ({
            assets: {
                ...state.assets,
                [type]: { ...state.assets[type], price },
            },
        })),
}))