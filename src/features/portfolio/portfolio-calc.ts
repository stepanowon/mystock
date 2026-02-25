import type { PortfolioItem, HoldingReturn, PortfolioSummary, StockQuote } from '@/types'

export function calcHoldingReturn(
  item: PortfolioItem,
  currentPrice: number,
  exchangeRate: number,
): HoldingReturn {
  const multiplier = item.currency === 'USD' ? exchangeRate : 1
  const costBasis = item.avgPrice * item.quantity
  const marketValue = currentPrice * item.quantity
  const marketValueKrw = marketValue * multiplier
  const returnAmount = marketValue - costBasis
  const returnPercent = costBasis > 0 ? (returnAmount / costBasis) * 100 : 0

  return {
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    market: item.market,
    currency: item.currency,
    quantity: item.quantity,
    avgPrice: item.avgPrice,
    currentPrice,
    costBasis,
    marketValue,
    marketValueKrw,
    returnAmount,
    returnPercent,
    weight: 0,
  }
}

export function calcPortfolioSummary(
  items: readonly PortfolioItem[],
  quotes: ReadonlyMap<string, StockQuote>,
  exchangeRate: number,
): PortfolioSummary {
  const holdings = items.map((item) => {
    const quote = quotes.get(item.symbol)
    const price = quote?.currentPrice ?? item.avgPrice
    return calcHoldingReturn(item, price, exchangeRate)
  })

  const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValueKrw, 0)
  const totalCostBasis = holdings.reduce((sum, h) => {
    const multiplier = h.currency === 'USD' ? exchangeRate : 1
    return sum + h.costBasis * multiplier
  }, 0)

  const holdingsWithWeight = holdings.map((h) => ({
    ...h,
    weight: totalMarketValue > 0 ? (h.marketValueKrw / totalMarketValue) * 100 : 0,
  }))

  const totalReturnAmount = totalMarketValue - totalCostBasis
  const totalReturnPercent =
    totalCostBasis > 0 ? (totalReturnAmount / totalCostBasis) * 100 : 0

  return {
    totalCostBasis,
    totalMarketValue,
    totalReturnAmount,
    totalReturnPercent: totalReturnPercent,
    holdings: holdingsWithWeight,
  }
}
