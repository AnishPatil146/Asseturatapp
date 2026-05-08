import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json()

        // FIXED: Added the correct '/v1/messages' endpoint path
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514', // Double-check this model string. Standard formats usually look like claude-3-5-sonnet-20241022
                max_tokens: 1024,
                system: `You are an expert AI trading advisor for Assetura, a professional multi-asset trading platform.
You have deep knowledge of crypto, stocks, forex, and options markets.
You provide concise, actionable market analysis and trading insights.
Current market context: BTC at $67,420 (+2.34%), ETH at $3,120 (-0.8%), S&P500 at 5,612 (+0.29%).
Keep responses focused and under 200 words unless asked for detailed analysis.`,
                messages,
            }),
        })

        const data = await response.json()

        // ADDED: Error handling to catch API rejections (e.g., bad keys, rate limits)
        if (!response.ok) {
            console.error("Anthropic API Error:", data)
            return NextResponse.json(
                { error: data.error?.message || 'Failed to fetch response from Anthropic' },
                { status: response.status }
            )
        }

        return NextResponse.json({
            content: data.content?.[0]?.text || 'Unable to get response. Please check your API key.',
        })
    } catch (error) {
        console.error("Server Error:", error)
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}