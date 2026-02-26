import type { MarketType, StockQuote, StockSearchResult, HistoricalDataPoint } from '@/types'
import { getUsQuote, getKoreanStockQuote, searchUsStocks, getHistoricalData } from './yahoo-finance'
import { getNaverKoreanQuote, searchKoreanStocks, searchKoreanEtfs } from './naver-finance'
import { getKrxQuote } from './kis-api'
import { getUsdKrwRate } from './exchange-rate'
import { searchKrStocks } from '@/data/kr-stocks'
import { searchKrEtfs } from '@/data/kr-etfs'

function hasKorean(str: string): boolean {
  // 완성형 한글(가-힣) + 자음(ㄱ-ㅎ) + 모음(ㅏ-ㅣ)
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(str)
}

function isKoreanTickerCode(str: string): boolean {
  return /^\d{1,6}$/.test(str.trim())
}

// KRX 종목 여부 판별:
// - ^로 시작하면 Yahoo Finance 지수 심볼 → KRX 아님
// - 순수 영문 1-5자리 → 미국 주식 티커 → KRX 아님
// - 그 외(숫자 포함, 영문+숫자 혼합 등) → KRX 종목
function isKrxSymbol(symbol: string): boolean {
  const s = symbol.trim()
  if (s.startsWith('^')) return false
  return !/^[A-Za-z]{1,5}$/.test(s)
}

export async function getQuote(
  symbol: string,
  market: MarketType,
  kisAppKey?: string,
  kisAppSecret?: string,
): Promise<StockQuote> {
  if (market === 'KRX' || isKrxSymbol(symbol)) {
    // 우선순위: KIS API (키 있을 때) → 네이버 금융 → Yahoo Finance
    if (kisAppKey && kisAppSecret) {
      return getKrxQuote(symbol, kisAppKey, kisAppSecret)
    }
    let quote: StockQuote
    try {
      quote = await getNaverKoreanQuote(symbol)
    } catch {
      // 네이버 금융 실패 시 Yahoo Finance 폴백
      return getKoreanStockQuote(symbol)
    }

    // 시가/고가/저가 또는 52주 최고/최저가 없으면 1년치 히스토리로 보완
    const needsOhlc = quote.open === 0 || quote.high === 0 || quote.low === 0
    const needs52Week = quote.high52Week === 0 || quote.low52Week === 0
    if (needsOhlc || needs52Week) {
      try {
        const history = await getStockHistory(symbol, 'KRX', '1y', '1d')
        const valid = history.filter((d) => d.close > 0)
        if (valid.length > 0) {
          const lastDay = valid[valid.length - 1]
          const high52Week = needs52Week ? Math.max(...valid.map((d) => d.high)) : quote.high52Week
          const low52Week  = needs52Week ? Math.min(...valid.map((d) => d.low))  : quote.low52Week
          return {
            ...quote,
            open: needsOhlc ? (quote.open || lastDay.open) : quote.open,
            high: needsOhlc ? (quote.high || lastDay.high) : quote.high,
            low:  needsOhlc ? (quote.low  || lastDay.low)  : quote.low,
            high52Week,
            low52Week,
          }
        }
      } catch {
        // 보완 실패 시 원래 quote 반환
      }
    }
    return quote
  }
  return getUsQuote(symbol)
}

export async function searchStocks(
  query: string,
): Promise<readonly StockSearchResult[]> {
  // 한글 검색 → 네이버 금융 API (실패 시 로컬 DB fallback)
  if (hasKorean(query)) {
    try {
      const results = await searchKoreanStocks(query)
      if (results.length > 0) return results
    } catch {
      // 네이버 API 실패 시 로컬 DB 사용
    }
    // 로컬 주식 DB + ETF DB 병합 fallback
    const krStocks = searchKrStocks(query)
    const krEtfs = searchKrEtfs(query)
    return [...krStocks, ...krEtfs].slice(0, 10)
  }
  // 숫자(한국 종목 코드) → 로컬 DB 우선, 없으면 Yahoo Finance
  if (isKoreanTickerCode(query)) {
    const krResults = [...searchKrStocks(query), ...searchKrEtfs(query)]
    if (krResults.length > 0) return krResults.slice(0, 10)
  }
  // 영문 → Yahoo Finance(미국 주식) + 네이버 ETF(국내 ETF) 병렬 검색
  const [yahooResults, etfResults] = await Promise.allSettled([
    searchUsStocks(query),
    searchKoreanEtfs(query),
  ])
  const yahoo = yahooResults.status === 'fulfilled' ? yahooResults.value : []
  const etfs  = etfResults.status  === 'fulfilled' ? etfResults.value  : []
  return [...etfs, ...yahoo].slice(0, 10)
}

export async function getStockHistory(
  symbol: string,
  market: MarketType,
  range: string,
  interval?: string,
): Promise<readonly HistoricalDataPoint[]> {
  if (market === 'KRX' || isKrxSymbol(symbol)) {
    for (const suffix of ['.KS', '.KQ']) {
      try {
        return await getHistoricalData(`${symbol}${suffix}`, range, interval)
      } catch {
        // 다음 접미사 시도
      }
    }
    return []
  }
  return getHistoricalData(symbol, range, interval)
}

export { getUsdKrwRate }
