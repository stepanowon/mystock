import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바: 데스크톱에서만 표시 */}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {/* 모바일 하단 네비게이션 높이(4rem)만큼 패딩 추가 */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>
      {/* 하단 탭바: 모바일에서만 표시 */}
      <MobileNav />
    </div>
  )
}
