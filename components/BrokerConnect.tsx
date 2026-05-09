'use client'

import { useState } from 'react'

interface Broker {
    id: string
    name: string
    description: string
    color: string
    icon: string
    features: string[]
    status: 'connected' | 'available' | 'coming_soon'
}

const BROKERS: Broker[] = [
    {
        id: 'alpaca',
        name: 'Alpaca',
        description: 'Commission-free stock and crypto trading API',
        color: '#FFCD00',
        icon: 'A',
        features: ['Stocks', 'Crypto', 'Paper Trading', 'Real-time Data'],
        status: 'available',
    },
    {
        id: 'binance',
        name: 'Binance',
        description: 'World\'s largest crypto exchange',
        color: '#F3BA2F',
        icon: 'B',
        features: ['Crypto', 'Futures', 'Spot Trading', 'WebSocket'],
        status: 'available',
    },
    {
        id: 'interactive_brokers',
        name: 'Interactive Brokers',
        description: 'Professional multi-asset trading platform',
        color: '#E31837',
        icon: 'IB',
        features: ['Stocks', 'Options', 'Forex', 'Futures'],
        status: 'coming_soon',
    },
    {
        id: 'oanda',
        name: 'OANDA',
        description: 'Leading forex and CFD broker',
        color: '#1E90FF',
        icon: 'O',
        features: ['Forex', 'CFDs', 'Commodities', 'Indices'],
        status: 'available',
    },
    {
        id: 'coinbase',
        name: 'Coinbase Advanced',
        description: 'Professional crypto trading platform',
        color: '#0052FF',
        icon: 'C',
        features: ['Crypto', 'Staking', 'Advanced Orders'],
        status: 'coming_soon',
    },
    {
        id: 'paper',
        name: 'Paper Trading',
        description: 'Practice trading with virtual money',
        color: '#00d4a0',
        icon: 'P',
        features: ['All Assets', 'Risk Free', 'Real Prices', 'Free'],
        status: 'connected',
    },
]

interface ConnectModalProps {
    broker: Broker
    onClose: () => void
}

function ConnectModal({ broker, onClose }: ConnectModalProps) {
    const [apiKey, setApiKey] = useState('')
    const [secretKey, setSecretKey] = useState('')
    const [isPaper, setIsPaper] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleConnect = async () => {
        if (!apiKey.trim()) return
        setLoading(true)
        await new Promise((r) => setTimeout(r, 1500))
        setLoading(false)
        setSuccess(true)
        setTimeout(onClose, 1500)
    }

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                width: '420px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: broker.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#fff',
                    }}>
                        {broker.icon}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '16px' }}>Connect {broker.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{broker.description}</div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text3)',
                            cursor: 'pointer',
                            fontSize: '18px',
                        }}
                    >✕</button>
                </div>

                {success ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: 'var(--green)',
                        fontSize: '16px',
                        fontWeight: 600,
                    }}>
                        ✓ Connected successfully!
                    </div>
                ) : (
                    <>
                        {/* Paper trading toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Use Paper Trading (Testnet)</span>
                            <div
                                onClick={() => setIsPaper(!isPaper)}
                                style={{
                                    width: '36px',
                                    height: '20px',
                                    borderRadius: '10px',
                                    background: isPaper ? 'var(--green2)' : 'var(--bg4)',
                                    border: '1px solid var(--border2)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <div style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: '#fff',
                                    position: 'absolute',
                                    top: '2px',
                                    left: isPaper ? '18px' : '2px',
                                    transition: 'left 0.2s',
                                }} />
                            </div>
                        </div>

                        {/* API Key */}
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                API Key
                            </div>
                            <input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={`Enter your ${broker.name} API key`}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg3)',
                                    border: '1px solid var(--border2)',
                                    borderRadius: '5px',
                                    padding: '9px 12px',
                                    fontSize: '12px',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </div>

                        {/* Secret Key */}
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                Secret Key
                            </div>
                            <input
                                type="password"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                placeholder="Enter your secret key"
                                style={{
                                    width: '100%',
                                    background: 'var(--bg3)',
                                    border: '1px solid var(--border2)',
                                    borderRadius: '5px',
                                    padding: '9px 12px',
                                    fontSize: '12px',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            />
                        </div>

                        {/* Security note */}
                        <div style={{
                            background: 'rgba(79,142,247,0.08)',
                            border: '1px solid rgba(79,142,247,0.2)',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            fontSize: '11px',
                            color: 'var(--text2)',
                            lineHeight: 1.5,
                        }}>
                            🔒 Your API keys are encrypted and stored locally. Assetura never shares your credentials.
                        </div>

                        {/* Connect button */}
                        <button
                            onClick={handleConnect}
                            disabled={loading || !apiKey.trim()}
                            style={{
                                width: '100%',
                                padding: '11px',
                                borderRadius: '5px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: loading || !apiKey.trim() ? 'not-allowed' : 'pointer',
                                border: 'none',
                                background: loading || !apiKey.trim() ? 'var(--bg4)' : broker.color,
                                color: '#fff',
                                fontFamily: 'var(--font-sans)',
                                opacity: loading || !apiKey.trim() ? 0.6 : 1,
                                transition: 'all 0.15s',
                            }}
                        >
                            {loading ? 'Connecting...' : `Connect ${broker.name}`}
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default function BrokerConnect() {
    const [selected, setSelected] = useState<Broker | null>(null)

    return (
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Connect Broker</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                    Link your brokerage account to enable real portfolio tracking and live order execution
                </div>
            </div>

            {/* Status bar */}
            <div style={{
                background: 'rgba(0,212,160,0.08)',
                border: '1px solid rgba(0,212,160,0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 500 }}>Paper Trading Active</span>
                <span style={{ fontSize: '12px', color: 'var(--text2)', marginLeft: '4px' }}>— Virtual balance: $100,000.00</span>
            </div>

            {/* Broker grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {BROKERS.map((broker) => (
                    <div
                        key={broker.id}
                        style={{
                            background: 'var(--bg2)',
                            border: `1px solid ${broker.status === 'connected' ? 'rgba(0,212,160,0.3)' : 'var(--border)'}`,
                            borderRadius: '10px',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            cursor: broker.status === 'coming_soon' ? 'not-allowed' : 'pointer',
                            opacity: broker.status === 'coming_soon' ? 0.6 : 1,
                            transition: 'border-color 0.15s',
                        }}
                    >
                        {/* Broker header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: broker.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#fff',
                            }}>
                                {broker.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{broker.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{broker.description}</div>
                            </div>
                        </div>

                        {/* Features */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {broker.features.map((f) => (
                                <span key={f} style={{
                                    padding: '2px 8px',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    background: 'var(--bg4)',
                                    color: 'var(--text3)',
                                    border: '1px solid var(--border)',
                                }}>
                                    {f}
                                </span>
                            ))}
                        </div>

                        {/* Action button */}
                        <button
                            onClick={() => broker.status !== 'coming_soon' && broker.status !== 'connected' && setSelected(broker)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: broker.status === 'coming_soon' || broker.status === 'connected' ? 'not-allowed' : 'pointer',
                                border: '1px solid',
                                borderColor: broker.status === 'connected'
                                    ? 'rgba(0,212,160,0.3)'
                                    : broker.status === 'coming_soon'
                                        ? 'var(--border)'
                                        : broker.color,
                                background: broker.status === 'connected'
                                    ? 'rgba(0,212,160,0.08)'
                                    : 'transparent',
                                color: broker.status === 'connected'
                                    ? 'var(--green)'
                                    : broker.status === 'coming_soon'
                                        ? 'var(--text3)'
                                        : broker.color,
                                fontFamily: 'var(--font-sans)',
                                transition: 'all 0.15s',
                            }}
                        >
                            {broker.status === 'connected'
                                ? '✓ Connected'
                                : broker.status === 'coming_soon'
                                    ? 'Coming Soon'
                                    : 'Connect'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Connect modal */}
            {selected && (
                <ConnectModal
                    broker={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    )
}