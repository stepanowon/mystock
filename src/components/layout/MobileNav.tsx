import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/portfolio', label: '포트폴리오', icon: '💼' },
  { to: '/search', label: '검색', icon: '🔍' },
  { to: '/settings', label: '설정', icon: '⚙️' },
] as const

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-gray-200 bg-white md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            clsx(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive ? 'text-blue-600' : 'text-gray-500',
            )
          }
        >
          <span className="text-xl">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
