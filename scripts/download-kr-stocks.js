/**
 * KIND(기업공시채널)에서 KOSPI/KOSDAQ 전체 종목 목록을 받아
 * src/data/kr-stocks.json 으로 저장합니다.
 *
 * 인증 불필요, 무료 공개 데이터
 * 사용법: node scripts/download-kr-stocks.js
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../src/data/kr-stocks.json')

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://kind.krx.co.kr/corpgeneral/corpList.do',
  'Accept': 'text/html,application/xhtml+xml,*/*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
}

// KIND에서 시장별 종목 목록 HTML(Excel 형식) 다운로드
async function fetchKIND(marketType, label) {
  const url = `https://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13&marketType=${marketType}`
  console.log(`  [${label}] 다운로드 중...`)

  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${label} 요청 실패: ${res.status}`)

  const buf = await res.arrayBuffer()

  // EUC-KR 인코딩 대응
  let html
  try {
    html = new TextDecoder('euc-kr').decode(buf)
  } catch {
    html = new TextDecoder('utf-8').decode(buf)
  }

  return parseHtmlTable(html, label)
}

// HTML 테이블에서 종목코드/종목명 추출
function parseHtmlTable(html, label) {
  const rows = []

  // <tr> 블록 추출
  const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi
  const thPattern = /<th[^>]*>([\s\S]*?)<\/th>/gi

  let headerCols = []
  let isFirstRow = true

  let trMatch
  while ((trMatch = trPattern.exec(html)) !== null) {
    const rowHtml = trMatch[1]

    // 헤더 행 (th 태그)
    if (isFirstRow || rowHtml.includes('<th')) {
      const ths = []
      let thMatch
      while ((thMatch = thPattern.exec(rowHtml)) !== null) {
        ths.push(stripTags(thMatch[1]))
      }
      if (ths.length > 0) {
        headerCols = ths
        isFirstRow = false
        continue
      }
    }

    // 데이터 행
    const cells = []
    let tdMatch
    while ((tdMatch = tdPattern.exec(rowHtml)) !== null) {
      cells.push(stripTags(tdMatch[1]))
    }
    if (!cells.length) continue

    // 컬럼 인덱스 탐색 (헤더가 없을 경우 고정 위치 사용)
    let nameIdx = headerCols.findIndex(h => /회사명|종목명/.test(h))
    let codeIdx = headerCols.findIndex(h => /종목코드/.test(h))
    if (nameIdx === -1) nameIdx = 0
    if (codeIdx === -1) codeIdx = 1

    const name   = cells[nameIdx]?.trim() ?? ''
    const symbol = cells[codeIdx]?.replace(/\s/g, '') ?? ''

    if (name && /^\d{6}$/.test(symbol)) {
      rows.push({ symbol, name, market: 'KRX', currency: 'KRW' })
    }
  }

  console.log(`  → ${rows.length}개 파싱 완료`)
  if (rows.length === 0) {
    // 디버깅: HTML 앞 500자 출력
    console.error('  ⚠ 파싱 실패. 응답 미리보기:', html.slice(0, 500))
    throw new Error(`${label} 파싱 실패`)
  }

  return rows
}

function stripTags(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

async function main() {
  console.log('📥 KIND(기업공시채널)에서 종목 목록 다운로드\n')

  const kospi  = await fetchKIND('stockMkt', 'KOSPI')
  const kosdaq = await fetchKIND('kosdaqMkt', 'KOSDAQ')

  const all = [...kospi, ...kosdaq]
  if (!all.length) throw new Error('종목 데이터 없음')

  writeFileSync(OUTPUT_PATH, JSON.stringify(all, null, 2), 'utf-8')
  console.log(`\n✅ 완료: ${all.length}개 종목 → ${OUTPUT_PATH}`)
  console.log(`   KOSPI ${kospi.length}개 / KOSDAQ ${kosdaq.length}개`)
}

main().catch(err => {
  console.error('\n❌ 실패:', err.message)
  process.exit(1)
})
