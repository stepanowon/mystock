import type { Timestamp } from 'firebase/firestore'
import type { MarketType, Currency } from './stock'

export interface PortfolioItem {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly market: MarketType
  readonly currency: Currency
  readonly avgPrice: number
  readonly quantity: number
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
}

export interface Transaction {
  readonly id: string
  readonly symbol: string
  readonly type: 'BUY' | 'SELL'
  readonly price: number
  readonly quantity: number
  readonly fee: number
  readonly currency: Currency
  readonly executedAt: Timestamp
}

export interface HoldingReturn {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly market: MarketType
  readonly currency: Currency
  readonly quantity: number
  readonly avgPrice: number
  readonly currentPrice: number
  readonly costBasis: number
  readonly marketValue: number
  readonly marketValueKrw: number
  readonly returnAmount: number
  readonly returnPercent: number
  readonly weight: number
}

export interface PortfolioSummary {
  readonly totalCostBasis: number
  readonly totalMarketValue: number
  readonly totalReturnAmount: number
  readonly totalReturnPercent: number
  readonly holdings: readonly HoldingReturn[]
}
