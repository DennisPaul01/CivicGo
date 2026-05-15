import { Link } from 'react-router-dom'
import { DropdownMenu } from 'radix-ui'
import {
  Handshake,
  LayoutDashboard,
  LogOut,
  UserCircle,
} from '@/components/icons/hugeicons'
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
    const displayName = profile?.fullName?.trim() || profile?.email || 'Profil'

    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-slate-200 bg-white px-3 text-slate-800 shadow-sm shadow-slate-900/4 hover:bg-emerald-50 hover:text-emerald-800"
            aria-label="Deschide meniul de profil"
          >
            <UserCircle className="size-4" data-icon="inline-start" aria-hidden="true" />
            <span className="max-w-32 truncate">{displayName}</span>
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-sm text-slate-800 shadow-xl shadow-slate-900/12 outline-none"
          >
            <DropdownMenu.Item asChild>
              <Link
                to="/profile"
                className="flex h-9 items-center gap-2 rounded-lg px-2.5 font-medium outline-none hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800"
              >
                <UserCircle className="size-4" aria-hidden="true" />
                Profil
              </Link>
            </DropdownMenu.Item>

            {isAdmin ? (
              <DropdownMenu.Item asChild>
                <Link
                  to="/admin/dashboard"
                  className="flex h-9 items-center gap-2 rounded-lg px-2.5 font-medium outline-none hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800"
                >
                  <LayoutDashboard className="size-4" aria-hidden="true" />
                  Panou admin
                </Link>
              </DropdownMenu.Item>
            ) : null}

            {isPartner ? (
              <DropdownMenu.Item asChild>
                <Link
                  to="/partner"
                  className="flex h-9 items-center gap-2 rounded-lg px-2.5 font-medium outline-none hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:text-emerald-800"
                >
                  <Handshake className="size-4" aria-hidden="true" />
                  Panou partener
                </Link>
              </DropdownMenu.Item>
            ) : null}

            <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />

            <DropdownMenu.Item asChild>
              <button
                type="button"
                className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left font-medium text-slate-700 outline-none hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Logout
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    )
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/login">
        <UserCircle data-icon="inline-start" aria-hidden="true" />
        Autentificare
      </Link>
    </Button>
  )
}
