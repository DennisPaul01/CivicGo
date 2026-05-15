import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldX } from '@/components/icons/hugeicons'
import { Button } from '@/components/ui/button'

export function AccessDeniedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-orange-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="w-full max-w-xl rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <span className="flex size-11 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
          <ShieldX className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Zona restrictionata
        </p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight text-emerald-950">
          Nu ai acces la aceasta zona
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          CiviTm pastreaza zonele de partener si admin pentru rolurile potrivite
          din platforma. Harta live, misiunile si detaliile publice raman disponibile.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Link to="/">
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Inapoi la harta live
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/missions">Vezi misiunile</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
