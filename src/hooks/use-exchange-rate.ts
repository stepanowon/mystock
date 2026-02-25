import { useQuery } from '@tanstack/react-query'
import { getUsdKrwRate } from '@/services/stock-api/exchange-rate'
import { EXCHANGE_RATE_STALE_TIME } from '@/config/constants'

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchange-rate', 'USD-KRW'],
    queryFn: getUsdKrwRate,
    staleTime: EXCHANGE_RATE_STALE_TIME,
    refetchInterval: EXCHANGE_RATE_STALE_TIME,
  })
}
