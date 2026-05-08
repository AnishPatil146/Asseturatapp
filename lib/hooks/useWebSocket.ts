import { useEffect, useRef, useCallback } from 'react'

interface Options {
    url: string
    onMessage: (data: unknown) => void
    onOpen?: () => void
    onClose?: () => void
    reconnect?: boolean
}

export function useWebSocket({
    url,
    onMessage,
    onOpen,
    onClose,
    reconnect = true,
}: Options) {
    const ws = useRef<WebSocket | null>(null)
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const connect = useCallback(() => {
        try {
            ws.current = new WebSocket(url)

            ws.current.onopen = () => {
                console.log('[Assetura WS] Connected')
                onOpen?.()
            }

            ws.current.onmessage = (e) => {
                try { onMessage(JSON.parse(e.data)) }
                catch { onMessage(e.data) }
            }

            ws.current.onclose = () => {
                console.log('[Assetura WS] Disconnected')
                onClose?.()
                if (reconnect) reconnectTimer.current = setTimeout(connect, 3000)
            }

            ws.current.onerror = () => ws.current?.close()

        } catch (err) {
            console.error('[Assetura WS] Failed:', err)
        }
    }, [url, onMessage, onOpen, onClose, reconnect])

    useEffect(() => {
        connect()
        return () => {
            reconnectTimer.current && clearTimeout(reconnectTimer.current)
            ws.current?.close()
        }
    }, [connect])

    const send = useCallback((data: unknown) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data))
        }
    }, [])

    return { send }
}