import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ClipboardList, CopyCheck, ExternalLink, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import { fetchIssues, isApiConfigured } from '@/lib/api'
import { roCategory, roStatus } from '@/lib/locale'
import { issuesQueryKey } from '@/lib/queryClient'

export function AdminIssuesPage() {
  const issuesQuery = useQuery({
    queryKey: issuesQueryKey,
    queryFn: fetchIssues,
  })
  const issues = issuesQuery.data ?? []
  const duplicateIssues = issues.filter((issue) => issue.duplicateCount > 0)
  const municipalIssues = issues.filter(
    (issue) =>
      issue.responsibleActor === 'city_hall' &&
      issue.status !== 'new' &&
      issue.status !== 'resolved',
  )

  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-7xl gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <ClipboardList className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                CiviTm admin
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-emerald-950">
                Control probleme primarie
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/dashboard">
                <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Live map
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard label="Probleme vizibile" value={issues.length} />
          <SummaryCard label="Catre primarie" value={municipalIssues.length} />
          <SummaryCard label="Semnale duplicate" value={duplicateIssues.length} />
          <SummaryCard
            label="Necesita atentie"
            value={issues.filter((issue) => issue.status !== 'resolved').length}
          />
        </div>

        {issuesQuery.isLoading && isApiConfigured ? (
          <DemoSkeletonGrid items={6} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : issuesQuery.isError && isApiConfigured ? (
          <DemoState
            icon={ClipboardList}
            tone="amber"
            eyebrow="Temporary fallback"
            title="Issue list is temporarily unavailable"
            description="The admin route is protected and ready; live issue data will return with the API."
          />
        ) : (
          <section className="grid gap-3">
            {issues.map((issue) => (
              <article
                key={issue.id}
                className="grid gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {roStatus(issue.status)}
                    </span>
                    {issue.responsibleActor === 'city_hall' && (
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                        Catre primarie
                      </span>
                    )}
                    <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {roCategory(issue.category)}
                    </span>
                    {issue.duplicateCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        <CopyCheck className="size-3.5" aria-hidden="true" />
                        {issue.duplicateCount} duplicate signals
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-emerald-950">
                    {issue.title}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                    {issue.aiSummary ?? issue.description ?? 'No summary available yet.'}
                  </p>
                  {issue.nearestDuplicate && (
                    <p className="mt-2 text-sm font-medium text-amber-700">
                      Nearest match: {issue.nearestDuplicate.title} ·{' '}
                      {issue.nearestDuplicate.distanceMeters}m away
                    </p>
                  )}
                </div>
                <Button asChild variant="outline" size="sm" className="self-start">
                  <Link to={`/issues/${issue.id}`}>
                    <ExternalLink data-icon="inline-start" aria-hidden="true" />
                    Details
                  </Link>
                </Button>
              </article>
            ))}
          </section>
        )}
      </motion.section>
    </main>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
    </article>
  )
}
