// ═══════════════════════════════════════════════════════════════
// ASSETURA PRO — Technical Analysis Engine
// High-precision indicator calculations
// Runs inline (can be called from Web Worker context)
// ═══════════════════════════════════════════════════════════════

export interface TAInput {
  timestamps: number[]
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume: number[]
}

export interface TAResult {
  id: string
  type: string
  timestamps: Float64Array
  values: Float64Array
  extra?: Record<string, Float64Array>
}

/**
 * Simple Moving Average
 */
export function computeSMA(close: number[], period: number): Float64Array {
  const result = new Float64Array(close.length)
  for (let i = 0; i < close.length; i++) {
    if (i < period - 1) {
      result[i] = NaN
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += close[j]
    }
    result[i] = sum / period
  }
  return result
}

/**
 * Exponential Moving Average
 */
export function computeEMA(close: number[], period: number): Float64Array {
  const result = new Float64Array(close.length)
  const mult = 2 / (period + 1)

  // Initialize with SMA
  let sum = 0
  for (let i = 0; i < Math.min(period, close.length); i++) {
    sum += close[i]
    result[i] = NaN
  }

  if (close.length < period) return result
  result[period - 1] = sum / period

  for (let i = period; i < close.length; i++) {
    result[i] = (close[i] - result[i - 1]) * mult + result[i - 1]
  }
  return result
}

/**
 * Relative Strength Index (Wilder's smoothing)
 */
export function computeRSI(close: number[], period: number = 14): Float64Array {
  const result = new Float64Array(close.length)
  result.fill(NaN)

  if (close.length < period + 1) return result

  let gainSum = 0
  let lossSum = 0

  for (let i = 1; i <= period; i++) {
    const delta = close[i] - close[i - 1]
    if (delta > 0) gainSum += delta
    else lossSum += Math.abs(delta)
  }

  let avgGain = gainSum / period
  let avgLoss = lossSum / period

  result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))

  for (let i = period + 1; i < close.length; i++) {
    const delta = close[i] - close[i - 1]
    const gain = delta > 0 ? delta : 0
    const loss = delta < 0 ? Math.abs(delta) : 0

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss))
  }

  return result
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function computeMACD(
  close: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9,
): { macd: Float64Array; signal: Float64Array; histogram: Float64Array } {
  const emaFast = computeEMA(close, fastPeriod)
  const emaSlow = computeEMA(close, slowPeriod)

  const macd = new Float64Array(close.length)
  const macdArr: number[] = []

  for (let i = 0; i < close.length; i++) {
    if (isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macd[i] = NaN
    } else {
      macd[i] = emaFast[i] - emaSlow[i]
      macdArr.push(macd[i])
    }
  }

  // Signal line (EMA of MACD values)
  const signal = new Float64Array(close.length)
  signal.fill(NaN)

  if (macdArr.length >= signalPeriod) {
    const startIdx = close.length - macdArr.length
    const signalVals = computeEMA(macdArr, signalPeriod)
    for (let i = 0; i < signalVals.length; i++) {
      signal[startIdx + i] = signalVals[i]
    }
  }

  const histogram = new Float64Array(close.length)
  for (let i = 0; i < close.length; i++) {
    if (isNaN(macd[i]) || isNaN(signal[i])) {
      histogram[i] = NaN
    } else {
      histogram[i] = macd[i] - signal[i]
    }
  }

  return { macd, signal, histogram }
}

/**
 * Bollinger Bands
 */
export function computeBollingerBands(
  close: number[],
  period: number = 20,
  stdMult: number = 2,
): { upper: Float64Array; middle: Float64Array; lower: Float64Array } {
  const middle = computeSMA(close, period)
  const upper = new Float64Array(close.length)
  const lower = new Float64Array(close.length)

  for (let i = 0; i < close.length; i++) {
    if (isNaN(middle[i])) {
      upper[i] = NaN
      lower[i] = NaN
      continue
    }

    let variance = 0
    for (let j = i - period + 1; j <= i; j++) {
      const diff = close[j] - middle[i]
      variance += diff * diff
    }
    const std = Math.sqrt(variance / period)
    upper[i] = middle[i] + stdMult * std
    lower[i] = middle[i] - stdMult * std
  }

  return { upper, middle, lower }
}

/**
 * Volume Weighted Average Price
 */
export function computeVWAP(
  high: number[],
  low: number[],
  close: number[],
  volume: number[],
): Float64Array {
  const result = new Float64Array(close.length)
  let cumTPV = 0
  let cumVol = 0

  for (let i = 0; i < close.length; i++) {
    const tp = (high[i] + low[i] + close[i]) / 3
    cumTPV += tp * volume[i]
    cumVol += volume[i]
    result[i] = cumVol > 0 ? cumTPV / cumVol : tp
  }

  return result
}

/**
 * Compute all requested indicators in one pass
 */
export function computeIndicators(
  input: TAInput,
  configs: Array<{
    id: string
    type: string
    params: Record<string, number>
  }>,
): TAResult[] {
  const results: TAResult[] = []
  const ts = new Float64Array(input.timestamps)

  for (const cfg of configs) {
    switch (cfg.type) {
      case 'sma': {
        const period = cfg.params.period || 20
        results.push({
          id: cfg.id,
          type: 'sma',
          timestamps: ts,
          values: computeSMA(input.close, period),
        })
        break
      }
      case 'ema': {
        const period = cfg.params.period || 20
        results.push({
          id: cfg.id,
          type: 'ema',
          timestamps: ts,
          values: computeEMA(input.close, period),
        })
        break
      }
      case 'rsi': {
        const period = cfg.params.period || 14
        results.push({
          id: cfg.id,
          type: 'rsi',
          timestamps: ts,
          values: computeRSI(input.close, period),
        })
        break
      }
      case 'macd': {
        const { macd, signal, histogram } = computeMACD(
          input.close,
          cfg.params.fastPeriod || 12,
          cfg.params.slowPeriod || 26,
          cfg.params.signalPeriod || 9,
        )
        results.push({
          id: cfg.id,
          type: 'macd',
          timestamps: ts,
          values: macd,
          extra: { signal, histogram },
        })
        break
      }
      case 'bollinger': {
        const { upper, middle, lower } = computeBollingerBands(
          input.close,
          cfg.params.period || 20,
          cfg.params.stdDev || 2,
        )
        results.push({
          id: cfg.id,
          type: 'bollinger',
          timestamps: ts,
          values: middle,
          extra: { upper, lower },
        })
        break
      }
      case 'vwap': {
        results.push({
          id: cfg.id,
          type: 'vwap',
          timestamps: ts,
          values: computeVWAP(input.high, input.low, input.close, input.volume),
        })
        break
      }
    }
  }

  return results
}
