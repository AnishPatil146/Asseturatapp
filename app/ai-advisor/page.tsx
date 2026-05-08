"use client"

import { useState } from "react"
import Navbar from "@/components/Navbar"

export default function AIAdvisorPage() {
    const [input, setInput] = useState("")
    const [response, setResponse] = useState("")
    const [loading, setLoading] = useState(false)

    const handleAsk = async () => {
        if (!input) return

        setLoading(true)
        setResponse("")

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt: input }),
            })

            const data = await res.json()

            const text =
                data?.content?.[0]?.text ||
                data?.response ||
                "No response received"

            setResponse(text)
        } catch (err) {
            console.error(err)
            setResponse("Error fetching AI response")
        }

        setLoading(false)
    }

    return (
        <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
            <Navbar />

            <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
                <h1 style={{ marginBottom: "10px" }}>AI Advisor</h1>

                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about stocks, crypto, market trends..."
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        marginBottom: "10px",
                    }}
                />

                <button
                    onClick={handleAsk}
                    disabled={loading}
                    style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        background: "#00d4a0",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Analyzing..." : "Ask AI"}
                </button>

                <div
                    style={{
                        marginTop: "20px",
                        padding: "15px",
                        borderRadius: "10px",
                        background: "#111",
                        color: "#fff",
                        minHeight: "100px",
                    }}
                >
                    {response || "AI response will appear here..."}
                </div>
            </div>
        </main>
    )
}