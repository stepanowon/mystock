import { getKrEtfBySymbol } from '@/data/kr-etfs'
import type { HoldingReturn } from '@/types'

const ETF_NAME_KEYWORDS = [
  'KODEX', 'TIGER', 'PLUS', 'KINDEX', 'KOSEF', 'ACE', 'HANARO',
  'ARIRANG', 'TIMEFOLIO', 'KBSTAR', 'SOL', 'SMART', 'TREX',
]

export function isEtfHolding(h: HoldingReturn): boolean {
  if (getKrEtfBySymbol(h.symbol)) return true
  const nameUpper = h.name.toUpperCase()
  return ETF_NAME_KEYWORDS.some((kw) => nameUpper.includes(kw))
}
