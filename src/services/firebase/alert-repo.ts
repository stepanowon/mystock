import { createFirestoreRepo } from './firestore-service'
import type { Alert } from '@/types'

export const alertRepo = createFirestoreRepo<Alert>('alerts', 'createdAt')
