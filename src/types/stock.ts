export type MarketType = 'KRX' | 'NYSE' | 'NASDAQ'

export type Currency = 'KRW' | 'USD'

export type MarketStatus = 'PRE_MARKET' | 'OPEN' | 'CLOSED' | 'AFTER_HOURS'

export interface StockQuote {
  readonly symbol: string
  readonly name: string
  readonly market: MarketType
  readonly currency: Currency
  readonly currentPrice: number
  readonly previousClose: number
  readonly change: number
  readonly changePercent: number
  readonly volume: number
  readonly high: number
  readonly low: number
  readonly open: number
  readonly high52Week: number
  readonly low52Week: number
  readonly marketStatus: MarketStatus
  readonly updatedAt: string
}

export type AssetType = 'stock' | 'etf'

export interface StockSearchResult {
  readonly symbol: string
  readonly name: string
  readonly market: MarketType
  readonly currency: Currency
  readonly assetType?: AssetType
}

export interface HistoricalDataPoint {
  readonly date: string
  readonly open: number
  readonly high: number
  readonly low: number
  readonly close: number
  readonly volume: number
}
