import { useState, useRef } from 'react'
import { Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/Button'
import { useAddPortfolioItem } from '@/hooks/use-portfolio'
import { parsePortfolioCsv } from '@/lib/portfolio-csv'
import type { CsvParseResult } from '@/lib/portfolio-csv'

interface PortfolioCsvModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
}

export function PortfolioCsvModal({ isOpen, onClose }: PortfolioCsvModalProps) {
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addItem = useAddPortfolioItem()

  if (!isOpen) return null

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setParseResult(parsePortfolioCsv(text))
      setImportedCount(null)
      setImportError(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handleImport() {
    if (!parseResult?.valid.length) return
    setIsImporting(true)
    setImportError(null)
    try {
      for (const row of parseResult.valid) {
        await addItem.mutateAsync({
          symbol:    row.symbol,
          name:      row.name,
          market:    row.market,
          currency:  row.currency,
          avgPrice:  row.avgPrice,
          quantity:  row.quantity,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }
      setImportedCount(parseResult.valid.length)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '가져오기 중 오류가 발생했습니다.')
    } finally {
      setIsImporting(false)
    }
  }

  function handleClose() {
    setParseResult(null)
    setImportedCount(null)
    setImportError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const canImport = parseResult && parseResult.valid.length > 0 && importedCount === null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">CSV 가져오기</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* 형식 안내 */}
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">CSV 형식 (첫 줄은 헤더)</p>
            <code className="block text-gray-600 font-mono">
              symbol,name,market,currency,avgPrice,quantity
            </code>
            <p className="text-gray-500">
              market: <span className="font-medium">KRX</span> /
              <span className="font-medium"> NYSE</span> /
              <span className="font-medium"> NASDAQ</span>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              currency: <span className="font-medium">KRW</span> /
              <span className="font-medium"> USD</span>
            </p>
          </div>

          {/* 파일 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CSV 파일 선택
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-3 file:rounded file:border-0
                file:bg-gray-100 file:px-3 file:py-1.5
                file:text-sm file:font-medium file:text-gray-700
                hover:file:bg-gray-200 cursor-pointer"
            />
          </div>

          {/* 파싱 결과 */}
          {parseResult && (
            <div className="space-y-3">
              {/* 요약 */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  ✓ 유효 {parseResult.valid.length}개
                </span>
                {parseResult.errors.length > 0 && (
                  <span className="text-red-500 font-medium">
                    ✕ 오류 {parseResult.errors.length}개
                  </span>
                )}
              </div>

              {/* 유효 행 미리보기 */}
              {parseResult.valid.length > 0 && (
                <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        {['종목코드', '종목명', '시장', '통화', '평균 매수가', '수량'].map((h) => (
                          <th key={h} className="px-2.5 py-2 text-left font-medium text-gray-500 first:pl-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.valid.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2.5 py-1.5 pl-3 font-medium text-gray-900">{row.symbol}</td>
                          <td className="px-2.5 py-1.5 text-gray-600">{row.name}</td>
                          <td className="px-2.5 py-1.5 text-gray-600">{row.market}</td>
                          <td className="px-2.5 py-1.5 text-gray-600">{row.currency}</td>
                          <td className="px-2.5 py-1.5 text-right text-gray-900">
                            {row.avgPrice.toLocaleString()}
                          </td>
                          <td className="px-2.5 py-1.5 text-right text-gray-900">{row.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 오류 행 */}
              {parseResult.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 space-y-1">
                  <p className="text-xs font-semibold text-red-600">오류 행 (가져오기에서 제외됩니다)</p>
                  {parseResult.errors.map((e) => (
                    <p key={e.row} className="text-xs text-red-500">
                      {e.row}행: {e.message}
                    </p>
                  ))}
                </div>
              )}

              {/* 완료 메시지 */}
              {importedCount !== null && (
                <p className="text-sm font-medium text-green-600">
                  ✓ {importedCount}개 종목을 포트폴리오에 추가했습니다.
                </p>
              )}

              {/* 에러 메시지 */}
              {importError && (
                <p className="text-sm text-red-500">{importError}</p>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <Button variant="secondary" onClick={handleClose}>
            닫기
          </Button>
          {canImport && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting
                ? '가져오는 중...'
                : `${parseResult.valid.length}개 종목 가져오기`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
