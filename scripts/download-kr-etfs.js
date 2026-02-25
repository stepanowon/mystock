/**
 * 네이버 금융 ETF 목록 API에서 국내 ETF 전체 목록을 받아
 * src/data/kr-etfs.json 으로 저장합니다.
 *
 * 인증 불필요, 무료 공개 데이터
 * 사용법: node scripts/download-kr-etfs.js
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../src/data/kr-etfs.json')

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://finance.naver.com/sise/etf.naver',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9',
}

async function fetchNaverEtfList() {
  const url = 'https://finance.naver.com/api/sise/etfItemList.naver'
  console.log('  네이버 금융 ETF 목록 다운로드 중...')

  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`요청 실패: ${res.status}`)

  const buf = await res.arrayBuffer()
  let text
  try {
    text = new TextDecoder('euc-kr').decode(buf)
  } catch {
    text = new TextDecoder('utf-8').decode(buf)
  }
  const json = JSON.parse(text)

  // 응답 구조: { result: { etfItemList: [...] } }
  const items = json?.result?.etfItemList
  if (!Array.isArray(items) || items.length === 0) {
    console.error('  ⚠ 응답 미리보기:', JSON.stringify(json).slice(0, 500))
    throw new Error('ETF 목록 파싱 실패')
  }

  const etfs = items
    .filter((item) => item.itemcode && item.itemname)
    .map((item) => ({
      symbol: String(item.itemcode).trim(),
      name: String(item.itemname).trim(),
      market: 'KRX',
      currency: 'KRW',
      assetType: 'etf',
    }))

  console.log(`  → ${etfs.length}개 ETF 파싱 완료`)
  return etfs
}

async function main() {
  console.log('📥 네이버 금융에서 국내 ETF 목록 다운로드\n')

  const etfs = await fetchNaverEtfList()
  if (!etfs.length) throw new Error('ETF 데이터 없음')

  writeFileSync(OUTPUT_PATH, JSON.stringify(etfs, null, 2), 'utf-8')
  console.log(`\n✅ 완료: ${etfs.length}개 ETF → ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error('\n❌ 실패:', err.message)
  process.exit(1)
})
