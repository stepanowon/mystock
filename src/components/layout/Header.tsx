import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:h-16 md:px-6">
      {/* 모바일: 앱 타이틀 표시 / 데스크톱: 빈 공간 */}
      <h1 className="text-lg font-bold text-blue-600 md:hidden">MyStock</h1>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2 md:gap-4">
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt={user.displayName ?? 'Profile'}
            className="h-8 w-8 rounded-full"
          />
        )}
        <span className="hidden text-sm text-gray-600 md:block">
          {user?.displayName ?? user?.email}
        </span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          로그아웃
        </Button>
      </div>
    </header>
  )
}
