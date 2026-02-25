import { Card } from '@/components/ui/Card'
import { formatCurrency, formatPercent } from '@/lib/format'
import { clsx } from 'clsx'

interface PortfolioSummaryCardProps {
  readonly totalValue: number
  readonly totalReturn: number
  readonly totalReturnPercent: number
  readonly dailyChange: number
  readonly dailyChangePercent: number
}

export function PortfolioSummaryCard({
  totalValue,
  totalReturn,
  totalReturnPercent,
  dailyChange,
  dailyChangePercent,
}: PortfolioSummaryCardProps) {
  return (
    <Card>
      <h3 className="text-sm font-medium text-gray-500">총 자산</h3>
      <p className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
        {formatCurrency(totalValue, 'KRW')}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:flex md:gap-6">
        <div>
          <p className="text-xs text-gray-500">총 수익</p>
          <p
            className={clsx(
              'text-sm font-semibold',
              totalReturn >= 0 ? 'text-red-600' : 'text-blue-600',
            )}
          >
            {formatCurrency(totalReturn, 'KRW')}
            <span className="ml-1">({formatPercent(totalReturnPercent)})</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">일간 변동</p>
          <p
            className={clsx(
              'text-sm font-semibold',
              dailyChange >= 0 ? 'text-red-600' : 'text-blue-600',
            )}
          >
            {formatCurrency(dailyChange, 'KRW')}
            <span className="ml-1">({formatPercent(dailyChangePercent)})</span>
          </p>
        </div>
      </div>
    </Card>
  )
}
