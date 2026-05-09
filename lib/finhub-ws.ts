// ─────────────────────────────────────────────────────────────────────────────
// FILE: lib/finnhub-ws.ts
// Manages a single shared Finnhub WebSocket connection.
// Multiple chart components subscribe/unsubscribe to symbols.
// Auto-reconnects on disconnect.
// Uses NEXT_PUBLIC_FINNHUB_API_KEY from your .env.local
// ─────────────────────────────────────────────────────────────────────────────

const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY!
const WS_URL = `wss://ws.finnhub.io?token=${API_KEY}`

export interface TradeEvent {
    symbol: string
    price: number
    timestamp: number   // milliseconds
    volume: number
}

type TradeHandler = (trade: TradeEvent) => void

// ── Singleton connection ──────────────────────────────────────────────────────

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let isConnecting = false

// Map of symbol → set of handlers
const subscribers = new Map<string, Set<TradeHandler>>()

function getSubscribedSymbols(): string[] {
    return Array.from(subscribers.keys()).filter(s => (subscribers.get(s)?.size ?? 0) > 0)
}

function send(msg: object) {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
    }
}

function connect() {
    if (isConnecting || ws?.readyState === WebSocket.OPEN) return
    isConnecting = true

    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
        isConnecting = false
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
        // Re-subscribe to all active symbols
        for (const symbol of getSubscribedSymbols()) {
            send({ type: 'subscribe', symbol })
        }
    }

    ws.onmessage = (event: MessageEvent) => {
        try {
            const msg = JSON.parse(event.data as string)
            if (msg.type !== 'trade' || !Array.isArray(msg.data)) return

            for (const tick of msg.data) {
                const symbol: string = tick.s
                const handlers = subscribers.get(symbol)
                if (!handlers?.size) continue

                const trade: TradeEvent = {
                    symbol,
                    price: tick.p,
                    timestamp: tick.t,   // Finnhub sends ms
                    volume: tick.v ?? 0,
                }
                for (const handler of handlers) handler(trade)
            }
        } catch {
            // Ignore malformed frames
        }
    }

    ws.onerror = () => {
        isConnecting = false
    }

    ws.onclose = () => {
        isConnecting = false
        ws = null
        // Reconnect after 3 s if there are active subscribers
        if (getSubscribedSymbols().length > 0) {
            reconnectTimer = setTimeout(() => connect(), 3000)
        }
    }
}

function disconnect() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    ws?.close()
    ws = null
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Subscribe to live trades for a symbol.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 */
export function subscribeTrades(symbol: string, handler: TradeHandler): () => void {
    if (!subscribers.has(symbol)) subscribers.set(symbol, new Set())
    subscribers.get(symbol)!.add(handler)

    if (!ws || ws.readyState === WebSocket.CLOSED) connect()
    else send({ type: 'subscribe', symbol })

    return () => {
        const set = subscribers.get(symbol)
        if (set) {
            set.delete(handler)
            if (set.size === 0) {
                subscribers.delete(symbol)
                send({ type: 'unsubscribe', symbol })
                if (getSubscribedSymbols().length === 0) disconnect()
            }
        }
    }
}

/**
 * Check if the WebSocket is currently connected.
 */
export function isConnected(): boolean {
    return ws?.readyState === WebSocket.OPEN
}