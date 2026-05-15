import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Gift,
  LockKeyhole,
  LogIn,
  Mail,
  MapPinned,
} from '@/components/icons/hugeicons'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

const returnToLabels: Record<string, string> = {
  '/report': 'raportare',
  '/rewards': 'rewards',
  '/profile': 'profil',
  '/missions': 'misiuni',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const returnTo = searchParams.get('returnTo') ?? '/report'
  const returnToLabel = returnToLabels[returnTo] ?? 'zona protejata'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase nu este configurat inca. Adauga valorile env pentru frontend.')
      return
    }

    setIsSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setIsSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    navigate(returnTo, { replace: true })
  }

  return (
    <AuthLayout
      title="Bine ai revenit"
      subtitle={`Autentifica-te ca sa continui catre ${returnToLabel} fara sa pierzi contextul demo-ului.`}
      intent={`Continua catre ${returnToLabel}`}
    >
      <div className="mb-5 grid min-w-0 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
          <Gift className="size-4 text-yellow-700" aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold leading-5 text-emerald-950 break-words">
            Puncte si badge-uri
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-sky-100 bg-sky-50 px-3 py-3">
          <MapPinned className="size-4 text-sky-700" aria-hidden="true" />
          <p className="mt-2 text-xs font-semibold leading-5 text-emerald-950 break-words">
            Impact pe harta
          </p>
        </div>
      </div>

      <form className="grid min-w-0 gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Email
          <span className="relative block">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-10 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nume@email.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </span>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Parola
          <span className="relative block">
            <LockKeyhole
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-10 text-base outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
              type="password"
              autoComplete="current-password"
              placeholder="Minim 6 caractere"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm leading-6 text-rose-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="mt-1 min-h-12 bg-emerald-600 text-sm text-white shadow-sm shadow-emerald-700/10 hover:bg-emerald-700 sm:text-base"
          disabled={isSubmitting}
        >
          <LogIn data-icon="inline-start" aria-hidden="true" />
          <span className="sm:hidden">
            {isSubmitting ? 'Se autentifica' : 'Continua'}
          </span>
          <span className="hidden sm:inline">
            {isSubmitting ? 'Se autentifica' : `Continua catre ${returnToLabel}`}
          </span>
        </Button>

        <p className="text-center text-sm leading-6 text-slate-600">
          Nou pe CiviTm?{' '}
          <Link
            className="inline-flex min-h-11 items-center font-semibold text-emerald-700 outline-none hover:text-emerald-800 focus-visible:ring-3 focus-visible:ring-emerald-500/25"
            to={`/register?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Creeaza cont
          </Link>
        </p>

        <Button
          asChild
          variant="outline"
          className="min-h-11 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
        >
          <Link to="/">
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Inapoi la harta live
          </Link>
        </Button>
      </form>
    </AuthLayout>
  )
}
