import type { Handler } from '@netlify/functions'

/**
 * Yahoo Finance 프록시
 * /api/yahoo/* → https://query1.finance.yahoo.com/*
 */
export const handler: Handler = async (event) => {
  try {
    const apiPath = event.path.replace('/.netlify/functions/yahoo', '')
    const qs      = event.rawQuery ? `?${event.rawQuery}` : ''
    const url     = `https://query1.finance.yahoo.com${apiPath}${qs}`

    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer':         'https://finance.yahoo.com',
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
      body: JSON.stringify({ error: 'Yahoo Finance 프록시 오류', detail: String(err) }),
    }
  }
}
