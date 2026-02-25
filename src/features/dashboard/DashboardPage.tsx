import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { PortfolioSummaryCard } from './PortfolioSummaryCard'
import { WatchlistWidget } from './WatchlistWidget'
import { MarketOverview } from './MarketOverview'
import { usePortfolio } from '@/hooks/use-portfolio'
import { useWatchlist } from '@/hooks/use-watchlist'
import { useExchangeRate } from '@/hooks/use-exchange-rate'
import { getQuote } from '@/services/stock-api/stock-service'
import { MARKET_INDICES, STOCK_REFETCH_INTERVAL } from '@/config/constants'
import type { StockQuote } from '@/types'

export function DashboardPage() {
  const { data: portfolio } = usePortfolio()
  const { data: watchlist } = useWatchlist()
  const { data: exchangeRate } = useExchangeRate()

  const indexSymbols = Object.values(MARKET_INDICES)
  const indexQueries = useQueries({
    queries: indexSymbols.map((symbol) => ({
      queryKey: ['stock-quote', symbol, 'NYSE'] as const,
      queryFn: () => getQuote(symbol, 'NYSE'),
      refetchInterval: STOCK_REFETCH_INTERVAL,
      staleTime: 3000,
    })),
  })

  const watchlistItems = useMemo(() => watchlist ?? [], [watchlist])
  const watchlistQueries = useQueries({
    queries: watchlistItems.map((item) => ({
      queryKey: ['stock-quote', item.symbol, item.market] as const,
      queryFn: () => getQuote(item.symbol, item.market),
      refetchInterval: STOCK_REFETCH_INTERVAL,
      staleTime: 3000,
      enabled: !!item.symbol,
    })),
  })

  const indexMap = useMemo(() => {
    const map = new Map<string, StockQuote>()
    indexQueries.forEach((q, i) => {
      if (q.data) map.set(indexSymbols[i]!, q.data)
    })
    return map
  }, [indexQueries, indexSymbols])

  const watchlistQuoteMap = useMemo(() => {
    const map = new Map<string, StockQuote>()
    watchlistQueries.forEach((q, i) => {
      if (q.data) map.set(watchlistItems[i]!.symbol, q.data)
    })
    return map
  }, [watchlistQueries, watchlistItems])

  const summary = useMemo(() => {
    if (!portfolio?.length) {
      return {
        totalValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        dailyChange: 0,
        dailyChangePercent: 0,
      }
    }

    const rate = exchangeRate ?? 1300

    let totalCost = 0
    let totalValue = 0
    let totalDailyChange = 0

    for (const item of portfolio) {
      const quote = watchlistQuoteMap.get(item.symbol)
      const price = quote?.currentPrice ?? item.avgPrice
      const prevClose = quote?.previousClose ?? price
      const multiplier = item.currency === 'USD' ? rate : 1

      totalCost += item.avgPrice * item.quantity * multiplier
      totalValue += price * item.quantity * multiplier
      totalDailyChange += (price - prevClose) * item.quantity * multiplier
    }

    const totalReturn = totalValue - totalCost
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0
    const dailyChangePercent =
      totalValue - totalDailyChange > 0
        ? (totalDailyChange / (totalValue - totalDailyChange)) * 100
        : 0

    return {
      totalValue,
      totalReturn,
      totalReturnPercent,
      dailyChange: totalDailyChange,
      dailyChangePercent,
    }
  }, [portfolio, watchlistQuoteMap, exchangeRate])

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl font-bold text-gray-900 md:text-2xl">대시보드</h2>
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PortfolioSummaryCard {...summary} />
        </div>
        <MarketOverview indices={indexMap} />
      </div>
      <WatchlistWidget
        quotes={watchlistQuoteMap}
        isLoading={watchlistQueries.some((q) => q.isLoading)}
      />
    </div>
  )
}
