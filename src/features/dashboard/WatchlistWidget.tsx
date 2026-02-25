import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useWatchlist } from '@/hooks/use-watchlist'
import { formatCurrency, formatPercent } from '@/lib/format'
import { clsx } from 'clsx'
import type { StockQuote } from '@/types'

interface WatchlistWidgetProps {
  readonly quotes: ReadonlyMap<string, StockQuote>
  readonly isLoading: boolean
}

export function WatchlistWidget({ quotes, isLoading }: WatchlistWidgetProps) {
  const { data: watchlist } = useWatchlist()

  return (
    <Card>
      <CardHeader
        title="관심 종목"
        action={
          <Link to="/search" className="text-sm text-blue-600 hover:underline">
            종목 추가
          </Link>
        }
      />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !watchlist?.length ? (
        <p className="py-8 text-center text-sm text-gray-400">
          관심 종목을 추가해보세요
        </p>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item) => {
            const quote = quotes.get(item.symbol)
            return (
              <Link
                key={item.id}
                to={`/stock/${item.symbol}?market=${item.market}`}
                className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.symbol}
                  </p>
                  <p className="text-xs text-gray-500">
                    {quote?.name ?? item.name}
                  </p>
                </div>
                {quote && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(quote.currentPrice, quote.currency)}
                    </p>
                    <p
                      className={clsx(
                        'text-xs font-medium',
                        quote.change >= 0 ? 'text-red-600' : 'text-blue-600',
                      )}
                    >
                      {formatPercent(quote.changePercent)}
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
