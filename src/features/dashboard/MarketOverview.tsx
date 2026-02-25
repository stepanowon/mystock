import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatNumber, formatPercent } from '@/lib/format'
import { clsx } from 'clsx'
import type { StockQuote } from '@/types'

interface MarketOverviewProps {
  readonly indices: ReadonlyMap<string, StockQuote>
}

const indexLabels: Record<string, string> = {
  '^KS11': 'KOSPI',
  '^KQ11': 'KOSDAQ',
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ',
}

export function MarketOverview({ indices }: MarketOverviewProps) {
  return (
    <Card>
      <CardHeader title="시장 현황" />
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(indexLabels).map(([symbol, label]) => {
          const quote = indices.get(symbol)
          return (
            <div
              key={symbol}
              className="rounded-lg border border-gray-100 p-2 md:p-3"
            >
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-medium text-gray-600 md:text-sm">{label}</p>
                {quote && (
                  <Badge
                    variant={quote.marketStatus === 'OPEN' ? 'success' : 'neutral'}
                  >
                    {quote.marketStatus === 'OPEN' ? '장중' : '마감'}
                  </Badge>
                )}
              </div>
              {quote ? (
                <>
                  <p className="mt-1 text-base font-bold text-gray-900 md:text-lg">
                    {formatNumber(quote.currentPrice)}
                  </p>
                  <p
                    className={clsx(
                      'text-xs font-medium',
                      quote.change >= 0 ? 'text-red-600' : 'text-blue-600',
                    )}
                  >
                    {formatPercent(quote.changePercent)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-400">-</p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
