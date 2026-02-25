import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent } from '@/lib/format'
import { useDeletePortfolioItem } from '@/hooks/use-portfolio'
import { clsx } from 'clsx'
import type { HoldingReturn } from '@/types'
import { isEtfHolding } from './portfolio-utils'

interface HoldingsTableProps {
  readonly holdings: readonly HoldingReturn[]
  readonly quoteErrors?: ReadonlySet<string>
}

// ─── 이익/손실액 포맷 (부호 명시) ────────────────────────────────────────────
function formatReturnAmount(value: number, currency: HoldingReturn['currency']): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${formatCurrency(value, currency)}`
}

// ─── 테이블 헤더 ──────────────────────────────────────────────────────────────
function TableHead() {
  return (
    <thead>
      <tr className="border-b border-gray-200 text-xs text-gray-500">
        <th className="pb-3 pr-4">종목</th>
        <th className="pb-3 pr-4 text-right">수량</th>
        <th className="pb-3 pr-4 text-right">평균 매수가</th>
        <th className="pb-3 pr-4 text-right">현재가</th>
        <th className="hidden pb-3 pr-4 text-right md:table-cell">매수금액</th>
        <th className="hidden pb-3 pr-4 text-right md:table-cell">평가금액</th>
        <th className="hidden pb-3 pr-4 text-right md:table-cell">이익/손실액</th>
        <th className="hidden pb-3 pr-4 text-right md:table-cell">수익률</th>
        <th className="hidden pb-3 pr-4 text-right md:table-cell">비중</th>
        <th className="pb-3 text-right">삭제</th>
      </tr>
    </thead>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export function HoldingsTable({ holdings, quoteErrors }: HoldingsTableProps) {
  const deleteItem = useDeletePortfolioItem()

  if (!holdings.length) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        보유 종목이 없습니다. 종목을 추가해보세요.
      </p>
    )
  }

  function renderRows(items: readonly HoldingReturn[]) {
    return items.map((h) => {
      const hasError = quoteErrors?.has(h.symbol) ?? false
      return (
        <tr key={h.symbol} className="border-b border-gray-100">
          {/* 종목 */}
          <td className="py-3 pr-4">
            <Link to={`/stock/${h.symbol}?market=${h.market}`} className="hover:underline">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{h.symbol}</span>
                <span className="hidden md:inline"><Badge>{h.market}</Badge></span>
              </div>
              <span className="text-xs text-gray-500">{h.name}</span>
            </Link>
          </td>
          {/* 수량 */}
          <td className="py-3 pr-4 text-right text-gray-900">{h.quantity}</td>
          {/* 평균 매수가 */}
          <td className="py-3 pr-4 text-right text-gray-900">
            {formatCurrency(h.avgPrice, h.currency)}
          </td>
          {/* 현재가 */}
          <td className="py-3 pr-4 text-right text-gray-900">
            {hasError ? (
              <span className="text-xs text-red-500" title="시세 조회 실패 — 종목 코드를 확인하세요">
                조회 실패
              </span>
            ) : (
              formatCurrency(h.currentPrice, h.currency)
            )}
          </td>
          {/* 매수금액 */}
          <td className="hidden py-3 pr-4 text-right text-gray-900 md:table-cell">
            {formatCurrency(h.costBasis, h.currency)}
          </td>
          {/* 평가금액 */}
          <td className="hidden py-3 pr-4 text-right text-gray-900 md:table-cell">
            {hasError ? <span className="text-xs text-gray-400">-</span> : formatCurrency(h.marketValue, h.currency)}
          </td>
          {/* 이익/손실액 */}
          <td className="hidden py-3 pr-4 text-right md:table-cell">
            {hasError ? (
              <span className="text-xs text-gray-400">-</span>
            ) : (
              <span className={clsx('font-medium', h.returnAmount >= 0 ? 'text-red-600' : 'text-blue-600')}>
                {formatReturnAmount(h.returnAmount, h.currency)}
              </span>
            )}
          </td>
          {/* 수익률 */}
          <td className="hidden py-3 pr-4 text-right md:table-cell">
            {hasError ? (
              <span className="text-xs text-gray-400">-</span>
            ) : (
              <span className={clsx('font-medium', h.returnPercent >= 0 ? 'text-red-600' : 'text-blue-600')}>
                {formatPercent(h.returnPercent)}
              </span>
            )}
          </td>
          {/* 비중 */}
          <td className="hidden py-3 pr-4 text-right text-gray-600 md:table-cell">{h.weight.toFixed(1)}%</td>
          {/* 삭제 */}
          <td className="py-3 text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm(`${h.name}(${h.symbol})을 삭제하시겠습니까?`)) {
                  deleteItem.mutate(h.id)
                }
              }}
              className="text-gray-400 hover:text-red-600"
            >
              X
            </Button>
          </td>
        </tr>
      )
    })
  }

  const stocks = holdings.filter((h) => !isEtfHolding(h))
  const etfs   = holdings.filter((h) => isEtfHolding(h))

  // 주식/ETF 중 하나만 있으면 섹션 없이 단일 테이블
  if (!stocks.length || !etfs.length) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <TableHead />
          <tbody>{renderRows(holdings)}</tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto space-y-6">
      {/* 주식 섹션 */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-700">주식</h4>
          <span className="text-xs text-gray-400">{stocks.length}개</span>
        </div>
        <table className="w-full text-left text-sm">
          <TableHead />
          <tbody>{renderRows(stocks)}</tbody>
        </table>
      </div>

      {/* ETF 섹션 */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-700">ETF</h4>
          <span className="text-xs text-gray-400">{etfs.length}개</span>
        </div>
        <table className="w-full text-left text-sm">
          <TableHead />
          <tbody>{renderRows(etfs)}</tbody>
        </table>
      </div>
    </div>
  )
}
