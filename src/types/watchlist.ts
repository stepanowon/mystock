import type { Timestamp } from 'firebase/firestore'
import type { MarketType } from './stock'

export interface WatchlistItem {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly market: MarketType
  readonly sortOrder: number
  readonly addedAt: Timestamp
}
