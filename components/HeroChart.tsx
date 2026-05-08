'use client'

import { useEffect, useRef } from 'react'

export default function HeroChart({ color = '#00d4a0' }: { color?: string }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current
        let cleanup: (() => void) | undefined

        const init = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const LW: any = await import('lightweight-charts')
            container.innerHTML = ''

            const chart = LW.createChart(container, {
                width: container.clientWidth,
                height: container.clientHeight,
                layout: {
                    background: { type: 'solid', color: 'transparent' },
                },
                grid: {
                    vertLines: { color: '#1e2333' },
                    horzLines: { color: '#1e2333' },
                },
                crosshair: {
                    vertLine: { labelBackgroundColor: '#1a1e2a' },
                    horzLine: { labelBackgroundColor: '#1a1e2a' },
                },
                rightPriceScale: {
                    borderColor: '#1e2333',
                    scaleMargins: { top: 0.1, bottom: 0.1 },
                },
                timeScale: {
                    borderColor: '#1e2333',
                    timeVisible: true,
                    secondsVisible: false,
                },
            })

            // Generate candle data
            const candles: {
                time: number
                open: number
                high: number
                low: number
                close: number
            }[] = []

            let price = 67000
            const now = Math.floor(Date.now() / 1000)

            for (let i = 120; i >= 0; i--) {
                const time = now - i * 300
                const open = price
                const range = price * (0.003 + Math.random() * 0.006)
                const high = open + range * (0.5 + Math.random() * 0.8)
                const low = open - range * (0.5 + Math.random() * 0.8)
                const close = low + (high - low) * Math.random()
                candles.push({ time, open, high, low, close })
                price = close
            }

            // Try v5 API first, fall back to v4
            let series: any // eslint-disable-line @typescript-eslint/no-explicit-any
            try {
                if (LW.CandlestickSeries) {
                    series = chart.addSeries(LW.CandlestickSeries, {
                        upColor: '#00d4a0',
                        downColor: '#ff4d6a',
                        borderUpColor: '#00d4a0',
                        borderDownColor: '#ff4d6a',
                        wickUpColor: '#00d4a0',
                        wickDownColor: '#ff4d6a',
                    })
                } else {
                    series = chart.addCandlestickSeries({
                        upColor: '#00d4a0',
                        downColor: '#ff4d6a',
                        borderUpColor: '#00d4a0',
                        borderDownColor: '#ff4d6a',
                        wickUpColor: '#00d4a0',
                        wickDownColor: '#ff4d6a',
                    })
                }
            } catch {
                series = chart.addCandlestickSeries({
                    upColor: '#00d4a0',
                    downColor: '#ff4d6a',
                    borderUpColor: '#00d4a0',
                    borderDownColor: '#ff4d6a',
                    wickUpColor: '#00d4a0',
                    wickDownColor: '#ff4d6a',
                })
            }

            series.setData(candles)
            chart.timeScale().fitContent()

            // Live price updates every 500ms
            const interval = setInterval(() => {
                const last = candles[candles.length - 1]
                last.close = last.close * (1 + (Math.random() - 0.499) * 0.0008)
                last.high = Math.max(last.high, last.close)
                last.low = Math.min(last.low, last.close)
                series.update(last)
            }, 500)

            // Resize observer
            const ro = new ResizeObserver(() => {
                chart.applyOptions({
                    width: container.clientWidth,
                    height: container.clientHeight,
                })
            })
            ro.observe(container)

            cleanup = () => {
                clearInterval(interval)
                ro.disconnect()
                chart.remove()
            }
        }

        init().catch(console.error)
        return () => cleanup?.()
    }, [color])

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%' }}
        />
    )
}