import { clsx } from 'clsx'

interface BadgeProps {
  readonly variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  readonly children: string
}

const variantClasses = {
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-800',
} as const

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
      )}
    >
      {children}
    </span>
  )
}
