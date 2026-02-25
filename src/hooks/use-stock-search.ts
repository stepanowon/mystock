import { useQuery } from '@tanstack/react-query'
import { searchStocks } from '@/services/stock-api/stock-service'
import { useDebounce } from './use-debounce'
import { SEARCH_DEBOUNCE_MS, SEARCH_STALE_TIME } from '@/config/constants'

export function useStockSearch(query: string) {
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)

  return useQuery({
    queryKey: ['stock-search', debouncedQuery],
    queryFn: () => searchStocks(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: SEARCH_STALE_TIME,
  })
}
