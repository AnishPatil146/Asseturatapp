'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

export interface TickerData {
    symbol: string
    price: number
    change: number
    changePct: number
    high: number
    low: number
    volume: string
}

const SYMBOL_MAP: Record<string, string> = {
    CRYPTO: 'btcusdt',
    STOCKS: 'ethusdt',
    FOREX: 'bnbusdt',
    OPTIONS: 'solusdt',
}

export function useBinancePrice(symbol: string = 'btcusdt') {
    const ws = useRef<WebSocket | null>(null)
    const reconnect = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [ticker, setTicker] = useState<TickerData | null>(null)
    const [connected, setConnected] = useState(false)

    const connect = useCallback(() => {
        try {
            const url = `wss://stream.binance.com:9443/ws/${symbol}@ticker`
            ws.current = new WebSocket(url)

            ws.current.onopen = () => {
                setConnected(true)
                console.log('[Binance WS] Connected:', symbol)
            }

            ws.current.onmessage = (e) => {
                try {
                    const d = JSON.parse(e.data)
                    setTicker({
                        symbol: d.s,
                        price: parseFloat(d.c),
                        change: parseFloat(d.p),
                        changePct: parseFloat(d.P),
                        high: parseFloat(d.h),
                        low: parseFloat(d.l),
                        volume: parseFloat(d.v).toLocaleString(),
                    })
                } catch (err) {
                    console.error('[Binance WS] Parse error:', err)
                }
            }

            ws.current.onclose = () => {
                setConnected(false)
                console.log('[Binance WS] Disconnected, reconnecting in 3s...')
                reconnect.current = setTimeout(connect, 3000)
            }

            ws.current.onerror = () => {
                ws.current?.close()
            }

        } catch (err) {
            console.error('[Binance WS] Failed:', err)
        }
    }, [symbol])

    useEffect(() => {
        connect()
        return () => {
            reconnect.current && clearTimeout(reconnect.current)
            ws.current?.close()
        }
    }, [connect])

    return { ticker, connected }
}

export function useMultiTicker() {
    const [tickers, setTickers] = useState<Record<string, TickerData>>({})
    const ws = useRef<WebSocket | null>(null)
    const reconnect = useRef<ReturnType<typeof setTimeout> | null>(null)

    const connect = useCallback(() => {
        try {
            const streams = [
                'btcusdt@ticker',
                'ethusdt@ticker',
                'solusdt@ticker',
                'bnbusdt@ticker',
            ].join('/')

            ws.current = new WebSocket(
                `wss://stream.binance.com:9443/stream?streams=${streams}`
            )

            ws.current.onmessage = (e) => {
                try {
                    const msg = JSON.parse(e.data)
                    const d = msg.data
                    if (!d) return
                    setTickers((prev) => ({
                        ...prev,
                        [d.s]: {
                            symbol: d.s,
                            price: parseFloat(d.c),
                            change: parseFloat(d.p),
                            changePct: parseFloat(d.P),
                            high: parseFloat(d.h),
                            low: parseFloat(d.l),
                            volume: parseFloat(d.v).toLocaleString(),
                        },
                    }))
                } catch (err) {
                    console.error('[Multi WS] Parse error:', err)
                }
            }

            ws.current.onclose = () => {
                reconnect.current = setTimeout(connect, 3000)
            }

            ws.current.onerror = () => ws.current?.close()

        } catch (err) {
            console.error('[Multi WS] Failed:', err)
        }
    }, [])

    useEffect(() => {
        connect()
        return () => {
            reconnect.current && clearTimeout(reconnect.current)
            ws.current?.close()
        }
    }, [connect])

    return { tickers }
}