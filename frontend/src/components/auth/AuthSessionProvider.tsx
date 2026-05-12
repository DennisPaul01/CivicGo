import { useEffect, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { fetchCurrentUserProfile } from '@/lib/api'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

type AuthSessionProviderProps = {
  children: ReactNode
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const setSession = useAuthStore((state) => state.setSession)
  const setProfile = useAuthStore((state) => state.setProfile)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      clearAuth()
      return
    }

    let isMounted = true

    async function syncSession(session: Session | null) {
      setSession(session)

      if (!session) {
        return
      }

      try {
        const profile = await fetchCurrentUserProfile(session.access_token)

        if (profile) {
          setProfile(profile)
        }
      } catch {
        // Keep the Supabase-derived fallback profile when the API is unavailable.
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        void syncSession(data.session)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [clearAuth, setProfile, setSession])

  return children
}
