import { NextRequest, NextResponse } from 'next/server'

const BINANCE_BASE = 'https://api.binance.com/api/v3'
const FINNHUB_BASE = 'https://finnhub.io/api/v1'
const TWELVE_BASE = 'https://api.twelvedata.com'

// Map our timeframe to provider-specific intervals
const BINANCE_INTERVALS: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1D': '1d', '1W': '1w',
}
const TWELVE_INTERVALS: Record<string, string> = {
  '1m': '1min', '5m': '5min', '15m': '15min', '1h': '1h', '4h': '4h', '1D': '1day', '1W': '1week',
}

type CandleResult = { time: number; open: number; high: number; low: number; close: number; volume: number }

// ── Binance (Crypto) ─────────────────────────────────────
async function fetchBinance(symbol: string, interval: string, limit: number): Promise<CandleResult[]> {
  const s = symbol.replace('/', '').toUpperCase()
  const iv = BINANCE_INTERVALS[interval] || '1h'
  const res = await fetch(`${BINANCE_BASE}/klines?symbol=${s}&interval=${iv}&limit=${limit}`)
  if (!res.ok) throw new Error(`Binance ${res.status}`)
  const data = await res.json()
  return data.map((d: any[]) => ({
    time: d[0], open: +d[1], high: +d[2], low: +d[3], close: +d[4], volume: +d[5],
  }))
}

// ── Finnhub (Stocks) ─────────────────────────────────────
async function fetchFinnhub(symbol: string, interval: string, limit: number): Promise<CandleResult[]> {
  const key = process.env.NEXT_PUBLIC_FINNHUB_API_KEY
  if (!key) throw new Error('No Finnhub API key')
  // Finnhub resolution: 1, 5, 15, 30, 60, D, W, M
  const resMap: Record<string, string> = { '1m': '1', '5m': '5', '15m': '15', '1h': '60', '4h': '60', '1D': 'D', '1W': 'W' }
  const resolution = resMap[interval] || '60'
  const to = Math.floor(Date.now() / 1000)
  // Calculate from based on interval and limit
  const barSec: Record<string, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1D': 86400, '1W': 604800 }
  const from = to - (barSec[interval] || 3600) * limit
  const res = await fetch(`${FINNHUB_BASE}/stock/candle?symbol=${symbol.toUpperCase()}&resolution=${resolution}&from=${from}&to=${to}&token=${key}`)
  if (!res.ok) throw new Error(`Finnhub ${res.status}`)
  const data = await res.json()
  if (data.s === 'no_data' || !data.t) return []
  return data.t.map((t: number, i: number) => ({
    time: t * 1000, open: data.o[i], high: data.h[i], low: data.l[i], close: data.c[i], volume: data.v[i],
  }))
}

// ── TwelveData (Forex, broad coverage) ───────────────────
async function fetchTwelve(symbol: string, interval: string, limit: number): Promise<CandleResult[]> {
  const key = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY
  if (!key) throw new Error('No TwelveData API key')
  const iv = TWELVE_INTERVALS[interval] || '1h'
  const res = await fetch(`${TWELVE_BASE}/time_series?symbol=${symbol}&interval=${iv}&outputsize=${limit}&apikey=${key}`)
  if (!res.ok) throw new Error(`TwelveData ${res.status}`)
  const data = await res.json()
  if (!data.values) return []
  // TwelveData returns newest first, reverse it
  return data.values.reverse().map((v: any) => ({
    time: new Date(v.datetime).getTime(), open: +v.open, high: +v.high, low: +v.low, close: +v.close, volume: +(v.volume || 0),
  }))
}

// ── Route Handler ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol') || 'BTCUSDT'
  const interval = searchParams.get('interval') || '1h'
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)
  const provider = searchParams.get('provider') || detectProvider(symbol)

  try {
    let candles: CandleResult[] = []
    let usedProvider = provider

    // Try primary provider
    try {
      if (provider === 'binance') candles = await fetchBinance(symbol, interval, limit)
      else if (provider === 'finnhub') candles = await fetchFinnhub(symbol, interval, limit)
      else if (provider === 'twelvedata') candles = await fetchTwelve(symbol, interval, limit)
      else candles = await fetchTwelve(symbol, interval, limit)
    } catch (e: any) {
      console.warn(`[/api/candles] ${provider} failed:`, e.message)
    }

    // Fallback to TwelveData if primary returned nothing (broadest coverage for stocks/forex)
    if (candles.length === 0 && provider !== 'twelvedata') {
      try {
        candles = await fetchTwelve(symbol, interval, limit)
        usedProvider = 'twelvedata'
      } catch (e: any) {
        console.warn('[/api/candles] TwelveData fallback failed:', e.message)
      }
    }

    return NextResponse.json({ candles, provider: usedProvider, symbol, interval, count: candles.length })
  } catch (error: any) {
    console.error('[/api/candles]', error.message)
    return NextResponse.json({ candles: [], error: error.message, provider, symbol }, { status: 200 })
  }
}

function detectProvider(symbol: string): string {
  const s = symbol.toUpperCase()
  if (s.endsWith('USDT') || s.endsWith('BTC') || s.endsWith('BUSD') || s === 'BTCUSDT' || s === 'ETHUSDT') return 'binance'
  if (s.includes('/') && (s.includes('USD') || s.includes('EUR') || s.includes('GBP') || s.includes('JPY'))) return 'twelvedata'
  if (/^[A-Z]{1,5}$/.test(s)) return 'finnhub'
  return 'twelvedata'
}
