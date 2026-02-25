import { useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/use-auth'
import { registerSchema, type RegisterFormData } from './auth-validation'

export function RegisterForm() {
  const { signUp } = useAuth()
  const [formData, setFormData] = useState<RegisterFormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(field: keyof RegisterFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError('')

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    try {
      setIsLoading(true)
      await signUp(result.data.email, result.data.password, result.data.displayName)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : '회원가입에 실패했습니다',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="이름"
        type="text"
        placeholder="홍길동"
        value={formData.displayName}
        onChange={(e) => handleChange('displayName', e.target.value)}
        error={errors.displayName}
        autoComplete="name"
      />
      <Input
        label="이메일"
        type="email"
        placeholder="name@example.com"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label="비밀번호"
        type="password"
        placeholder="8자 이상"
        value={formData.password}
        onChange={(e) => handleChange('password', e.target.value)}
        error={errors.password}
        autoComplete="new-password"
      />
      <Input
        label="비밀번호 확인"
        type="password"
        placeholder="비밀번호를 다시 입력"
        value={formData.confirmPassword}
        onChange={(e) => handleChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />
      {submitError && (
        <p className="text-sm text-red-600">{submitError}</p>
      )}
      <Button type="submit" className="w-full" isLoading={isLoading}>
        회원가입
      </Button>
    </form>
  )
}
