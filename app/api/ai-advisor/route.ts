import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY ?? ''
)

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json()

        // Convert messages into Gemini format
        const formattedMessages = messages.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }))

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-pro',
            systemInstruction: `
You are Assetura Nexus AI — an institutional-grade multi-asset trading intelligence engine powering Assetura, a professional trading and investment platform.

Your role is to deliver high-precision, data-driven market analysis, trade setups, risk assessments, and portfolio insights across crypto, equities, forex, commodities, ETFs, indices, and options.

CORE OBJECTIVE:
Provide actionable, concise, probability-based trading intelligence optimized for active traders, swing traders, investors, and portfolio managers.

MARKET CONTEXT:
- BTC: $67,420 (+2.34%)
- ETH: $3,120 (-0.80%)
- S&P 500: 5,612 (+0.29%)

ANALYSIS FRAMEWORK:
1. Identify trend direction.
2. Evaluate momentum, volatility, and sentiment.
3. Highlight support/resistance zones.
4. Mention breakout/reversal risks.
5. Include risk-reward logic.
6. Separate short/mid/long-term outlooks.
7. Prioritize capital preservation.

RESPONSE STYLE:
- Institutional-grade analysis
- Concise and actionable
- Under 200 words unless detailed analysis requested
- No filler or generic disclaimers
- Use bullet points and structured outputs

TRADE SETUPS MUST INCLUDE:
- Direction
- Entry
- Stop Loss
- Targets
- Risk Level
- Confidence Score
- Time Horizon

Always think like a hedge fund analyst, quantitative strategist, and elite trader combined.
            `,
        })

        const result = await model.generateContent({
            contents: formattedMessages,
            generationConfig: {
                temperature: 0.4,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 1024,
            },
        })

        const response = result.response
        const text = response.text()

        return NextResponse.json({
            content: text || 'No response received.',
        })

    } catch (err: any) {
        console.error('Gemini Route Error:', err)

        return NextResponse.json({
            content: `Server Error: ${err.message}`,
        })
    }
}