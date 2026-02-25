import { createFirestoreRepo } from './firestore-service'
import type { WatchlistItem } from '@/types'

export const watchlistRepo = createFirestoreRepo<WatchlistItem>(
  'watchlist',
  'sortOrder',
)
