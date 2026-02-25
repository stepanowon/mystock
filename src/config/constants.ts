export const STOCK_REFETCH_INTERVAL = 5_000
export const EXCHANGE_RATE_STALE_TIME = 30 * 60 * 1000
export const SEARCH_DEBOUNCE_MS = 300
export const MAX_WATCHLIST_ITEMS = 50
export const MAX_RECENT_SEARCHES = 10

export const MARKET_INDICES = {
  KOSPI: '^KS11',
  KOSDAQ: '^KQ11',
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
} as const
