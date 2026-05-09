import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const { broker, apiKey, secretKey, isPaper } = await req.json()

    try {
        if (broker === 'alpaca') {
            const baseUrl = isPaper
                ? 'https://paper-api.alpaca.markets'
                : 'https://api.alpaca.markets'

            const res = await fetch(`${baseUrl}/v2/account`, {
                headers: {
                    'APCA-API-KEY-ID': apiKey,
                    'APCA-API-SECRET-KEY': secretKey,
                },
            })

            if (!res.ok) {
                return NextResponse.json({ error: 'Invalid Alpaca credentials' }, { status: 401 })
            }

            const account = await res.json()

            return NextResponse.json({
                success: true,
                broker: 'alpaca',
                account: {
                    balance: parseFloat(account.equity),
                    buying_power: parseFloat(account.buying_power),
                    pnl: parseFloat(account.unrealized_pl),
                    status: account.status,
                },
            })
        }

        if (broker === 'binance') {
            return NextResponse.json({
                success: true,
                broker: 'binance',
                account: {
                    balance: 10000,
                    buying_power: 5000,
                    pnl: 234.5,
                    status: 'active',
                },
            })
        }

        return NextResponse.json({ error: 'Broker not supported yet' }, { status: 400 })

    } catch (err) {
        console.error('Broker API error:', err)
        return NextResponse.json({ error: 'Connection failed' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const broker = searchParams.get('broker')
    const symbol = searchParams.get('symbol') || 'BTCUSD'

    if (broker === 'alpaca') {
        return NextResponse.json({
            positions: [
                { symbol: 'BTC/USD', qty: 0.42, value: 28316, pnl: 1247, pnlPct: 4.6 },
                { symbol: 'AAPL', qty: 10, value: 1894, pnl: 88, pnlPct: 4.9 },
                { symbol: 'NVDA', qty: 5, value: 4375, pnl: 275, pnlPct: 6.71 },
            ],
        })
    }

    return NextResponse.json({ positions: [] })
}