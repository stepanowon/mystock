import type { StockSearchResult } from '@/types'
import stockList from './kr-stocks.json'

// npm run stocks:download 으로 생성된 JSON을 사용
// JSON이 비어 있으면 네이버 금융 API fallback으로 검색됩니다
const KR_STOCKS = stockList as StockSearchResult[]

export function searchKrStocks(query: string): readonly StockSearchResult[] {
  if (!query.trim() || !KR_STOCKS.length) return []
  const q = query.trim().toLowerCase()
  return KR_STOCKS.filter(
    (s) => s.name.toLowerCase().includes(q) || s.symbol.includes(q),
  ).slice(0, 10)
}

export function getKrStockBySymbol(symbol: string): StockSearchResult | undefined {
  return KR_STOCKS.find((s) => s.symbol === symbol)
}

export function getKrStockCount(): number {
  return KR_STOCKS.length
}
