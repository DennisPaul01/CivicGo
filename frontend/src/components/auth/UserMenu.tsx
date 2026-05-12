import { Link } from 'react-router-dom'
import { Handshake, LayoutDashboard, LogOut, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function UserMenu() {
  const status = useAuthStore((state) => state.status)
  const profile = useAuthStore((state) => state.profile)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    clearAuth()
  }

  if (status === 'authenticated') {
    const isAdmin = profile?.role === 'admin'
    const isPartner = profile?.role === 'partner'

    return (
      <div className="flex shrink-0 items-center gap-1">
        {isAdmin ? (
          <Button
            variant="outline"
            size="icon-sm"
            className="sm:h-7 sm:w-auto sm:px-2.5"
            asChild
          >
            <Link to="/admin/dashboard" aria-label="Open admin dashboard">
              <LayoutDashboard aria-hidden="true" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
        ) : null}
        {isPartner ? (
          <Button
            variant="outline"
            size="icon-sm"
            className="sm:h-7 sm:w-auto sm:px-2.5"
            asChild
          >
            <Link to="/partner" aria-label="Open partner dashboard">
              <Handshake aria-hidden="true" />
              <span className="hidden sm:inline">Partner</span>
            </Link>
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="icon-sm"
          className="sm:h-7 sm:w-auto sm:px-2.5"
          asChild
        >
          <Link to="/profile" aria-label="Open profile">
            <UserCircle data-icon="inline-start" aria-hidden="true" />
            <span className="hidden max-w-32 truncate sm:inline">
              {profile?.fullName ?? 'Profile'}
            </span>
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <LogOut aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/login">
        <UserCircle data-icon="inline-start" aria-hidden="true" />
        Login
      </Link>
    </Button>
  )
}
