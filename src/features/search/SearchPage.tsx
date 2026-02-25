import { useState, useMemo } from 'react'
import { SearchBar } from './SearchBar'
import { SearchResults } from './SearchResults'
import { useStockSearch } from '@/hooks/use-stock-search'
import { useWatchlist } from '@/hooks/use-watchlist'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const { data: results, isLoading } = useStockSearch(query)
  const { data: watchlist } = useWatchlist()

  const watchlistSymbols = useMemo(
    () => new Set(watchlist?.map((w) => w.symbol) ?? []),
    [watchlist],
  )

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">종목 검색</h2>
      <SearchBar value={query} onChange={setQuery} />
      {query.length >= 2 && (
        <SearchResults
          results={results}
          isLoading={isLoading}
          watchlistSymbols={watchlistSymbols}
        />
      )}
      {query.length < 2 && (
        <p className="text-center text-sm text-gray-400">
          2글자 이상 입력하면 검색이 시작됩니다
        </p>
      )}
    </div>
  )
}
