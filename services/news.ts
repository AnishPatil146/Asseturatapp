import { NewsArticle } from '../lib/types/market'

const BASE_URL = 'https://newsapi.org/v2'

export const fetchNews = async (query: string, limit: number = 10): Promise<NewsArticle[]> => {
    const API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY
    if (!API_KEY) {
        console.error('News API key missing')
        return []
    }

    try {
        // We use everything endpoint for specific queries
        const response = await fetch(`${BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&apiKey=${API_KEY}`)
        
        if (!response.ok) {
            throw new Error(`News API Error: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (data.status !== 'ok') {
            return []
        }

        return data.articles.map((d: any) => ({
            title: d.title,
            url: d.url,
            source: d.source.name,
            publishedAt: d.publishedAt,
            summary: d.description,
            sentiment: Math.floor(Math.random() * 10) + 1 // mock sentiment as NewsAPI doesn't provide it directly
        }))
    } catch (error) {
        console.error('fetchNews failed:', error)
        return []
    }
}
