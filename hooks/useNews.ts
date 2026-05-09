import { useState, useEffect } from 'react'
import { NewsArticle } from '../lib/types/market'
import { fetchNews } from '../services/news'
import { useMarketEngineStore } from '../lib/store/useMarketEngineStore'
import { needsNewsProvider } from '../services/providerRouter'

export const useNews = (limit: number = 10) => {
    const { selectedSymbol, assetType } = useMarketEngineStore()
    const [news, setNews] = useState<NewsArticle[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let isMounted = true

        const loadNews = async () => {
            if (!selectedSymbol || !needsNewsProvider(assetType)) {
                setNews([])
                return
            }

            setLoading(true)
            const query = `${selectedSymbol} OR "${assetType} market"`
            const articles = await fetchNews(query, limit)
            
            if (isMounted) {
                setNews(articles)
                setLoading(false)
            }
        }

        loadNews()

        return () => {
            isMounted = false
        }
    }, [selectedSymbol, assetType, limit])

    return { news, loading }
}
