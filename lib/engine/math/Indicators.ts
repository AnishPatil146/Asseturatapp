import { type OHLCV } from '../LiquidityBinner'

export function computeRSI(candles: OHLCV[], period: number = 14): Float64Array {
  const rsi = new Float64Array(candles.length)
  if (candles.length <= period) return rsi

  let avgGain = 0
  let avgLoss = 0

  // Calculate first average gain and loss (SMA)
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close
    if (change > 0) avgGain += change
    else avgLoss -= change
  }

  avgGain /= period
  avgLoss /= period

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs))

  // Calculate rest using Wilder's Smoothing
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close
    let gain = 0
    let loss = 0
    if (change > 0) gain = change
    else loss = -change

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    if (avgLoss === 0) {
      rsi[i] = 100
    } else {
      const rs = avgGain / avgLoss
      rsi[i] = 100 - (100 / (1 + rs))
    }
  }

  return rsi
}

function computeEMA(data: Float64Array, period: number): Float64Array {
  const ema = new Float64Array(data.length)
  if (data.length === 0) return ema

  const k = 2 / (period + 1)
  
  // Start with SMA
  let sum = 0
  let count = 0
  for (let i = 0; i < data.length; i++) {
    if (data[i] !== 0 || count > 0) { // skip leading zeros if any
      if (count < period) {
        sum += data[i]
        count++
        ema[i] = sum / count
      } else {
        ema[i] = data[i] * k + ema[i - 1] * (1 - k)
      }
    }
  }
  return ema
}

export function computeMACD(
  candles: OHLCV[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { macd: Float64Array, signalLine: Float64Array, hist: Float64Array } {
  const closePrices = new Float64Array(candles.length)
  for (let i = 0; i < candles.length; i++) {
    closePrices[i] = candles[i].close
  }

  const fastEma = computeEMA(closePrices, fast)
  const slowEma = computeEMA(closePrices, slow)

  const macd = new Float64Array(candles.length)
  for (let i = slow; i < candles.length; i++) { // only valid after slow period
    macd[i] = fastEma[i] - slowEma[i]
  }

  // To compute signal line correctly, we only run EMA on the valid MACD values
  const validMacd = new Float64Array(candles.length - slow)
  for (let i = 0; i < validMacd.length; i++) {
    validMacd[i] = macd[i + slow]
  }

  const validSignal = computeEMA(validMacd, signal)
  
  const signalLine = new Float64Array(candles.length)
  const hist = new Float64Array(candles.length)
  
  for (let i = 0; i < validSignal.length; i++) {
    signalLine[i + slow] = validSignal[i]
    hist[i + slow] = macd[i + slow] - signalLine[i + slow]
  }

  return { macd, signalLine, hist }
}
