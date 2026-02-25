import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StockQuoteInfo } from './StockQuoteInfo'
import { StockActions } from './StockActions'
import { StockChart } from './StockChart'
import { useStockQuote } from '@/hooks/use-stock-quote'
import type { MarketType } from '@/types'

function detectMarket(symbol: string): MarketType {
  // Yahoo Finance 지수: ^ 접두사
  if (symbol.startsWith('^')) return 'NYSE'
  // 미국 주식 티커: 순수 영문 1-5자리
  if (/^[A-Z]{1,5}$/.test(symbol)) return 'NYSE'
  return 'KRX'
}

const VALID_MARKETS: MarketType[] = ['KRX', 'NYSE', 'NASDAQ']

export function StockDetailPage() {
  const { symbol = '' } = useParams<{ symbol: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const marketParam = searchParams.get('market') as MarketType | null
  const market = (marketParam && VALID_MARKETS.includes(marketParam))
    ? marketParam
    : detectMarket(symbol)
  const { data: quote, isLoading, error } = useStockQuote(symbol, market)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">
          {error instanceof Error ? error.message : '종목 정보를 불러올 수 없습니다.'}
        </p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
          뒤로 가기
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        ← 뒤로
      </Button>
      <StockQuoteInfo quote={quote} />
      <Card>
        <StockChart symbol={symbol} market={market} currency={quote.currency} />
      </Card>
      <StockActions quote={quote} />
    </div>
  )
}
