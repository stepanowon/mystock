import { create } from 'zustand'
import type { User } from 'firebase/auth'

interface AuthState {
  readonly user: User | null
  readonly isAuthenticated: boolean
  readonly isLoading: boolean
  readonly setUser: (user: User | null) => void
  readonly setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
    }),
  setLoading: (isLoading) => set({ isLoading }),
}))
