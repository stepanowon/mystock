import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useAddWatchlistItem } from '@/hooks/use-watchlist'
import type { StockSearchResult } from '@/types'
import { Timestamp } from 'firebase/firestore'

interface SearchResultsProps {
  readonly results: readonly StockSearchResult[] | undefined
  readonly isLoading: boolean
  readonly watchlistSymbols: ReadonlySet<string>
}

export function SearchResults({
  results,
  isLoading,
  watchlistSymbols,
}: SearchResultsProps) {
  const addToWatchlist = useAddWatchlistItem()

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (!results?.length) {
    return null
  }

  function handleAddToWatchlist(stock: StockSearchResult) {
    addToWatchlist.mutate({
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      sortOrder: 0,
      addedAt: Timestamp.now(),
    })
  }

  return (
    <div className="space-y-2">
      {results.map((stock) => (
        <div
          key={stock.symbol}
          className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
        >
          <Link
            to={`/stock/${stock.symbol}?market=${stock.market}`}
            className="flex-1 hover:underline"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {stock.symbol}
                </p>
                <p className="text-xs text-gray-500">{stock.name}</p>
              </div>
              <div className="flex gap-1">
                <Badge>{stock.market}</Badge>
                {stock.assetType === 'etf' && <Badge variant="info">ETF</Badge>}
              </div>
            </div>
          </Link>
          {watchlistSymbols.has(stock.symbol) ? (
            <span className="text-xs text-gray-400">관심 등록됨</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAddToWatchlist(stock)}
            >
              + 관심
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
