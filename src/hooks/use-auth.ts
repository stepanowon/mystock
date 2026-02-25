import { useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  resetPassword,
} from '@/services/firebase/auth-service'

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  const handleSignUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      await signUpWithEmail(email, password, displayName)
    },
    [],
  )

  const handleSignIn = useCallback(
    async (email: string, password: string) => {
      await signInWithEmail(email, password)
    },
    [],
  )

  const handleGoogleSignIn = useCallback(async () => {
    await signInWithGoogle()
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [])

  const handleResetPassword = useCallback(async (email: string) => {
    await resetPassword(email)
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  }
}
