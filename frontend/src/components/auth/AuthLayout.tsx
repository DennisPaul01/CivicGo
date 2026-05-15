import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Gift, HeartHandshake, MapPinned } from '@/components/icons/hugeicons'
import { BrandMark } from '@/components/brand/BrandMark'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  eyebrow?: string
  intent?: string
}

export function AuthLayout({
  title,
  subtitle,
  children,
  eyebrow = 'Observa. Actioneaza. Impreuna.',
  intent = 'Continua in CiviTm',
}: AuthLayoutProps) {
  return (
    <main className="min-h-svh bg-[#fff8ed] px-3 py-3 text-slate-950 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full min-w-0 max-w-6xl gap-4 sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[1fr_26rem] lg:gap-6">
        <section className="order-2 flex min-w-0 flex-col justify-between rounded-lg border border-emerald-200 bg-white p-4 shadow-sm sm:p-7 lg:order-1">
          <div>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-slate-800 outline-none transition-colors hover:text-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-500/25"
            >
              <BrandMark size="sm" iconClassName="size-8" />
            </Link>

            <div className="mt-8 max-w-xl lg:mt-16">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 sm:text-sm">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-2xl font-semibold leading-tight text-emerald-950 sm:text-5xl">
                Pastreaza impactul civic conectat.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-7">
                Autentifica-te ca sa raportezi probleme, sa intri in misiuni,
                sa castigi puncte si sa vezi cum se schimba orasul in timp.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-10">
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
              <HeartHandshake className="hidden size-5 text-yellow-700 sm:block" aria-hidden="true" />
              <Gift className="size-5 text-yellow-700 sm:hidden" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-emerald-950">
                Recompense civice prietenoase
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Actiunile utile deblocheaza puncte, badge-uri si multumiri locale.
              </p>
            </div>
          </div>
        </section>

        <section className="order-1 flex min-w-0 items-center lg:order-2">
          <div className="w-full min-w-0 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm sm:p-6">
            <Link
              to="/"
              className="mb-5 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-slate-800 outline-none transition-colors hover:text-emerald-700 focus-visible:ring-3 focus-visible:ring-emerald-500/25 lg:hidden"
            >
              <BrandMark size="sm" iconClassName="size-8" />
            </Link>
            <div>
              <p className="mb-2 inline-flex min-h-7 items-center rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-800">
                {intent}
              </p>
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
