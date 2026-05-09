export type WSMessage = {
    symbol: string
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
}

type MessageHandler = (msg: WSMessage) => void

class WebSocketManager {
    private ws: WebSocket | null = null
    private activeSymbol: string = ''
    private activeProvider: string = ''
    private handler: MessageHandler | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private mockTimer: ReturnType<typeof setInterval> | null = null
    private shouldReconnect: boolean = false

    connect(symbol: string, provider: string, onMessage: MessageHandler) {
        console.log('[WSManager] connect', { symbol, provider })
        this.disconnect()
        this.activeSymbol = symbol
        this.activeProvider = provider
        this.handler = onMessage
        this.shouldReconnect = true
        this.openConnection()
    }

    private openConnection() {
        const symbol = this.activeSymbol
        const provider = this.activeProvider

        if (provider !== 'binance') {
            this.startMockStream(symbol)
            return
        }

        try {
            const url = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_5m`
            this.ws = new WebSocket(url)

            this.ws.onopen = () => {
                console.log('[WSManager] binance connected', symbol)
            }

            this.ws.onmessage = (e) => {
                if (this.activeSymbol !== symbol) return
                try {
                    const msg = JSON.parse(e.data)
                    if (!msg.k) return
                    this.handler?.({
                        symbol: msg.k.s,
                        time: msg.k.t,
                        open: parseFloat(msg.k.o),
                        high: parseFloat(msg.k.h),
                        low: parseFloat(msg.k.l),
                        close: parseFloat(msg.k.c),
                        volume: parseFloat(msg.k.v),
                    })
                } catch { }
            }

            this.ws.onclose = () => {
                console.log('[WSManager] binance closed', symbol)
                if (this.shouldReconnect && this.activeSymbol === symbol) {
                    this.reconnectTimer = setTimeout(() => this.openConnection(), 3000)
                }
            }

            this.ws.onerror = () => this.ws?.close()

        } catch (err) {
            console.error('[WSManager] WS error:', err)
            this.startMockStream(symbol)
        }
    }

    private startMockStream(symbol: string) {
        console.log('[WSManager] mock stream', symbol)
        if (this.mockTimer) clearInterval(this.mockTimer)

        const BASES: Record<string, number> = {
            AAPL: 189, NVDA: 875, 'EUR/USD': 1.0842, SPX: 5612,
            // Indices
            NDX: 27710, NI225: 59512, '000001': 4112, UKX: 10363, DAX: 24292, PX1: 8114,
            // Crypto
            Bitcoin: 78429, Ethereum: 2312, Solana: 164,
            BTCUSD: 78429, ETHUSD: 2312, SOLUSD: 164,
            // Futures / Commodities
            'CL1!': 101.94, 'NG1!': 2.78, 'GC1!': 4644, 'HG1!': 5.98,
            DEFAULT: 100,
        }

        let price = BASES[symbol] ?? BASES['DEFAULT']

        this.mockTimer = setInterval(() => {
            if (this.activeSymbol !== symbol) {
                clearInterval(this.mockTimer!)
                this.mockTimer = null
                return
            }
            price *= 1 + (Math.random() - 0.499) * 0.0008
            const now = Date.now()
            const barMs = 5 * 60 * 1000
            const barTime = Math.floor(now / barMs) * barMs
            const spread = price * 0.001
            this.handler?.({
                symbol,
                time: barTime,
                open: price - spread * Math.random(),
                high: price + spread * Math.random(),
                low: price - spread * Math.random(),
                close: price,
                volume: 100 + Math.random() * 500,
            })
        }, 1000)
    }

    disconnect() {
        console.log('[WSManager] disconnect', this.activeSymbol)
        this.shouldReconnect = false

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        if (this.mockTimer) {
            clearInterval(this.mockTimer)
            this.mockTimer = null
        }
        if (this.ws) {
            this.ws.onclose = null
            this.ws.onmessage = null
            this.ws.onerror = null
            try { this.ws.close() } catch { }
            this.ws = null
        }

        this.handler = null
        this.activeSymbol = ''
    }

    getActiveSymbol() { return this.activeSymbol }
}

export const wsManager = new WebSocketManager()