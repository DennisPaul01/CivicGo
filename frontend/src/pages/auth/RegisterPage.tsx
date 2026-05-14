import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [fullName, setFullName] = useState('')
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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    setIsSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    navigate(returnTo, { replace: true })
  }

  return (
    <AuthLayout
      title="Creeaza cont"
      subtitle="Incepe sa castigi puncte civice din rapoarte valide si misiuni."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Nume complet
          <input
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/20"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>

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
            autoComplete="new-password"
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
          <UserPlus data-icon="inline-start" aria-hidden="true" />
          {isSubmitting ? 'Se creeaza contul' : 'Inregistrare'}
        </Button>

        <p className="text-center text-sm text-slate-600">
          Ai deja cont?{' '}
          <Link
            className="font-semibold text-emerald-700 outline-none hover:text-emerald-800 focus-visible:ring-3 focus-visible:ring-emerald-500/25"
            to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
          >
            Autentificare
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
