'use client'

import { useTradingStore } from '@/lib/store/useTradingStore'
import StockDetailModal from './StockDetailModel'

export default function GlobalModals() {
  const { selectedStock, setSelectedStock } = useTradingStore()

  if (!selectedStock) return null

  return (
    <StockDetailModal
      symbol={selectedStock.symbol}
      name={selectedStock.name}
      price={selectedStock.price}
      change={selectedStock.change}
      color={selectedStock.color}
      onClose={() => setSelectedStock(null)}
    />
  )
}
