import { Input } from '@/components/ui/Input'

interface SearchBarProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = '종목명 또는 티커 검색 (예: AAPL, 삼성전자)',
}: SearchBarProps) {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    />
  )
}
