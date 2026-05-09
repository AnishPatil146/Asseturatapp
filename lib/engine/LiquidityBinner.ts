export interface OHLCV {
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    buyVol?: number
    sellVol?: number
}

export interface BinResult {
    priceLevel: number
    intensity: number
    volume: number
    tradeCount: number
    isPOC: boolean
}

export interface LiquidityBinConfig {
    binCount: number
    decayLambda: number
    priceMin: number
    priceMax: number
    nowMs: number
}

export interface FairValueGap {
    type: 'bullish' | 'bearish'
    topPrice: number
    botPrice: number
    timestamp: number
    filled: boolean
}

export interface OrderBlock {
    type: 'bullish' | 'bearish'
    topPrice: number
    botPrice: number
    timestamp: number
    strength: number
}

export function computeLiquidityBins(
    candles: OHLCV[],
    config: LiquidityBinConfig
): BinResult[] {
    const { binCount, decayLambda, priceMin, priceMax, nowMs } = config

    if (!candles.length || priceMax <= priceMin) return []

    const binSize = (priceMax - priceMin) / binCount
    const volumes = new Float64Array(binCount)
    const counts = new Float64Array(binCount)

    for (const c of candles) {
        const age = Math.max(0, nowMs - c.timestamp)
        const weight = Math.exp(-decayLambda * age)

        const lo = Math.max(c.low, priceMin)
        const hi = Math.min(c.high, priceMax)
        if (hi <= lo) continue

        const bLo = Math.max(0, Math.min(binCount - 1, Math.floor((lo - priceMin) / binSize)))
        const bHi = Math.max(0, Math.min(binCount - 1, Math.floor((hi - priceMin) / binSize)))
        const span = bHi - bLo + 1
        const vpb = (c.volume * weight) / span

        for (let b = bLo; b <= bHi; b++) {
            volumes[b] += vpb
            counts[b] += 1
        }
    }

    let maxVol = 0
    let pocIdx = 0
    for (let i = 0; i < binCount; i++) {
        if (volumes[i] > maxVol) { maxVol = volumes[i]; pocIdx = i }
    }
    if (maxVol === 0) maxVol = 1

    return Array.from({ length: binCount }, (_, i) => ({
        priceLevel: priceMin + (i + 0.5) * binSize,
        intensity: volumes[i] / maxVol,
        volume: volumes[i],
        tradeCount: counts[i],
        isPOC: i === pocIdx,
    }))
}

export function detectFairValueGaps(candles: OHLCV[]): FairValueGap[] {
    const gaps: FairValueGap[] = []

    for (let i = 0; i < candles.length - 2; i++) {
        const prev = candles[i]
        const curr = candles[i + 1]
        const next = candles[i + 2]

        if (next.low > prev.high) {
            gaps.push({
                type: 'bullish',
                topPrice: next.low,
                botPrice: prev.high,
                timestamp: curr.timestamp,
                filled: false,
            })
        }

        if (next.high < prev.low) {
            gaps.push({
                type: 'bearish',
                topPrice: prev.low,
                botPrice: next.high,
                timestamp: curr.timestamp,
                filled: false,
            })
        }
    }

    // Mark filled
    for (const gap of gaps) {
        for (const c of candles) {
            if (c.timestamp <= gap.timestamp) continue
            if (gap.type === 'bullish' && c.low <= gap.botPrice) { gap.filled = true; break }
            if (gap.type === 'bearish' && c.high >= gap.topPrice) { gap.filled = true; break }
        }
    }

    return gaps
}

export function detectOrderBlocks(
    candles: OHLCV[],
    impulseMinPct: number = 0.003
): OrderBlock[] {
    const blocks: OrderBlock[] = []

    for (let i = 1; i < candles.length - 1; i++) {
        const curr = candles[i]
        const next = candles[i + 1]
        const impulse = Math.abs(next.close - next.open) / Math.max(next.open, 0.0001)

        if (impulse < impulseMinPct) continue

        if (curr.close > curr.open && next.close < next.open) {
            blocks.push({
                type: 'bearish',
                topPrice: curr.high,
                botPrice: curr.open,
                timestamp: curr.timestamp,
                strength: Math.min(1, impulse / (impulseMinPct * 10)),
            })
        }

        if (curr.close < curr.open && next.close > next.open) {
            blocks.push({
                type: 'bullish',
                topPrice: curr.open,
                botPrice: curr.low,
                timestamp: curr.timestamp,
                strength: Math.min(1, impulse / (impulseMinPct * 10)),
            })
        }
    }

    return blocks
}

export function computeCumulativeDelta(candles: OHLCV[]): Float64Array {
    const delta = new Float64Array(candles.length)
    let cum = 0
    for (let i = 0; i < candles.length; i++) {
        const c = candles[i]
        const buy = c.buyVol ?? (c.close >= c.open ? c.volume * 0.6 : c.volume * 0.4)
        const sell = c.sellVol ?? c.volume - buy
        cum += buy - sell
        delta[i] = cum
    }
    return delta
}