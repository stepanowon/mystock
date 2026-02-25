import { useMemo } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/Button'
import { useWatchlist, useAddWatchlistItem, useRemoveWatchlistItem } from '@/hooks/use-watchlist'
import type { StockQuote } from '@/types'

interface StockActionsProps {
  readonly quote: StockQuote
}

export function StockActions({ quote }: StockActionsProps) {
  const { data: watchlist } = useWatchlist()
  const addToWatchlist = useAddWatchlistItem()
  const removeFromWatchlist = useRemoveWatchlistItem()

  const watchlistItem = useMemo(
    () => watchlist?.find((w) => w.symbol === quote.symbol),
    [watchlist, quote.symbol],
  )

  const isInWatchlist = !!watchlistItem

  function handleToggleWatchlist() {
    if (isInWatchlist && watchlistItem) {
      removeFromWatchlist.mutate(watchlistItem.id)
    } else {
      addToWatchlist.mutate({
        symbol: quote.symbol,
        name: quote.name,
        market: quote.market,
        sortOrder: (watchlist?.length ?? 0) + 1,
        addedAt: Timestamp.now(),
      })
    }
  }

  const isPending = addToWatchlist.isPending || removeFromWatchlist.isPending

  return (
    <div className="flex gap-3">
      <Button
        variant={isInWatchlist ? 'secondary' : 'primary'}
        onClick={handleToggleWatchlist}
        isLoading={isPending}
      >
        {isInWatchlist ? '관심 종목 해제' : '관심 종목 추가'}
      </Button>
    </div>
  )
}
