import type { Handler } from '@netlify/functions'

/**
 * 네이버 주식 자동완성 프록시
 * /api/naver-stock/* → https://ac.stock.naver.com/*
 *
 * ⚠️  네이버 API는 한국 IP에서만 응답하는 경우가 있습니다.
 *     Netlify 서버(미국 리전)에서 차단될 경우 로컬 DB 폴백이 자동으로 동작합니다.
 */
export const handler: Handler = async (event) => {
  try {
    const apiPath = event.path.replace('/.netlify/functions/naver-stock', '')
    const qs      = event.rawQuery ? `?${event.rawQuery}` : ''
    const url     = `https://ac.stock.naver.com${apiPath}${qs}`

    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Referer':    'https://finance.naver.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':     'application/json',
      },
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
      body: JSON.stringify({ error: '네이버 주식 검색 프록시 오류', detail: String(err) }),
    }
  }
}
