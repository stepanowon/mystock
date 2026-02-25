import type { Timestamp } from 'firebase/firestore'

export interface UserSettings {
  readonly theme: 'light' | 'dark'
  readonly language: 'ko' | 'en'
  readonly defaultMarket: 'KRX' | 'US'
}

export interface UserProfile {
  readonly uid: string
  readonly email: string
  readonly displayName: string
  readonly photoURL?: string
  readonly settings: UserSettings
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'light',
  language: 'ko',
  defaultMarket: 'KRX',
}
