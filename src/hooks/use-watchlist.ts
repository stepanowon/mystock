import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { watchlistRepo } from '@/services/firebase/watchlist-repo'
import type { WatchlistItem } from '@/types'

export function useWatchlist() {
  const user = useAuthStore((s) => s.user)
  const uid = user?.uid ?? ''

  return useQuery({
    queryKey: ['watchlist', uid],
    queryFn: () => watchlistRepo.getAll(uid),
    enabled: !!uid,
  })
}

export function useAddWatchlistItem() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: (data: Omit<WatchlistItem, 'id'>) =>
      watchlistRepo.create(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', uid] })
    },
  })
}

export function useRemoveWatchlistItem() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const uid = user?.uid ?? ''

  return useMutation({
    mutationFn: (id: string) => watchlistRepo.remove(uid, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', uid] })
    },
  })
}
