import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

export type CivicRole = 'citizen' | 'trusted_citizen' | 'partner' | 'admin'

export type LocalUserProfile = {
  id: string
  supabaseUserId: string
  email: string
  fullName: string
  role: CivicRole
  points: number
  rankName: string
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthStore = {
  session: Session | null
  user: User | null
  profile: LocalUserProfile | null
  status: AuthStatus
  setSession: (session: Session | null) => void
  setProfile: (profile: LocalUserProfile | null) => void
  clearAuth: () => void
}

function createProfileFromUser(user: User): LocalUserProfile {
  return {
    id: user.id,
    supabaseUserId: user.id,
    email: user.email ?? '',
    fullName:
      typeof user.user_metadata.full_name === 'string'
        ? user.user_metadata.full_name
        : 'Civic citizen',
    role: 'citizen',
    points: 0,
    rankName: 'New Citizen',
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  profile: null,
  status: 'loading',
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      profile: session?.user ? createProfileFromUser(session.user) : null,
      status: session ? 'authenticated' : 'unauthenticated',
    }),
  setProfile: (profile) => set({ profile }),
  clearAuth: () =>
    set({
      session: null,
      user: null,
      profile: null,
      status: 'unauthenticated',
    }),
}))
