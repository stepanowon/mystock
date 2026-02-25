import { createFirestoreRepo } from './firestore-service'
import type { PortfolioItem } from '@/types'

export const portfolioRepo = createFirestoreRepo<PortfolioItem>(
  'portfolio',
  'createdAt',
)
