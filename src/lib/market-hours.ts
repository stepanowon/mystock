import type { MarketType, MarketStatus } from '@/types'

interface MarketSchedule {
  readonly timezone: string
  readonly openHour: number
  readonly openMinute: number
  readonly closeHour: number
  readonly closeMinute: number
  readonly weekdays: readonly number[]
}

const SCHEDULES: Record<string, MarketSchedule> = {
  KRX: {
    timezone: 'Asia/Seoul',
    openHour: 9,
    openMinute: 0,
    closeHour: 15,
    closeMinute: 30,
    weekdays: [1, 2, 3, 4, 5],
  },
  US: {
    timezone: 'America/New_York',
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    weekdays: [1, 2, 3, 4, 5],
  },
}

export function getMarketStatus(market: MarketType): MarketStatus {
  const schedule = market === 'KRX' ? SCHEDULES.KRX : SCHEDULES.US
  if (!schedule) return 'CLOSED'

  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? ''

  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  const dayOfWeek = dayMap[weekday] ?? 0

  if (!schedule.weekdays.includes(dayOfWeek)) {
    return 'CLOSED'
  }

  const currentMinutes = hour * 60 + minute
  const openMinutes = schedule.openHour * 60 + schedule.openMinute
  const closeMinutes = schedule.closeHour * 60 + schedule.closeMinute

  if (currentMinutes < openMinutes) return 'PRE_MARKET'
  if (currentMinutes >= closeMinutes) return 'AFTER_HOURS'
  return 'OPEN'
}
