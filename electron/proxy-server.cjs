/**
 * Electron 프로덕션용 로컬 HTTP 서버
 * - dist/ 정적 파일 서빙 + SPA fallback
 * - /api/* 요청을 외부 API로 프록시 (vite.config.ts proxy 설정과 동일)
 */

const http  = require('http')
const https = require('https')
const fs    = require('fs')
const path  = require('path')
const { URL } = require('url')

// ─── MIME 타입 ────────────────────────────────────────────────────────────────
const MIME_TYPES = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.otf':   'font/otf',
  '.map':   'application/json',
}

// ─── API 프록시 라우트 (vite.config.ts 와 동일) ────────────────────────────
const PROXY_ROUTES = [
  {
    prefix: '/api/yahoo',
    target: 'https://query1.finance.yahoo.com',
    rewrite: (p) => p.replace(/^\/api\/yahoo/, ''),
    headers: {
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept':          'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer':         'https://finance.yahoo.com',
    },
  },
  {
    prefix: '/api/exchange-rate',
    target: 'https://open.er-api.com',
    rewrite: (p) => p.replace(/^\/api\/exchange-rate/, '/v6'),
    headers: {},
  },
  {
    prefix: '/api/naver-stock',
    target: 'https://ac.stock.naver.com',
    rewrite: (p) => p.replace(/^\/api\/naver-stock/, ''),
    headers: {
      'Referer':    'https://finance.naver.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  },
  {
    prefix: '/api/naver-mobile',
    target: 'https://m.stock.naver.com',
    rewrite: (p) => p.replace(/^\/api\/naver-mobile/, ''),
    headers: {
      'Referer':    'https://m.stock.naver.com',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    },
  },
]

// ─── API 프록시 처리 ──────────────────────────────────────────────────────────
function handleProxy(route, reqUrl, req, res) {
  const parsed      = new URL(reqUrl, 'http://localhost')
  const rewritePath = route.rewrite(parsed.pathname)
  const targetUrl   = new URL(route.target + rewritePath + parsed.search)

  const options = {
    hostname: targetUrl.hostname,
    port:     targetUrl.port || 443,
    path:     targetUrl.pathname + targetUrl.search,
    method:   req.method,
    headers:  {
      Accept: 'application/json',
      ...route.headers,
    },
  }

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type':                proxyRes.headers['content-type'] ?? 'application/json',
      'Access-Control-Allow-Origin': '*',
    })
    proxyRes.pipe(res)
  })

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: '프록시 오류', detail: String(err) }))
  })

  proxyReq.end()
}

// ─── 정적 파일 서빙 ───────────────────────────────────────────────────────────
function handleStatic(distPath, reqUrl, res) {
  const parsed   = new URL(reqUrl, 'http://localhost')
  let   filePath = path.join(distPath, parsed.pathname)

  // 디렉토리 or 파일 없음 → SPA fallback
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distPath, 'index.html')
  }

  const ext      = path.extname(filePath)
  const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not Found')
      return
    }
    res.writeHead(200, { 'Content-Type': mimeType })
    res.end(data)
  })
}

// ─── 서버 시작 ─────────────────────────────────────────────────────────────────
function startServer(distPath) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = req.url ?? '/'

      // prefix가 긴 라우트부터 매칭 (naver-stock vs naver-mobile 구분)
      const route = PROXY_ROUTES
        .slice()
        .sort((a, b) => b.prefix.length - a.prefix.length)
        .find((r) => reqUrl.startsWith(r.prefix))

      if (route) {
        handleProxy(route, reqUrl, req, res)
      } else {
        handleStatic(distPath, reqUrl, res)
      }
    })

    // 포트 0 = OS가 빈 포트 자동 할당 → 충돌 없음
    server.listen(0, 'localhost', () => {
      const port = server.address().port
      resolve({ server, port })
    })

    server.on('error', reject)
  })
}

module.exports = { startServer }
