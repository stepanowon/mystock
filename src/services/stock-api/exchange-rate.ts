interface ExchangeRateCache {
  rate: number
  fetchedAt: number
}

let rateCache: ExchangeRateCache | null = null

const CACHE_DURATION = 30 * 60 * 1000 // 30분

export async function getUsdKrwRate(): Promise<number> {
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_DURATION) {
    return rateCache.rate
  }

  try {
    const response = await fetch(
      '/api/exchange-rate/latest/USD',
    )

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`)
    }

    const data = (await response.json()) as {
      rates: { KRW: number }
    }

    const rate = data.rates.KRW
    rateCache = { rate, fetchedAt: Date.now() }
    return rate
  } catch (error) {
    if (rateCache) return rateCache.rate
    throw error
  }
}
