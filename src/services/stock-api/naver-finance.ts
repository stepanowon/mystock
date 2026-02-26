import type { StockSearchResult, StockQuote } from '@/types'
import { getMarketStatus } from '@/lib/market-hours'
import { getKrStockBySymbol } from '@/data/kr-stocks'
import { searchKrEtfs } from '@/data/kr-etfs'

interface NaverStockItem {
  readonly code: string
  readonly name: string
  readonly typeCode: string  // 'stock' | 'index' | 'etf' ...
  readonly typeName: string  // '코스피' | '코스닥' | '나스닥' | '뉴욕' ...
}

interface NaverSearchResponse {
  readonly items: readonly NaverStockItem[]
  readonly totalCount: number
}

// 네이버 금융 모바일 API 응답 타입
// https://m.stock.naver.com/api/stock/{code}/basic
interface NaverStockBasicResponse {
  readonly stockCode?: string
  readonly closePrice?: string         // 현재가 (장중) 또는 종가: "4,180"
  readonly compareToPreviousClosePrice?: string  // 전일 대비 등락: "58" 또는 "-58"
  readonly fluctuationsRatio?: string  // 등락률: "1.41" 또는 "-1.38"
  readonly openPrice?: string
  readonly highPrice?: string
  readonly lowPrice?: string
  readonly accumulatedTradingVolume?: string
  readonly previousClosePrice?: string // 전일 종가
  readonly stockName?: string
}

function parseKrw(str: string | undefined): number {
  if (!str) return 0
  return parseFloat(str.replace(/,/g, '')) || 0
}

export async function getNaverKoreanQuote(symbol: string): Promise<StockQuote> {
  const response = await fetch(`/api/naver-mobile/api/stock/${symbol}/basic`)
  if (!response.ok) {
    throw new Error(`네이버 금융 시세 오류: ${response.status} (${symbol})`)
  }
  const data = (await response.json()) as NaverStockBasicResponse

  const currentPrice = parseKrw(data.closePrice)
  if (currentPrice === 0) {
    throw new Error(`네이버 금융: 유효한 가격 없음 (${symbol})`)
  }

  const change = parseKrw(data.compareToPreviousClosePrice)
  const changePercent = parseFloat(data.fluctuationsRatio ?? '0') || 0
  // previousClosePrice가 없으면 currentPrice - change로 계산
  const previousClose = parseKrw(data.previousClosePrice) || (change !== 0 ? currentPrice - change : currentPrice)

  // 로컬 DB 한글명 우선, 없으면 네이버 응답의 stockName
  const localName = getKrStockBySymbol(symbol)?.name
  const name = localName ?? data.stockName ?? symbol

  return {
    symbol,
    name,
    market: 'KRX',
    currency: 'KRW',
    currentPrice,
    previousClose,
    change,
    changePercent,
    volume: parseKrw(data.accumulatedTradingVolume),
    high: parseKrw(data.highPrice),
    low: parseKrw(data.lowPrice),
    open: parseKrw(data.openPrice),
    high52Week: 0,
    low52Week: 0,
    marketStatus: getMarketStatus('KRX'),
    updatedAt: new Date().toISOString(),
  }
}

export function searchKoreanEtfs(query: string): readonly StockSearchResult[] {
  // ETF 검색은 로컬 DB(kr-etfs.json)를 사용
  // npm run etfs:download 실행 후 사용 가능
  return searchKrEtfs(query)
}

async function fetchNaverItems(target: string, query: string): Promise<readonly NaverStockItem[]> {
  try {
    const res = await fetch(`/api/naver-stock/ac?q=${encodeURIComponent(query)}&target=${target}`)
    if (!res.ok) return []
    const data = (await res.json()) as NaverSearchResponse
    return Array.isArray(data.items) ? data.items : []
  } catch {
    return []
  }
}

export async function searchKoreanStocks(
  query: string,
): Promise<readonly StockSearchResult[]> {
  // target=stock 단일 요청 (target=etf는 ac.stock.naver.com 미지원)
  // Naver 자동완성은 target=stock에서도 ETF를 typeCode='etf'로 반환함
  const items = await fetchNaverItems('stock', query)

  const results: StockSearchResult[] = items
    .filter((item) => {
      if (item.typeCode === 'etf') return true
      return item.typeCode === 'stock' && (item.typeName === '코스피' || item.typeName === '코스닥')
    })
    .map((item) => ({
      symbol: item.code,
      name: item.name,
      market: 'KRX' as const,
      currency: 'KRW' as const,
      assetType: (item.typeCode === 'etf' ? 'etf' : 'stock') as 'etf' | 'stock',
    }))

  if (results.length === 0) {
    throw new Error(`검색 결과 없음: ${query}`)
  }

  return results.slice(0, 10)
}
