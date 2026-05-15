import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Leaf } from '@/components/icons/hugeicons'
import { useAuthStore } from '@/stores/authStore'

type ProtectedRouteProps = {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="flex min-h-svh items-center justify-center bg-orange-50 px-4 text-emerald-950">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <Leaf className="size-4 animate-pulse" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold">Verificam sesiunea</span>
        </div>
      </main>
    )
  }

  if (status !== 'authenticated') {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  return children
}
