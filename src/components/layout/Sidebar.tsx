import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', label: '대시보드', icon: '📊' },
  { to: '/portfolio', label: '포트폴리오', icon: '💼' },
  { to: '/search', label: '종목 검색', icon: '🔍' },
  { to: '/settings', label: '설정', icon: '⚙️' },
] as const

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-blue-600">MyStock</h1>
      </div>
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
