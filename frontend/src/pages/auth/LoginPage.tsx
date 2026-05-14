import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const returnTo = searchParams.get('returnTo') ?? '/report'

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
      title="Autentificare"
      subtitle="Acceseaza fluxurile protejate CiviTm cu contul tau civic."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Email
          <input
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Parola
          <input
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="h-10 bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={isSubmitting}
        >
          <LogIn data-icon="inline-start" aria-hidden="true" />
          {isSubmitting ? 'Se autentifica' : 'Autentificare'}
        </Button>

        <p className="text-center text-sm text-slate-600">
          Nou pe CiviTm?{' '}
          <Link
            className="font-semibold text-emerald-700 outline-none hover:text-emerald-800 focus-visible:ring-3 focus-visible:ring-emerald-500/25"
            to={`/register?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Creeaza cont
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
