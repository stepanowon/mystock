import { useState, useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { clsx } from 'clsx'
import { Spinner } from '@/components/ui/Spinner'
import { useStockHistory } from '@/hooks/use-stock-history'
import type { MarketType, Currency, HistoricalDataPoint } from '@/types'

// ─── 차트 탭 정의 ─────────────────────────────────────────────────────────────
type ChartTab = '일' | '주' | '월' | '연'

interface TabConfig {
  readonly label: string
  readonly range: string      // Yahoo Finance range 파라미터
  readonly interval: string   // Yahoo Finance interval 파라미터
  readonly cutoffMonths?: number  // 프론트 필터: 최근 N개월만 표시
  readonly aggregate?: 'yearly'
}

function monthsAgo(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}

const TABS: Record<ChartTab, TabConfig> = {
  // 1년 fetch → 최근 8개월만 표시
  '일': { label: '일봉', range: '1y',   interval: '1d',  cutoffMonths: 8 },
  // 5년 fetch → 최근 4년(48개월)만 표시, 주봉
  '주': { label: '주봉', range: '5y',   interval: '1wk', cutoffMonths: 48 },
  // 10년 월봉 그대로
  '월': { label: '월봉', range: '10y',  interval: '1mo' },
  // 최대(IPO~현재) fetch → 분기 데이터를 연간으로 집계
  '연': { label: '연봉', range: 'max',  interval: '3mo', aggregate: 'yearly' },
}

// ─── 연간 집계 (분기봉 → 연봉) ────────────────────────────────────────────────
function aggregateToYearly(data: HistoricalDataPoint[]): HistoricalDataPoint[] {
  const byYear = new Map<number, HistoricalDataPoint[]>()
  for (const p of data) {
    const year = new Date(p.date).getFullYear()
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(p)
  }
  return Array.from(byYear.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, pts]) => ({
      date: new Date(year, 0, 2).toISOString(),
      open:   pts[0]!.open,
      high:   Math.max(...pts.map((p) => p.high)),
      low:    Math.min(...pts.map((p) => p.low)),
      close:  pts[pts.length - 1]!.close,
      volume: pts.reduce((s, p) => s + p.volume, 0),
    }))
}

// ─── 이동평균 (가격) ──────────────────────────────────────────────────────────
const MA_LINES = [
  { key: 'ma5',   period: 5,   label: 'MA5',   color: '#f97316' },
  { key: 'ma20',  period: 20,  label: 'MA20',  color: '#3b82f6' },
  { key: 'ma60',  period: 60,  label: 'MA60',  color: '#22c55e' },
  { key: 'ma120', period: 120, label: 'MA120', color: '#a855f7' },
] as const

type MaKey = typeof MA_LINES[number]['key']

function calcMA(data: HistoricalDataPoint[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p.close, 0)
    return sum / period
  })
}

// ─── 이동평균 (거래량) ────────────────────────────────────────────────────────
function calcVolumeMA(data: HistoricalDataPoint[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p.volume, 0)
    return sum / period
  })
}

// ─── X축 날짜 포맷 ────────────────────────────────────────────────────────────
function formatXAxis(dateStr: string, tab: ChartTab): string {
  const d = new Date(dateStr)
  if (tab === '일') return `${d.getMonth() + 1}/${d.getDate()}`
  if (tab === '주') return `${String(d.getFullYear()).slice(2)}/${d.getMonth() + 1}/${d.getDate()}`
  if (tab === '월') return `${String(d.getFullYear()).slice(2)}/${d.getMonth() + 1}`
  return String(d.getFullYear())
}

// ─── 가격 포맷 ────────────────────────────────────────────────────────────────
function formatPrice(value: number, currency: Currency): string {
  if (currency === 'KRW') return `₩${value.toLocaleString()}`
  return `$${value.toFixed(2)}`
}

function formatYAxis(value: number, currency: Currency): string {
  if (currency === 'KRW') {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
    return String(Math.round(value))
  }
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`
  return `$${value.toFixed(2)}`
}

// ─── 거래량 포맷 ──────────────────────────────────────────────────────────────
function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(Math.round(value))
}

// ─── OHLC 툴팁 ───────────────────────────────────────────────────────────────
interface TooltipPayload {
  payload: HistoricalDataPoint & Record<MaKey, number | null> & { vma20: number | null }
}
interface CandleTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  currency: Currency
  tab: ChartTab
  activeMas: ReadonlySet<MaKey>
}

function CandleTooltip({ active, payload, label, currency, tab, activeMas }: CandleTooltipProps) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  const isUp = d.close >= d.open
  const visibleMas = MA_LINES.filter((ma) => activeMas.has(ma.key) && d[ma.key] != null)
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-gray-600">{formatXAxis(label ?? '', tab)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-gray-400">시가</span>
        <span className="text-right">{formatPrice(d.open, currency)}</span>
        <span className="text-gray-400">고가</span>
        <span className="text-right text-red-500">{formatPrice(d.high, currency)}</span>
        <span className="text-gray-400">저가</span>
        <span className="text-right text-blue-500">{formatPrice(d.low, currency)}</span>
        <span className="text-gray-400">종가</span>
        <span className={clsx('text-right font-semibold', isUp ? 'text-red-500' : 'text-blue-500')}>
          {formatPrice(d.close, currency)}
        </span>
        <span className="text-gray-400">거래량</span>
        <span className="text-right">{formatVolume(d.volume)}</span>
      </div>
      {visibleMas.length > 0 && (
        <div className="mt-1.5 border-t border-gray-100 pt-1.5 space-y-0.5">
          {visibleMas.map((ma) => (
            <div key={ma.key} className="flex items-center justify-between gap-4">
              <span style={{ color: ma.color }} className="font-medium">{ma.label}</span>
              <span>{formatPrice(d[ma.key]!, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 캔들 shape 팩토리 ────────────────────────────────────────────────────────
function makeCandleShape(domainMin: number, domainMax: number) {
  return function CandleShape(props: Record<string, unknown>) {
    const x       = props.x as number
    const width   = props.width as number
    const bg      = props.background as { y: number; height: number } | undefined
    const payload = props.payload as HistoricalDataPoint | undefined

    if (!payload || !bg?.height) return null
    const { open, high, low, close } = payload
    if (!close || !open || !high || !low) return null

    const span = domainMax - domainMin
    if (span <= 0) return null

    const toY = (v: number) => bg.y + bg.height * (1 - (v - domainMin) / span)

    const highY  = toY(high)
    const lowY   = toY(low)
    const openY  = toY(open)
    const closeY = toY(close)

    const isUp    = close >= open
    const color   = isUp ? '#ef4444' : '#3b82f6'
    const cx      = x + width / 2
    const bW      = Math.max(width * 0.6, 2)
    const bX      = cx - bW / 2
    const bodyTop = Math.min(openY, closeY)
    const bodyH   = Math.max(Math.abs(closeY - openY), 1)

    return (
      <g>
        <line x1={cx} y1={highY}          x2={cx} y2={bodyTop}        stroke={color} strokeWidth={1} />
        <rect x={bX}  y={bodyTop}          width={bW} height={bodyH}  fill={color} stroke={color} strokeWidth={0.5} />
        <line x1={cx} y1={bodyTop + bodyH} x2={cx} y2={lowY}          stroke={color} strokeWidth={1} />
      </g>
    )
  }
}

// ─── 거래량 바 shape ──────────────────────────────────────────────────────────
function VolumeBar(props: Record<string, unknown>) {
  const x       = props.x as number
  const y       = props.y as number
  const width   = props.width as number
  const height  = props.height as number
  const payload = props.payload as HistoricalDataPoint | undefined
  if (!payload || height <= 0) return null
  const isUp  = payload.close >= payload.open
  const color = isUp ? '#ef4444' : '#3b82f6'
  return <rect x={x} y={y} width={Math.max(width - 1, 1)} height={height} fill={color} fillOpacity={0.7} />
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
interface StockChartProps {
  readonly symbol: string
  readonly market: MarketType
  readonly currency: Currency
}

export function StockChart({ symbol, market, currency }: StockChartProps) {
  const [tab, setTab]           = useState<ChartTab>('일')
  const [activeMas, setActiveMas] = useState<ReadonlySet<MaKey>>(
    new Set<MaKey>(['ma5', 'ma20', 'ma60', 'ma120']),
  )

  const config = TABS[tab]
  const { data, isLoading } = useStockHistory(symbol, market, config.range, config.interval)

  // 유효 캔들 필터 + 연봉 집계 (cutoff 적용 전 전체 데이터 — MA 계산용)
  const allPoints = useMemo(() => {
    const valid = data?.filter((p) => p.close > 0 && p.open > 0 && p.high > 0 && p.low > 0) ?? []
    return config.aggregate === 'yearly' ? aggregateToYearly(valid) : valid
  }, [data, config.aggregate])

  // 이동평균(가격 + 거래량)을 전체 데이터 기준 계산 후 cutoffMonths로 잘라서 표시
  const enrichedPoints = useMemo(() => {
    if (!allPoints.length) return []
    const maValues = Object.fromEntries(
      MA_LINES.map((ma) => [ma.key, calcMA(allPoints, ma.period)]),
    )
    const vma20Values = calcVolumeMA(allPoints, 20)
    const enriched = allPoints.map((p, i) =>
      Object.assign(
        {},
        p,
        Object.fromEntries(MA_LINES.map((ma) => [ma.key, maValues[ma.key]![i]])),
        { vma20: vma20Values[i] },
      )
    )
    if (!config.cutoffMonths) return enriched
    const cutoff = monthsAgo(config.cutoffMonths)
    return enriched.filter((p) => new Date(p.date) >= cutoff)
  }, [allPoints, config.cutoffMonths])

  const [domainMin, domainMax] = useMemo(() => {
    if (!enrichedPoints.length) return [0, 1]
    const min = Math.min(...enrichedPoints.map((p) => p.low))
    const max = Math.max(...enrichedPoints.map((p) => p.high))
    const pad = (max - min) * 0.05
    return [min - pad, max + pad]
  }, [enrichedPoints])

  const CandleShape = useMemo(
    () => makeCandleShape(domainMin, domainMax),
    [domainMin, domainMax],
  )

  function toggleMa(key: MaKey) {
    setActiveMas((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const yAxisWidth = 54
  const chartMargin = { top: 4, right: 4, left: 0, bottom: 0 }

  return (
    <div className="space-y-3">
      {/* 상단: 봉 종류 탭 + 이동평균 토글 */}
      <div className="flex items-center justify-between gap-2">
        {/* 일/주/월/연 탭 */}
        <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
          {(Object.keys(TABS) as ChartTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={clsx(
                'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                tab === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {TABS[t].label}
            </button>
          ))}
        </div>

        {/* 이동평균 토글 */}
        <div className="flex gap-1.5">
          {MA_LINES.map((ma) => (
            <button
              key={ma.key}
              type="button"
              onClick={() => toggleMa(ma.key)}
              className={clsx(
                'flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium transition-opacity',
                activeMas.has(ma.key) ? 'opacity-100' : 'opacity-25',
              )}
            >
              <span className="inline-block h-1.5 w-3.5 rounded-full" style={{ backgroundColor: ma.color }} />
              {ma.label}
            </button>
          ))}
        </div>
      </div>

      {/* 로딩 / 데이터 없음 */}
      {isLoading ? (
        <div className="flex h-80 items-center justify-center">
          <Spinner />
        </div>
      ) : enrichedPoints.length === 0 ? (
        <div className="flex h-80 items-center justify-center text-sm text-gray-400">
          차트 데이터 없음
        </div>
      ) : (
        <>
          {/* 가격 차트 */}
          <div className="h-48 md:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedPoints} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={[domainMin, domainMax]}
                  tickFormatter={(v) => formatYAxis(v as number, currency)}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={yAxisWidth}
                />
                <Tooltip
                  content={<CandleTooltip currency={currency} tab={tab} activeMas={activeMas} />}
                />
                <Bar
                  dataKey="close"
                  shape={CandleShape as never}
                  isAnimationActive={false}
                />
                {MA_LINES.filter((ma) => activeMas.has(ma.key)).map((ma) => (
                  <Line
                    key={ma.key}
                    type="monotone"
                    dataKey={ma.key}
                    stroke={ma.color}
                    strokeWidth={1.2}
                    dot={false}
                    activeDot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-500" />

          {/* 거래량 차트 */}
          <div className="relative h-20 md:h-24">
            <span className="absolute left-14 top-0 z-10 text-[10px] font-bold text-gray-900">거래량</span>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedPoints} margin={chartMargin}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatXAxis(v as string, tab)}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={(v) => formatVolume(v as number)}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={yAxisWidth}
                  tickCount={3}
                />
                <Bar
                  dataKey="volume"
                  shape={VolumeBar as never}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="vma20"
                  stroke="#f97316"
                  strokeWidth={1}
                  dot={false}
                  activeDot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
