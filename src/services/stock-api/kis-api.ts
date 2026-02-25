import type { StockQuote, StockSearchResult } from '@/types'
import { getMarketStatus } from '@/lib/market-hours'

const KIS_BASE_URL = 'https://openapivts.koreainvestment.com:29443'

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

export async function getAccessToken(
  appKey: string,
  appSecret: string,
): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token
  }

  const response = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
  })

  if (!response.ok) {
    throw new Error(`KIS token error: ${response.status}`)
  }

  const data = (await response.json()) as {
    access_token: string
    token_type: string
    expires_in: number
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

interface KisQuoteResponse {
  readonly output: {
    readonly stck_prpr: string
    readonly prdy_ctrt: string
    readonly prdy_vrss: string
    readonly acml_vol: string
    readonly stck_hgpr: string
    readonly stck_lwpr: string
    readonly stck_oprc: string
    readonly w52_hgpr: string
    readonly w52_lwpr: string
    readonly stck_prdy_clpr: string
    readonly hts_kor_isnm: string
  }
}

export async function getKrxQuote(
  symbol: string,
  appKey: string,
  appSecret: string,
): Promise<StockQuote> {
  const token = await getAccessToken(appKey, appSecret)

  const response = await fetch(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${symbol}`,
    {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
        appkey: appKey,
        appsecret: appSecret,
        tr_id: 'FHKST01010100',
      },
    },
  )

  if (!response.ok) {
    throw new Error(`KIS quote error: ${response.status}`)
  }

  const data = (await response.json()) as KisQuoteResponse
  const o = data.output

  return {
    symbol,
    name: o.hts_kor_isnm,
    market: 'KRX',
    currency: 'KRW',
    currentPrice: Number(o.stck_prpr),
    previousClose: Number(o.stck_prdy_clpr),
    change: Number(o.prdy_vrss),
    changePercent: Number(o.prdy_ctrt),
    volume: Number(o.acml_vol),
    high: Number(o.stck_hgpr),
    low: Number(o.stck_lwpr),
    open: Number(o.stck_oprc),
    high52Week: Number(o.w52_hgpr),
    low52Week: Number(o.w52_lwpr),
    marketStatus: getMarketStatus('KRX'),
    updatedAt: new Date().toISOString(),
  }
}

export async function searchKrxStocks(
  _query: string,
): Promise<readonly StockSearchResult[]> {
  // KIS API는 종목 검색 전용 엔드포인트가 제한적
  // Phase 1에서는 로컬 종목 리스트에서 검색 구현 예정
  return []
}
