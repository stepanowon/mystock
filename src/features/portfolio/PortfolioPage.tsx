import { useState, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { HoldingsTable } from './HoldingsTable'
import { AddHoldingModal } from './AddHoldingModal'
import { PortfolioCsvModal } from './PortfolioCsvModal'
import { calcPortfolioSummary } from './portfolio-calc'
import { isEtfHolding } from './portfolio-utils'
import { exportPortfolioCsv } from '@/lib/portfolio-csv'
import { usePortfolio } from '@/hooks/use-portfolio'
import { useExchangeRate } from '@/hooks/use-exchange-rate'
import { getQuote } from '@/services/stock-api/stock-service'
import { formatCurrency, formatPercent } from '@/lib/format'
import { STOCK_REFETCH_INTERVAL } from '@/config/constants'
import { clsx } from 'clsx'
import type { HoldingReturn, StockQuote } from '@/types'

// ─── 그룹별 합계 계산 ─────────────────────────────────────────────────────────
interface GroupSummary {
  readonly costBasis:    number
  readonly marketValue:  number
  readonly returnAmount: number
  readonly returnPercent: number
}

function calcGroupSummary(items: readonly HoldingReturn[], exchangeRate: number): GroupSummary {
  const costBasis   = items.reduce((s, h) => s + h.costBasis   * (h.currency === 'USD' ? exchangeRate : 1), 0)
  const marketValue = items.reduce((s, h) => s + h.marketValueKrw, 0)
  const returnAmount  = marketValue - costBasis
  const returnPercent = costBasis > 0 ? (returnAmount / costBasis) * 100 : 0
  return { costBasis, marketValue, returnAmount, returnPercent }
}

export function PortfolioPage() {
  const [isAddOpen, setIsAddOpen]             = useState(false)
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false)
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio()
  const { data: exchangeRate } = useExchangeRate()

  const symbols = useMemo(
    () => portfolio?.map((p) => ({ symbol: p.symbol, market: p.market })) ?? [],
    [portfolio],
  )
  const quoteQueries = useQueries({
    queries: symbols.map(({ symbol, market }) => ({
      queryKey: ['stock-quote', symbol, market] as const,
      queryFn: () => getQuote(symbol, market),
      refetchInterval: STOCK_REFETCH_INTERVAL,
      staleTime: 3000,
      enabled: !!symbol,
    })),
  })

  const quotesMap = useMemo(() => {
    const map = new Map<string, StockQuote>()
    quoteQueries.forEach((q, i) => {
      if (q.data) map.set(symbols[i]!.symbol, q.data)
    })
    return map
  }, [quoteQueries, symbols])

  const quoteErrorSet = useMemo(() => {
    const set = new Set<string>()
    quoteQueries.forEach((q, i) => {
      if (q.isError) set.add(symbols[i]!.symbol)
    })
    return set
  }, [quoteQueries, symbols])

  const summary = useMemo(() => {
    if (!portfolio?.length) return null
    return calcPortfolioSummary(portfolio, quotesMap, exchangeRate ?? 1300)
  }, [portfolio, quotesMap, exchangeRate])

  const groupSummaries = useMemo(() => {
    if (!summary) return null
    const rate   = exchangeRate ?? 1300
    const stocks = summary.holdings.filter((h) => !isEtfHolding(h))
    const etfs   = summary.holdings.filter((h) => isEtfHolding(h))
    return {
      stocks: calcGroupSummary(stocks, rate),
      etfs:   calcGroupSummary(etfs,   rate),
      total:  calcGroupSummary(summary.holdings, rate),
    }
  }, [summary, exchangeRate])

  if (portfolioLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">포트폴리오</h2>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            onClick={() => exportPortfolioCsv(portfolio ?? [])}
            disabled={!portfolio?.length}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            내보내기
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsCsvImportOpen(true)}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            가져오기
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            종목 추가
          </Button>
        </div>
      </div>

      {/* 요약 테이블 */}
      {groupSummaries && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="pb-3 pr-3 text-left md:pr-6">구분</th>
                  <th className="pb-3 pr-3 text-right md:pr-6">매수금액</th>
                  <th className="pb-3 pr-3 text-right md:pr-6">평가금액</th>
                  <th className="pb-3 pr-3 text-right md:pr-6">이익/손실액</th>
                  <th className="pb-3 text-right">수익률</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    { label: '주식', data: groupSummaries.stocks },
                    { label: 'ETF',  data: groupSummaries.etfs   },
                  ] as const
                ).map(({ label, data }) => (
                  <tr key={label} className="border-b border-gray-100">
                    <td className="py-3 pr-3 font-medium text-gray-700 md:pr-6">{label}</td>
                    <td className="py-3 pr-3 text-right text-gray-900 md:pr-6">
                      {formatCurrency(data.costBasis, 'KRW')}
                    </td>
                    <td className="py-3 pr-3 text-right text-gray-900 md:pr-6">
                      {formatCurrency(data.marketValue, 'KRW')}
                    </td>
                    <td className="py-3 pr-3 text-right md:pr-6">
                      <span className={clsx('whitespace-nowrap font-medium', data.returnAmount >= 0 ? 'text-red-600' : 'text-blue-600')}>
                        {data.returnAmount >= 0 ? '+' : ''}{formatCurrency(data.returnAmount, 'KRW')}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={clsx('font-medium', data.returnPercent >= 0 ? 'text-red-600' : 'text-blue-600')}>
                        {formatPercent(data.returnPercent)}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* 합계 행 */}
                <tr className="bg-gray-50">
                  <td className="py-3 pr-3 font-bold text-gray-900 md:pr-6">합계</td>
                  <td className="py-3 pr-3 text-right font-bold text-gray-900 md:pr-6">
                    {formatCurrency(groupSummaries.total.costBasis, 'KRW')}
                  </td>
                  <td className="py-3 pr-3 text-right font-bold text-gray-900 md:pr-6">
                    {formatCurrency(groupSummaries.total.marketValue, 'KRW')}
                  </td>
                  <td className="py-3 pr-3 text-right md:pr-6">
                    <span className={clsx('whitespace-nowrap font-bold', groupSummaries.total.returnAmount >= 0 ? 'text-red-600' : 'text-blue-600')}>
                      {groupSummaries.total.returnAmount >= 0 ? '+' : ''}{formatCurrency(groupSummaries.total.returnAmount, 'KRW')}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={clsx('font-bold', groupSummaries.total.returnPercent >= 0 ? 'text-red-600' : 'text-blue-600')}>
                      {formatPercent(groupSummaries.total.returnPercent)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 보유 종목 테이블 */}
      <Card>
        <CardHeader
          title="보유 종목"
          action={
            <span className="text-sm text-gray-500">
              {portfolio?.length ?? 0}개 종목
            </span>
          }
        />
        <HoldingsTable holdings={summary?.holdings ?? []} quoteErrors={quoteErrorSet} />
      </Card>

      <AddHoldingModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <PortfolioCsvModal isOpen={isCsvImportOpen} onClose={() => setIsCsvImportOpen(false)} />
    </div>
  )
}
