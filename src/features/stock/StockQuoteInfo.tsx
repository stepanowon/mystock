import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent } from '@/lib/format'
import { clsx } from 'clsx'
import type { StockQuote } from '@/types'

interface StockQuoteInfoProps {
  readonly quote: StockQuote
}

const marketStatusLabel = {
  PRE_MARKET: '장 전',
  OPEN: '장 중',
  CLOSED: '장 마감',
  AFTER_HOURS: '시간 외',
} as const

const marketStatusVariant = {
  PRE_MARKET: 'warning',
  OPEN: 'success',
  CLOSED: 'neutral',
  AFTER_HOURS: 'info',
} as const

export function StockQuoteInfo({ quote }: StockQuoteInfoProps) {
  const isPositive = quote.change >= 0

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{quote.symbol}</h2>
            <Badge>{quote.market}</Badge>
            <Badge variant={marketStatusVariant[quote.marketStatus]}>
              {marketStatusLabel[quote.marketStatus]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">{quote.name}</p>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-4xl font-bold text-gray-900">
          {formatCurrency(quote.currentPrice, quote.currency)}
        </span>
        <span
          className={clsx(
            'text-xl font-semibold',
            isPositive ? 'text-red-600' : 'text-blue-600',
          )}
        >
          {isPositive ? '+' : ''}
          {formatCurrency(quote.change, quote.currency)} ({formatPercent(quote.changePercent)})
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoItem label="시가" value={quote.open > 0 ? formatCurrency(quote.open, quote.currency) : '—'} />
        <InfoItem label="고가" value={quote.high > 0 ? formatCurrency(quote.high, quote.currency) : '—'} />
        <InfoItem label="저가" value={quote.low > 0 ? formatCurrency(quote.low, quote.currency) : '—'} />
        <InfoItem label="전일 종가" value={formatCurrency(quote.previousClose, quote.currency)} />
        <InfoItem label="52주 최고" value={quote.high52Week > 0 ? formatCurrency(quote.high52Week, quote.currency) : '—'} />
        <InfoItem label="52주 최저" value={quote.low52Week > 0 ? formatCurrency(quote.low52Week, quote.currency) : '—'} />
      </div>
    </Card>
  )
}

function InfoItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-gray-900">{value}</p>
    </div>
  )
}
