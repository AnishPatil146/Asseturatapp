'use client'

import { useEffect, useRef } from 'react'
import { useMarketStore } from '@/lib/store/useMarketStore'

const SYMBOL_MAP = {
    CRYPTO: 'BINANCE:BTCUSDT',
    STOCKS: 'NASDAQ:AAPL',
    FOREX: 'FX:EURUSD',
    OPTIONS: 'SP:SPX',
}

export default function TradingViewChart() {
    const containerRef = useRef<HTMLDivElement>(null)
    const activeAsset = useMarketStore((s) => s.activeAsset)

    useEffect(() => {
        if (!containerRef.current) return
        const container = containerRef.current
        container.innerHTML = ''

        const wrapper = document.createElement('div')
        wrapper.className = 'tradingview-widget-container'
        wrapper.style.width = '100%'
        wrapper.style.height = '100%'

        const inner = document.createElement('div')
        inner.className = 'tradingview-widget-container__widget'
        inner.style.width = '100%'
        inner.style.height = 'calc(100% - 32px)'
        wrapper.appendChild(inner)

        const script = document.createElement('script')
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
        script.type = 'text/javascript'
        script.async = true
        script.innerHTML = JSON.stringify({
            symbols: [[SYMBOL_MAP[activeAsset]]],
            chartOnly: false,
            width: '100%',
            height: '100%',
            locale: 'en',
            colorTheme: 'dark',
            autosize: true,
            showVolume: true,
            showMA: true,
            hideDateRanges: false,
            hideMarketStatus: false,
            hideSymbolLogo: false,
            scalePosition: 'right',
            scaleMode: 'Normal',
            fontFamily: 'DM Mono, monospace',
            fontSize: '10',
            noTimeScale: false,
            valuesTracking: '1',
            changeMode: 'price-and-percent',
            chartType: 'candlesticks',
            maLineColor: '#2962FF',
            maLineWidth: 1,
            maLength: 9,
            backgroundColor: '#08090d',
            lineWidth: 2,
            lineType: 0,
            dateRanges: ['1d|1', '1m|30', '3m|60', '12m|1D', '60m|1W', 'all|1M'],
        })
        wrapper.appendChild(script)
        container.appendChild(wrapper)

        return () => { container.innerHTML = '' }
    }, [activeAsset])

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
    )
}