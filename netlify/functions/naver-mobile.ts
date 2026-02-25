import type { Handler } from '@netlify/functions'

/**
 * 네이버 모바일 시세 프록시
 * /api/naver-mobile/* → https://m.stock.naver.com/*
 *
 * ⚠️  네이버 API는 한국 IP에서만 응답하는 경우가 있습니다.
 *     Netlify 서버(미국 리전)에서 차단될 경우 Yahoo Finance 폴백이 자동으로 동작합니다.
 */
export const handler: Handler = async (event) => {
  try {
    const apiPath = event.path.replace('/.netlify/functions/naver-mobile', '')
    const qs      = event.rawQuery ? `?${event.rawQuery}` : ''
    const url     = `https://m.stock.naver.com${apiPath}${qs}`

    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Referer':    'https://m.stock.naver.com',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
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
      body: JSON.stringify({ error: '네이버 모바일 프록시 오류', detail: String(err) }),
    }
  }
}
