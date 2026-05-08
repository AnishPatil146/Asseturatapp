'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const SUGGESTIONS = [
    'Should I buy BTC at current levels?',
    'Analyze my portfolio risk',
    'What is the market sentiment today?',
    'Best entry for ETH this week?',
    'Explain the current macro environment',
]

export default function AIAdvisor() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hello! I am your Assetura AI Advisor. I can help you analyze markets, review your portfolio, generate trade ideas, and explain market conditions. What would you like to know?',
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const send = async (text: string) => {
        if (!text.trim() || loading) return
        const userMsg: Message = { role: 'user', content: text }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/ai-advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                }),
            })
            const data = await res.json()
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.content || 'No response received.' },
            ])
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error. Please check your API key in .env.local and try again.',
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: 'calc(100vh - 80px)',
        }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '18px', fontWeight: 600 }}>AI Advisor</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                        Powered by Claude · Real-time market intelligence
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--green)',
                        display: 'inline-block',
                        animation: 'pulse 2s infinite',
                    }} />
                    <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--green)',
                    }}>
                        ONLINE
                    </span>
                </div>
            </div>

            {/* Main layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 280px',
                gap: '16px',
                flex: 1,
                minHeight: 0,
            }}>

                {/* Chat panel */}
                <div style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                    }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                                gap: '10px',
                                alignItems: 'flex-start',
                            }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    flexShrink: 0,
                                    background: m.role === 'user' ? 'var(--blue)' : 'var(--bg4)',
                                    border: m.role === 'assistant' ? '1px solid var(--border2)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: m.role === 'user' ? '#fff' : 'var(--blue)',
                                }}>
                                    {m.role === 'user' ? 'A' : 'AI'}
                                </div>

                                {/* Bubble */}
                                <div style={{
                                    maxWidth: '75%',
                                    background: m.role === 'user' ? 'var(--bg4)' : 'var(--bg3)',
                                    border: '1px solid var(--border)',
                                    borderRadius: m.role === 'user'
                                        ? '12px 4px 12px 12px'
                                        : '4px 12px 12px 12px',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    lineHeight: 1.6,
                                    color: 'var(--text)',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {/* Loading dots */}
                        {loading && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'var(--bg4)',
                                    border: '1px solid var(--border2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--blue)',
                                }}>
                                    AI
                                </div>
                                <div style={{
                                    background: 'var(--bg3)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px 12px 12px 12px',
                                    padding: '12px 16px',
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'center',
                                }}>
                                    {[0, 1, 2].map((i) => (
                                        <span key={i} style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'var(--text3)',
                                            display: 'inline-block',
                                            animation: `pulse 1s infinite ${i * 0.2}s`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input bar */}
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                    }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    send(input)
                                }
                            }}
                            placeholder="Ask about markets, portfolio, signals..."
                            style={{
                                flex: 1,
                                background: 'var(--bg3)',
                                border: '1px solid var(--border2)',
                                borderRadius: '5px',
                                padding: '8px 12px',
                                fontSize: '13px',
                                color: 'var(--text)',
                                outline: 'none',
                                fontFamily: 'var(--font-sans)',
                            }}
                        />
                        <button
                            onClick={() => send(input)}
                            disabled={loading || !input.trim()}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '5px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                border: 'none',
                                background: loading || !input.trim() ? 'var(--bg4)' : 'var(--blue)',
                                color: '#fff',
                                fontFamily: 'var(--font-sans)',
                                opacity: loading || !input.trim() ? 0.5 : 1,
                                transition: 'all 0.15s',
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>

                {/* Right sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Suggested questions */}
                    <div style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--border)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text2)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}>
                            Suggested Questions
                        </div>
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => send(s)}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    color: 'var(--text2)',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: i < SUGGESTIONS.length - 1 ? '1px solid var(--border)' : 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)',
                                    lineHeight: 1.4,
                                    transition: 'color 0.12s',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Market context */}
                    <div style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '14px',
                    }}>
                        <div style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text2)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                        }}>
                            Market Context
                        </div>
                        {[
                            { label: 'BTC Dominance', val: '60.93%', color: 'var(--amber)' },
                            { label: 'Fear & Greed', val: '72 Greed', color: 'var(--green)' },
                            { label: 'Market Trend', val: 'Bullish', color: 'var(--green)' },
                            { label: 'Volatility', val: 'Medium', color: 'var(--blue)' },
                        ].map((item) => (
                            <div key={item.label} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                            }}>
                                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{item.label}</span>
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    color: item.color,
                                }}>
                                    {item.val}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* API key notice */}
                    <div style={{
                        background: 'rgba(79,142,247,0.08)',
                        border: '1px solid rgba(79,142,247,0.2)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        fontSize: '11px',
                        color: 'var(--text2)',
                        lineHeight: 1.5,
                    }}>
                        <div style={{ fontWeight: 600, color: 'var(--blue)', marginBottom: '4px' }}>
                            Setup Required
                        </div>
                        Add your Anthropic API key to <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>.env.local</code>:
                        <br /><br />
                        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)', fontSize: '10px' }}>
                            ANTHROPIC_API_KEY=sk-ant-...
                        </code>
                    </div>
                </div>
            </div>
        </div>
    )
}