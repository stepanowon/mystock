import type { Handler } from '@netlify/functions'

/**
 * 환율 API 프록시
 * /api/exchange-rate/* → https://open.er-api.com/v6/*
 * (vite 프록시와 동일하게 /api/exchange-rate → /v6 으로 경로 변환)
 */
export const handler: Handler = async (event) => {
  try {
    // /api/exchange-rate/latest/KRW → /v6/latest/KRW
    const apiPath = event.path.replace('/.netlify/functions/exchange-rate', '/v6')
    const qs      = event.rawQuery ? `?${event.rawQuery}` : ''
    const url     = `https://open.er-api.com${apiPath}${qs}`

    const response = await fetch(url, {
      method: event.httpMethod,
      headers: { 'Accept': 'application/json' },
    })

    const body        = await response.text()
    const contentType = response.headers.get('Content-Type') ?? 'application/json'

    return {
      statusCode: response.status,
      headers: { 'Content-Type': contentType },
      body,
    }
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: '환율 API 프록시 오류', detail: String(err) }),
    }
  }
}
