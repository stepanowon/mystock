import type { Timestamp } from 'firebase/firestore'

export type AlertCondition = 'ABOVE' | 'BELOW' | 'CHANGE_PCT'

export interface Alert {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly condition: AlertCondition
  readonly targetValue: number
  readonly isActive: boolean
  readonly triggeredAt?: Timestamp
  readonly createdAt: Timestamp
}
