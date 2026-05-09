// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/twelvedata.ts
// Fetches historical OHLCV candles from TwelveData REST API.
// Uses NEXT_PUBLIC_TWELVEDATA_API_KEY from your .env.local
// ─────────────────────────────────────────────────────────────────────────────

import type { OHLCV, Timeframe } from './charts'

const BASE = 'https://api.twelvedata.com'
const API_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY!

// TwelveData interval strings match our Timeframe values directly
// 1min, 5min, 15min, 30min, 1h, 4h, 1day

interface TDCandle {
    datetime: string   // "2024-01-15 09:30:00" or "2024-01-15"
    open: string
    high: string
    low: string
    close: string
    volume: string
}

interface TDResponse {
    status: string
    message?: string
    values?: TDCandle[]
}

function parseTimestamp(datetime: string): number {
    // TwelveData returns "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD"
    return new Date(datetime.replace(' ', 'T') + (datetime.length === 10 ? 'T00:00:00' : '') + 'Z').getTime()
}

/**
 * Fetch historical OHLCV candles for a symbol.
 * @param symbol  e.g. "AAPL", "MSFT", "BTC/USD"
 * @param timeframe  one of: '1min' | '5min' | '15min' | '30min' | '1h' | '4h' | '1day'
 * @param outputsize  number of candles to fetch (max 5000 on paid plans, 800 on free)
 */
export async function fetchHistoricalOHLCV(
    symbol: string,
    timeframe: Timeframe,
    outputsize: number = 120,
): Promise<OHLCV[]> {
    const url = new URL(`${BASE}/time_series`)
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('interval', timeframe)
    url.searchParams.set('outputsize', String(outputsize))
    url.searchParams.set('apikey', API_KEY)
    url.searchParams.set('order', 'ASC')  // oldest first

    const res = await fetch(url.toString(), { next: { revalidate: 30 } })
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`)

    const json: TDResponse = await res.json()

    if (json.status === 'error' || !json.values) {
        throw new Error(`TwelveData error: ${json.message ?? 'unknown'}`)
    }

    return json.values.map(c => ({
        t: parseTimestamp(c.datetime),
        o: parseFloat(c.open),
        h: parseFloat(c.high),
        l: parseFloat(c.low),
        c: parseFloat(c.close),
        v: parseFloat(c.volume),
    }))
}

/**
 * Fetch the current live quote for a symbol (price, change, volume).
 * Useful for the header stats that don't need a full candle.
 */
export async function fetchQuote(symbol: string): Promise<{
    price: number
    change: number
    changePct: number
    volume: number
    high: number
    low: number
    open: number
} | null> {
    const url = new URL(`${BASE}/quote`)
    url.searchParams.set('symbol', symbol)
    url.searchParams.set('apikey', API_KEY)

    const res = await fetch(url.toString(), { next: { revalidate: 5 } })
    if (!res.ok) return null

    const json = await res.json()
    if (json.status === 'error') return null

    return {
        price: parseFloat(json.close),
        change: parseFloat(json.change),
        changePct: parseFloat(json.percent_change),
        volume: parseFloat(json.volume),
        high: parseFloat(json.high),
        low: parseFloat(json.low),
        open: parseFloat(json.open),
    }
}