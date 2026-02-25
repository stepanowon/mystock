import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { useAddPortfolioItem } from '@/hooks/use-portfolio'
import { useStockSearch } from '@/hooks/use-stock-search'
import { useDebounce } from '@/hooks/use-debounce'
import { addHoldingSchema } from './portfolio-validation'
import { SEARCH_DEBOUNCE_MS } from '@/config/constants'
import type { MarketType, Currency, StockSearchResult } from '@/types'

interface AddHoldingModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function AddHoldingModal({ isOpen, onClose }: AddHoldingModalProps) {
  const addItem = useAddPortfolioItem()

  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [market, setMarket] = useState<MarketType>('NYSE')
  const [avgPrice, setAvgPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [manualMode, setManualMode] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS)
  const { data: searchResults, isFetching } = useStockSearch(debouncedSearch)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debouncedSearch.length >= 2) setShowDropdown(true)
    else setShowDropdown(false)
  }, [debouncedSearch])

  function selectStock(stock: StockSearchResult) {
    setSymbol(stock.symbol)
    setName(stock.name)
    setMarket(stock.market)
    setSearchQuery(stock.name)
    setShowDropdown(false)
    setErrors({})
  }

  function resetForm() {
    setSearchQuery('')
    setSymbol('')
    setName('')
    setMarket('NYSE')
    setAvgPrice('')
    setQuantity('')
    setErrors({})
    setShowDropdown(false)
    setManualMode(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function enableManualMode() {
    setManualMode(true)
    setShowDropdown(false)
    setSymbol('')
    setName('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!symbol) {
      setErrors({ symbol: '종목 코드를 입력해주세요.' })
      return
    }

    const currency: Currency = market === 'KRX' ? 'KRW' : 'USD'
    const data = {
      symbol: symbol.toUpperCase(),
      name: name || symbol.toUpperCase(),
      market,
      currency,
      avgPrice: Number(avgPrice),
      quantity: Number(quantity),
    }

    const result = addHoldingSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      await addItem.mutateAsync({
        ...result.data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      resetForm()
      onClose()
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : '등록에 실패했습니다',
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="보유 종목 추가">
      <form onSubmit={handleSubmit} className="space-y-4">

        {!manualMode ? (
          <>
            {/* 검색 모드 */}
            <div className="relative" ref={dropdownRef}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                종목 검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="종목명 또는 코드 (예: 삼성전자, KODEX200, 005930)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (symbol) {
                      setSymbol('')
                      setName('')
                    }
                  }}
                  onFocus={() => {
                    if (debouncedSearch.length >= 2) setShowDropdown(true)
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isFetching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>

              {/* 검색 결과 드롭다운 */}
              {showDropdown && (searchResults?.length ?? 0) > 0 && (
                <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {searchResults!.map((stock) => (
                    <li key={`${stock.symbol}-${stock.market}`}>
                      <button
                        type="button"
                        onClick={() => selectStock(stock)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <div>
                          <span className="font-medium text-gray-900">{stock.symbol}</span>
                          <span className="ml-2 text-gray-500">{stock.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Badge>{stock.market}</Badge>
                          {stock.assetType === 'etf' && <Badge variant="info">ETF</Badge>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* 검색 결과 없음 */}
              {showDropdown && !isFetching && (searchResults?.length === 0) && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-3 shadow-lg">
                  <p className="text-sm text-gray-500">검색 결과 없음</p>
                  <p className="mt-1 text-xs text-gray-400">
                    로컬 DB에 없는 종목은 직접 입력하기를 이용하세요.
                  </p>
                </div>
              )}
            </div>

            {/* 선택된 종목 */}
            {symbol && (
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm">
                <span className="font-medium text-blue-700">{symbol}</span>
                <span className="mx-2 text-blue-400">·</span>
                <span className="text-blue-600">{name}</span>
                <span className="mx-2 text-blue-400">·</span>
                <Badge variant="info">{market}</Badge>
              </div>
            )}

            {errors.symbol && (
              <p className="text-xs text-red-600">{errors.symbol}</p>
            )}

            {/* 직접 입력 전환 */}
            <button
              type="button"
              onClick={enableManualMode}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              검색이 안 되나요? 직접 입력하기
            </button>
          </>
        ) : (
          <>
            {/* 직접 입력 모드 */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              국내 주식/ETF: 종목 코드 6자리 (예: 005930, 069500), 시장: KRX<br />
              미국 주식: 티커 (예: AAPL), 시장: NYSE 또는 NASDAQ
            </div>

            <Input
              label="종목 코드"
              placeholder="005930, AAPL"
              value={symbol}
              onChange={(e) => {
                const val = e.target.value
                setSymbol(val)
                // 6자리 숫자 → 한국 종목 코드 자동 감지
                if (/^\d{6}$/.test(val.trim())) setMarket('KRX')
              }}
              error={errors.symbol}
            />
            <Input
              label="종목명"
              placeholder="삼성전자, Apple Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">시장</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value as MarketType)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="KRX">KRX (한국)</option>
                <option value="NYSE">NYSE (미국)</option>
                <option value="NASDAQ">NASDAQ (미국)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              ← 검색으로 돌아가기
            </button>
          </>
        )}

        <Input
          label={market === 'KRX' ? '평균 매수가 (원)' : '평균 매수가 (달러)'}
          type="number"
          step="0.01"
          placeholder={market === 'KRX' ? '75000' : '150.00'}
          value={avgPrice}
          onChange={(e) => setAvgPrice(e.target.value)}
          error={errors.avgPrice}
        />
        <Input
          label="수량"
          type="number"
          step="1"
          placeholder="10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={errors.quantity}
        />

        {errors.submit && (
          <p className="text-sm text-red-600">{errors.submit}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            취소
          </Button>
          <Button type="submit" className="flex-1" isLoading={addItem.isPending}>
            추가
          </Button>
        </div>
      </form>
    </Modal>
  )
}
