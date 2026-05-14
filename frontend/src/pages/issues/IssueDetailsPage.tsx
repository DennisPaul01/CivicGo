import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  Bot,
  CopyCheck,
  ExternalLink,
  Flag,
  Gift,
  ImageOff,
  MapPin,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { motion } from 'motion/react'
import { AgentTimeline } from '@/components/agents/AgentTimeline'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchIssueById,
  isApiConfigured,
  type IssueResponse,
} from '@/lib/api'
import { issueQueryKey } from '@/lib/queryClient'
import { roActor, roCategory, roReward, roSeverity, roStatus } from '@/lib/locale'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function IssueDetailsPage() {
  const { id } = useParams()
  const issueQuery = useQuery({
    queryKey: issueQueryKey(id ?? ''),
    queryFn: () => fetchIssueById(id ?? ''),
    enabled: Boolean(id && isApiConfigured),
  })

  if (!id || !isApiConfigured) {
    return (
      <DemoStatePage
        title="Detaliile problemei au nevoie de API-ul CiviTm"
        description="Ruta publica pentru detalii este pregatita. Conecteaza API-ul ca sa incarce raportul selectat."
      />
    )
  }

  if (issueQuery.isLoading) {
    return (
      <main className="min-h-svh bg-orange-50 px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-6xl">
          <DemoSkeletonGrid items={4} className="lg:grid-cols-2" />
        </section>
      </main>
    )
  }

  if (issueQuery.isError || !issueQuery.data) {
    return (
      <DemoStatePage
        tone="amber"
        title="Problema nu este disponibila"
        description="CiviTm nu a putut incarca acest raport. Harta live poate afisa in continuare imaginea de ansamblu."
      />
    )
  }

  return <IssueDetails issue={issueQuery.data} />
}

function IssueDetails({ issue }: { issue: IssueResponse }) {
  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-6xl gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <MapPin className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Problema publica
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-emerald-950">
                {issue.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to={`/?issue=${issue.id}`}>
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Harta live
              </Link>
            </Button>
            {issue.relatedMission && (
              <Button asChild size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Link to={`/missions/${issue.relatedMission.id}`}>
                  <Flag data-icon="inline-start" aria-hidden="true" />
                  Misiune
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm">
              {issue.imageUrl ? (
                <img
                  src={issue.imageUrl}
                  alt=""
                  className="h-72 w-full object-cover sm:h-96"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-orange-50 text-emerald-700">
                  <ImageOff className="size-8" aria-hidden="true" />
                </div>
              )}
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={roStatus(issue.status)} tone="emerald" />
                  <StatusBadge label={roSeverity(issue.severity)} tone="amber" />
                  <StatusBadge label={roCategory(issue.category)} tone="slate" />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {issue.description ?? 'Un cetatean a raportat aceasta problema prin CiviTm.'}
                </p>
              </div>
            </div>

            {issue.aiSummary && (
              <InfoCard
                icon={Bot}
                title="Rezumat AI"
                tone="teal"
                body={issue.aiSummary}
                footer={
                  issue.aiConfidence !== null
                    ? `Incredere ${Math.round(issue.aiConfidence * 100)}%`
                    : undefined
                }
              />
            )}

            {issue.duplicateCount > 0 && (
              <InfoCard
                icon={CopyCheck}
                title="Semnal duplicat"
                tone="amber"
                body={
                  issue.nearestDuplicate
                    ? `${issue.duplicateCount} semnal duplicat in apropiere. Cel mai apropiat: ${issue.nearestDuplicate.title} (${issue.nearestDuplicate.distanceMeters}m).`
                    : `${issue.duplicateCount} semnal duplicat gasit langa acest raport.`
                }
              />
            )}

            {issue.afterImageUrl && (
              <section className="grid gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm sm:grid-cols-2">
                <BeforeAfterImage label="Inainte" imageUrl={issue.imageUrl} />
                <BeforeAfterImage label="Dupa" imageUrl={issue.afterImageUrl} />
              </section>
            )}

            <AgentTimeline run={issue.agentRun} />
          </section>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Rutare civica
              </p>
              <dl className="mt-4 grid gap-3 text-sm">
                <DetailRow label="Zona" value={issue.zoneName ?? 'Timisoara'} />
                <DetailRow label="Responsabil" value={roActor(issue.responsibleActor)} />
                <DetailRow label="Creat" value={formatDate(issue.createdAt)} />
                <DetailRow
                  label="Eligibil recompensa"
                  value={issue.rewardEligible ? 'Da' : 'Nu inca'}
                />
              </dl>
            </section>

            {issue.relatedMission && (
              <section className="rounded-lg border border-lime-200 bg-white p-4 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-lime-50 text-lime-700">
                  <Flag className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                  {issue.relatedMission.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {issue.relatedMission.participantsJoined}/
                  {issue.relatedMission.participantsNeeded} inscrisi · +
                  {issue.relatedMission.impactPoints} puncte de impact
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link to={`/missions/${issue.relatedMission.id}`}>
                    <ExternalLink data-icon="inline-start" aria-hidden="true" />
                    Vezi misiunea
                  </Link>
                </Button>
              </section>
            )}

            {issue.relatedReward && (
              <section className="rounded-lg border border-yellow-200 bg-white p-4 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                  <Gift className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                  {roReward(issue.relatedReward.title)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {issue.relatedReward.partnerName ?? 'Recompensa de sistem CiviTm'} ·{' '}
                  {issue.relatedReward.requiredPoints} puncte necesare
                </p>
              </section>
            )}
          </aside>
        </div>
      </motion.section>
    </main>
  )
}

function DemoStatePage({
  title,
  description,
  tone = 'slate',
}: {
  title: string
  description: string
  tone?: 'slate' | 'amber'
}) {
  return (
    <main className="min-h-svh bg-orange-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-3xl items-center">
        <DemoState
          icon={tone === 'amber' ? TriangleAlert : Sparkles}
          tone={tone}
          eyebrow="Detalii problema"
          title={title}
          description={description}
        />
      </section>
    </main>
  )
}

function StatusBadge({
  label,
  tone,
}: {
  label: string
  tone: 'emerald' | 'amber' | 'slate' | 'rose'
}) {
  const classes = {
    emerald: 'bg-orange-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    slate: 'bg-slate-50 text-slate-600 ring-slate-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  }

  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${classes[tone]}`}>
      {label}
    </span>
  )
}

function InfoCard({
  icon: Icon,
  title,
  body,
  footer,
  tone,
}: {
  icon: LucideIcon
  title: string
  body: string
  footer?: string
  tone: 'teal' | 'amber'
}) {
  const classes =
    tone === 'teal'
      ? 'border-teal-100 bg-teal-50 text-teal-700'
      : 'border-amber-100 bg-amber-50 text-amber-700'

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${classes}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-emerald-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          {footer && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">{footer}</p>
          )}
        </div>
      </div>
    </section>
  )
}

function BeforeAfterImage({
  label,
  imageUrl,
}: {
  label: string
  imageUrl: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-emerald-100">
      <img src={imageUrl} alt="" className="h-48 w-full object-cover" />
      <p className="bg-orange-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {label}
      </p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-slate-800">{value}</dd>
    </div>
  )
}
