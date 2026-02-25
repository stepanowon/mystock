import { clsx } from 'clsx'

interface SpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg'
  readonly className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
