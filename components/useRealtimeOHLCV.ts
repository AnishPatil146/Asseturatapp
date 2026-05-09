'use client'
// ─────────────────────────────────────────────────────────────────────────────
// FILE: components/useRealtimeOHLCV.ts
// Fetches historical OHLCV from TwelveData, then subscribes to Finnhub
// WebSocket trades and updates the current candle (or opens a new one)
// based on the selected timeframe interval.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import type { OHLCV, Timeframe } from '@/lib/charts'
import { TIMEFRAME_MS } from '@/lib/charts'
import { fetchHistoricalOHLCV } from '@/lib/twelvedata'
import { subscribeTrades } from '@/lib/finhub-ws'
import type { TradeEvent } from '@/lib/finhub-ws'

export type FeedStatus = 'idle' | 'loading' | 'live' | 'error' | 'reconnecting'

export interface UseRealtimeOHLCVReturn {
    data: OHLCV[]
    status: FeedStatus
    error: string | null
    livePrice: number | null
    /** Call to manually refresh historical data */
    refresh: () => void
}

export function useRealtimeOHLCV(
    symbol: string,
    timeframe: Timeframe,
    outputsize = 120,
): UseRealtimeOHLCVReturn {
    const [data, setData] = useState<OHLCV[]>([])
    const [status, setStatus] = useState<FeedStatus>('idle')
    const [error, setError] = useState<string | null>(null)
    const [livePrice, setLivePrice] = useState<number | null>(null)

    // Keep a ref to data so the trade handler always sees fresh state
    // without needing to be recreated on every render
    const dataRef = useRef<OHLCV[]>([])
    dataRef.current = data

    const loadHistory = useCallback(async () => {
        setStatus('loading')
        setError(null)
        try {
            const candles = await fetchHistoricalOHLCV(symbol, timeframe, outputsize)
            setData(candles)
            dataRef.current = candles
            setStatus('live')
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load chart data'
            setError(msg)
            setStatus('error')
        }
    }, [symbol, timeframe, outputsize])

    // Load history whenever symbol or timeframe changes
    useEffect(() => {
        setData([])
        setLivePrice(null)
        loadHistory()
    }, [loadHistory])

    // Subscribe to live trades once we have historical data
    useEffect(() => {
        if (status !== 'live' && status !== 'reconnecting') return

        const unsubscribe = subscribeTrades(symbol, (trade: TradeEvent) => {
            setLivePrice(trade.price)

            setData(prev => {
                if (prev.length === 0) return prev

                const last = prev[prev.length - 1]
                const ms = TIMEFRAME_MS[timeframe]

                // Which candle interval does this trade belong to?
                const candleStart = Math.floor(trade.timestamp / ms) * ms

                if (candleStart === last.t) {
                    // Update current candle
                    const updated: OHLCV = {
                        t: last.t,
                        o: last.o,
                        h: Math.max(last.h, trade.price),
                        l: Math.min(last.l, trade.price),
                        c: trade.price,
                        v: last.v + trade.volume,
                    }
                    return [...prev.slice(0, -1), updated]
                }

                if (candleStart > last.t) {
                    // Open a new candle — keep a rolling window (no more than outputsize * 2)
                    const newCandle: OHLCV = {
                        t: candleStart,
                        o: trade.price,
                        h: trade.price,
                        l: trade.price,
                        c: trade.price,
                        v: trade.volume,
                    }
                    const next = [...prev, newCandle]
                    return next.length > outputsize * 2 ? next.slice(-outputsize) : next
                }

                // Trade is older than current candle — ignore
                return prev
            })
        })

        return unsubscribe
    }, [symbol, timeframe, status, outputsize])

    return {
        data,
        status,
        error,
        livePrice,
        refresh: loadHistory,
    }
}