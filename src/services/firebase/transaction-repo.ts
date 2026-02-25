import { createFirestoreRepo } from './firestore-service'
import type { Transaction } from '@/types'

export const transactionRepo = createFirestoreRepo<Transaction>(
  'transactions',
  'executedAt',
)
