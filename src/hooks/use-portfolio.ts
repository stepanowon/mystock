import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { portfolioRepo } from '@/services/firebase/portfolio-repo'
import type { PortfolioItem } from '@/types'

export function usePortfolio() {
  const user = useAuthStore((s) => s.user)
  const uid = user?.uid ?? ''

  return useQuery({
    queryKey: ['portfolio', uid],
    queryFn: () => portfolioRepo.getAll(uid),
    enabled: !!uid,
  })
}

export function useAddPortfolioItem() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: (data: Omit<PortfolioItem, 'id'>) =>
      portfolioRepo.create(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', uid] })
    },
  })
}

export function useUpdatePortfolioItem() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PortfolioItem> }) =>
      portfolioRepo.update(uid, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', uid] })
    },
  })
}

export function useDeletePortfolioItem() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: (id: string) => portfolioRepo.remove(uid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', uid] })
    },
  })
}
