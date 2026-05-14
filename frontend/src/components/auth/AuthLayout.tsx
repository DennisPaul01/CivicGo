import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, MapPinned } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandMark'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="min-h-svh bg-orange-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl gap-6 lg:grid-cols-[1fr_26rem]">
        <section className="flex flex-col justify-between rounded-lg border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <Link
              to="/"
              className="inline-flex items-center rounded-md text-sm font-semibold text-slate-800 outline-none transition-colors hover:text-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-500/25"
            >
              <BrandMark size="sm" iconClassName="size-8" />
            </Link>

            <div className="mt-16 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Observa. Actioneaza. Impreuna.
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-emerald-950 sm:text-5xl">
                Pastreaza impactul civic conectat.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Autentifica-te ca sa raportezi probleme, sa intri in misiuni,
                sa castigi puncte si sa vezi cum se schimba orasul in timp.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <MapPinned className="size-5 text-emerald-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-emerald-950">
                Actiune pe harta
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Rapoartele tale devin misiuni civice vizibile.
              </p>
            </div>
            <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
              <HeartHandshake className="size-5 text-yellow-700" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-emerald-950">
                Recompense civice prietenoase
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Actiunile utile deblocheaza puncte, badge-uri si multumiri locale.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-lg border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-950">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </main>
  )
}
