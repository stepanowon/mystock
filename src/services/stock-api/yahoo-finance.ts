import type { StockQuote, StockSearchResult, HistoricalDataPoint } from '@/types'
import { getMarketStatus } from '@/lib/market-hours'
import { getKrStockBySymbol } from '@/data/kr-stocks'

// Vite 프록시를 통해 CORS 우회: /api/yahoo → https://query1.finance.yahoo.com
const BASE = '/api/yahoo'

import type { MarketType } from '@/types'

function mapExchangeToMarket(exchange: string): MarketType {
  if (exchange === 'NMS' || exchange === 'NGM' || exchange === 'NCM') return 'NASDAQ'
  if (exchange === 'KSC' || exchange === 'KOE' || exchange === 'KOQ') return 'KRX'
  return 'NYSE'
}

interface YahooChartMeta {
  readonly symbol: string
  readonly currency?: string
  readonly exchangeName: string
  readonly shortName?: string
  readonly longName?: string
  readonly regularMarketPrice?: number
  // Yahoo Finance chart API는 previousClose 대신 chartPreviousClose 사용
  readonly chartPreviousClose?: number
  readonly previousClose?: number
  readonly regularMarketPreviousClose?: number
  readonly regularMarketOpen?: number
  readonly regularMarketDayHigh?: number
  readonly regularMarketDayLow?: number
  readonly regularMarketVolume?: number
  readonly fiftyTwoWeekHigh?: number
  readonly fiftyTwoWeekLow?: number
  readonly regularMarketChange?: number
  readonly regularMarketChangePercent?: number
}

interface YahooOhlcv {
  readonly open?: readonly (number | null)[]
  readonly high?: readonly (number | null)[]
  readonly low?: readonly (number | null)[]
  readonly close?: readonly (number | null)[]
  readonly volume?: readonly (number | null)[]
}

interface YahooChartResult {
  readonly meta: YahooChartMeta
  readonly timestamp?: readonly number[]
  readonly indicators?: {
    readonly quote?: readonly YahooOhlcv[]
  }
}

interface YahooChartResponse {
  readonly chart: {
    readonly result?: readonly YahooChartResult[]
    readonly error?: { readonly message: string }
  }
}

async function fetchChartResult(symbol: string, interval: string, range: string): Promise<YahooChartResult> {
  const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.status} (${symbol})`)
  }
  const data = (await response.json()) as YahooChartResponse
  if (data.chart.error) {
    throw new Error(data.chart.error.message)
  }
  const result = data.chart.result?.[0]
  if (!result) {
    throw new Error(`종목 데이터 없음: ${symbol}`)
  }
  return result
}

export async function getUsQuote(symbol: string): Promise<StockQuote> {
  // interval=1m&range=1d: 오늘 분봉 데이터 + meta.regularMarketPrice 최신 현재가
  const result = await fetchChartResult(symbol, '1m', '1d')
  const { meta } = result
  const market = mapExchangeToMarket(meta.exchangeName)

  const currentPrice = meta.regularMarketPrice ?? 0
  const previousClose =
    meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? meta.previousClose ?? currentPrice
  const change = meta.regularMarketChange ?? (currentPrice - previousClose)
  const changePercent = meta.regularMarketChangePercent
    ?? (previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0)

  return {
    symbol: meta.symbol,
    name: meta.shortName ?? meta.longName ?? meta.symbol,
    market,
    currency: meta.currency === 'KRW' ? 'KRW' : 'USD',
    currentPrice,
    previousClose,
    change,
    changePercent,
    volume: meta.regularMarketVolume ?? 0,
    high: meta.regularMarketDayHigh ?? currentPrice,
    low: meta.regularMarketDayLow ?? currentPrice,
    open: meta.regularMarketOpen ?? currentPrice,
    high52Week: meta.fiftyTwoWeekHigh ?? currentPrice,
    low52Week: meta.fiftyTwoWeekLow ?? currentPrice,
    marketStatus: getMarketStatus(market),
    updatedAt: new Date().toISOString(),
  }
}

// 한국 주식: Yahoo Finance는 KOSPI → {ticker}.KS, KOSDAQ → {ticker}.KQ 로 조회
export async function getKoreanStockQuote(symbol: string): Promise<StockQuote> {
  // .KS(KOSPI) 먼저 시도, 실패하면 .KQ(KOSDAQ)
  const suffixes = ['.KS', '.KQ']
  let lastError: unknown
  for (const suffix of suffixes) {
    try {
      // interval=1m&range=1d: 오늘 분봉 데이터 + meta.regularMarketPrice 최신 현재가
      const result = await fetchChartResult(`${symbol}${suffix}`, '1m', '1d')
      const { meta } = result
      const currentPrice = meta.regularMarketPrice ?? 0
      const previousClose =
        meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? meta.previousClose ?? currentPrice
      const change = meta.regularMarketChange ?? (currentPrice - previousClose)
      const changePercent = meta.regularMarketChangePercent
        ?? (previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0)

      const localName = getKrStockBySymbol(symbol)?.name
      return {
        symbol,
        name: localName ?? meta.shortName ?? meta.longName ?? symbol,
        market: 'KRX',
        currency: 'KRW',
        currentPrice,
        previousClose,
        change,
        changePercent,
        volume: meta.regularMarketVolume ?? 0,
        high: meta.regularMarketDayHigh ?? currentPrice,
        low: meta.regularMarketDayLow ?? currentPrice,
        open: meta.regularMarketOpen ?? currentPrice,
        high52Week: meta.fiftyTwoWeekHigh ?? currentPrice,
        low52Week: meta.fiftyTwoWeekLow ?? currentPrice,
        marketStatus: getMarketStatus('KRX'),
        updatedAt: new Date().toISOString(),
      }
    } catch (err) {
      lastError = err
    }
  }
  throw lastError ?? new Error(`한국 주식 조회 실패: ${symbol}`)
}

export async function getHistoricalData(
  symbol: string,
  range: string,
  intervalOverride?: string,
): Promise<readonly HistoricalDataPoint[]> {
  const intervalMap: Record<string, string> = {
    '1d':  '5m',
    '5d':  '15m',
    '1mo': '1d',
    '3mo': '1d',
    '6mo': '1d',
    '1y':  '1wk',
    '2y':  '1wk',
    '5y':  '1mo',
    '10y': '1mo',
    'max': '3mo',
  }
  const interval = intervalOverride ?? intervalMap[range] ?? '1d'
  const result = await fetchChartResult(symbol, interval, range)
  const timestamps = result.timestamp ?? []
  const quote = result.indicators?.quote?.[0]

  if (!quote || !timestamps.length) return []

  return timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString(),
    open: quote.open?.[i] ?? 0,
    high: quote.high?.[i] ?? 0,
    low: quote.low?.[i] ?? 0,
    close: quote.close?.[i] ?? 0,
    volume: quote.volume?.[i] ?? 0,
  }))
}

interface YahooSearchResult {
  readonly symbol: string
  readonly shortname?: string
  readonly longname?: string
  readonly exchange: string
  readonly quoteType?: string
}

interface YahooSearchResponse {
  readonly quotes: readonly YahooSearchResult[]
}

export async function searchUsStocks(
  queryStr: string,
): Promise<readonly StockSearchResult[]> {
  const response = await fetch(
    `${BASE}/v1/finance/search?q=${encodeURIComponent(queryStr)}&quotesCount=10&newsCount=0`,
  )
  if (!response.ok) {
    throw new Error(`Yahoo Finance search error: ${response.status}`)
  }
  const data = (await response.json()) as YahooSearchResponse
  return data.quotes
    .filter((q) => q.quoteType === 'EQUITY')
    .map((q) => {
      const isKorean = q.exchange === 'KSC' || q.exchange === 'KOE' || q.exchange === 'KOQ'
      // Yahoo Finance는 한국 종목 심볼에 .KS/.KQ 접미사를 붙임 → 제거 후 저장
      const symbol = isKorean ? q.symbol.replace(/\.(KS|KQ|KR)$/, '') : q.symbol
      return {
        symbol,
        name: q.shortname ?? q.longname ?? q.symbol,
        market: mapExchangeToMarket(q.exchange),
        currency: (isKorean ? 'KRW' : 'USD') as 'KRW' | 'USD',
      }
    })
}
