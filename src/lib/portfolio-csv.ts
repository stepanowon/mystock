import { addHoldingSchema } from '@/features/portfolio/portfolio-validation'
import type { AddHoldingFormData } from '@/features/portfolio/portfolio-validation'
import type { PortfolioItem } from '@/types'

// ─── 내보내기 ─────────────────────────────────────────────────────────────────
const CSV_HEADERS = ['symbol', 'name', 'market', 'currency', 'avgPrice', 'quantity']

function escapeCsvValue(value: string | number): string {
  const str = String(value)
  // 쉼표·따옴표·줄바꿈이 포함된 경우 큰따옴표로 감싸고 내부 따옴표 이스케이프
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function exportPortfolioCsv(items: readonly PortfolioItem[]): void {
  const rows = [
    CSV_HEADERS.join(','),
    ...items.map((item) =>
      [
        escapeCsvValue(item.symbol),
        escapeCsvValue(item.name),
        escapeCsvValue(item.market),
        escapeCsvValue(item.currency),
        escapeCsvValue(item.avgPrice),
        escapeCsvValue(item.quantity),
      ].join(',')
    ),
  ]

  // BOM(﻿) 추가로 Excel에서 한글 깨짐 방지
  const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  anchor.href = url
  anchor.download = `portfolio_${date}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

// ─── 가져오기 ─────────────────────────────────────────────────────────────────
export interface CsvRowError {
  readonly row: number
  readonly raw: string
  readonly message: string
}

export interface CsvParseResult {
  readonly valid: readonly AddHoldingFormData[]
  readonly errors: readonly CsvRowError[]
}

/** RFC 4180 준수 CSV 한 줄 파싱 */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parsePortfolioCsv(csvText: string): CsvParseResult {
  // BOM 제거, Windows 줄바꿈 정규화
  const normalized = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)

  const valid: AddHoldingFormData[] = []
  const errors: CsvRowError[] = []

  // 헤더 행 건너뜀
  const startIndex = lines[0]?.toLowerCase().startsWith('symbol') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]!
    const cols = parseCsvLine(line)
    const [symbol, name, market, currency, avgPriceStr, quantityStr] = cols

    const parsed = addHoldingSchema.safeParse({
      symbol,
      name,
      market,
      currency,
      avgPrice: Number(avgPriceStr),
      quantity: Number(quantityStr),
    })

    if (parsed.success) {
      valid.push(parsed.data)
    } else {
      errors.push({
        row: i + 1,
        raw: line,
        message: parsed.error.errors.map((e) => e.message).join(', '),
      })
    }
  }

  return { valid, errors }
}
