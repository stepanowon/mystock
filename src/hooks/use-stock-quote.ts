import { useQuery } from '@tanstack/react-query'
import type { MarketType } from '@/types'
import { getQuote } from '@/services/stock-api/stock-service'
import { STOCK_REFETCH_INTERVAL } from '@/config/constants'

export function useStockQuote(
  symbol: string,
  market: MarketType,
  kisAppKey?: string,
  kisAppSecret?: string,
) {
  return useQuery({
    queryKey: ['stock-quote', symbol, market],
    queryFn: () => getQuote(symbol, market, kisAppKey, kisAppSecret),
    refetchInterval: STOCK_REFETCH_INTERVAL,
    staleTime: 3000,
    enabled: !!symbol,
  })
}
