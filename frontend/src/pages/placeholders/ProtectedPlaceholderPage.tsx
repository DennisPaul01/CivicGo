import { Link } from 'react-router-dom'
import { ShieldCheck } from '@/components/icons/hugeicons'
import { Button } from '@/components/ui/button'

type ProtectedPlaceholderPageProps = {
  title: string
  description: string
}

export function ProtectedPlaceholderPage({
  title,
  description,
}: ProtectedPlaceholderPageProps) {
  return (
    <main className="min-h-svh bg-orange-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-3xl items-center">
        <div className="w-full rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-emerald-950">
            {title}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {description}
          </p>
          <Button asChild className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700">
            <Link to="/">Inapoi la harta live</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
