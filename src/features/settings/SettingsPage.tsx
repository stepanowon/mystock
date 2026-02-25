import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth-store'
import { signOut } from '@/services/firebase/auth-service'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  async function handleLogout() {
    try {
      await signOut()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">설정</h2>

      <Card>
        <CardHeader title="프로필" />
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? '프로필'}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              {(user?.displayName ?? user?.email ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">
              {user?.displayName ?? '사용자'}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="계정" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">로그아웃</p>
              <p className="text-xs text-gray-500">
                현재 계정에서 로그아웃합니다
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
