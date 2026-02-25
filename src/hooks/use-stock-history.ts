import { useQuery } from '@tanstack/react-query'
import { getStockHistory } from '@/services/stock-api/stock-service'
import type { MarketType } from '@/types'

export function useStockHistory(
  symbol: string,
  market: MarketType,
  range: string,
  interval?: string,
) {
  return useQuery({
    queryKey: ['stock-history', symbol, market, range, interval ?? ''] as const,
    queryFn: () => getStockHistory(symbol, market, range, interval),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  })
}
