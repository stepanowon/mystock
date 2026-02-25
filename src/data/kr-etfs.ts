import type { StockSearchResult } from '@/types'
import etfList from './kr-etfs.json'

// npm run etfs:download 으로 생성된 JSON을 사용
const KR_ETFS = etfList as StockSearchResult[]

export function searchKrEtfs(query: string): readonly StockSearchResult[] {
  if (!query.trim() || !KR_ETFS.length) return []
  const q = query.trim().toLowerCase()
  return KR_ETFS.filter(
    (s) => s.name.toLowerCase().includes(q) || s.symbol.includes(q),
  ).slice(0, 10)
}

export function getKrEtfBySymbol(symbol: string): StockSearchResult | undefined {
  return KR_ETFS.find((s) => s.symbol === symbol)
}

export function getKrEtfCount(): number {
  return KR_ETFS.length
}
