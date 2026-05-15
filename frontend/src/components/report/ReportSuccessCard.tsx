import {
  Bot,
  CheckCircle2,
  FileWarning,
  Gift,
  HeartHandshake,
  MapPinned,
  Plus,
  RotateCcw,
  Sparkles,
} from '@/components/icons/hugeicons'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ReportAgentFlow,
  type ReportStreamState,
} from '@/components/report/ReportAgentFlow'
import { Button } from '@/components/ui/button'
import type { ReportLocation } from '@/data/reportLocations'
import type { IssueResponse } from '@/lib/api'

type ReportSuccessCardProps = {
  location: ReportLocation
  description: string
  issue: IssueResponse
  imagePreviewUrl: string
  streamState: ReportStreamState
  isSaving?: boolean
  onStartNewReport: () => void
  onViewOnMap: () => void
}

export function ReportSuccessCard({
  location,
  description,
  issue,
  imagePreviewUrl,
  streamState,
  isSaving = false,
  onStartNewReport,
  onViewOnMap,
}: ReportSuccessCardProps) {
  const isRejected = issue.status === 'rejected' || issue.isValidIssue === false
  const invalidReason =
    issue.invalidReason ??
    'Nu putem confirma o problema civica reala din imaginea incarcata.'
  const duplicatePoints =
    issue.gamification?.pointsAwarded ?? streamState.pointsAwarded
  const hasCommunityEvent =
    issue.duplicateCount <= 0 &&
    !issue.nearestDuplicate &&
    Boolean(issue.relatedMission) &&
    ['community', 'community_and_city_hall'].includes(issue.responsibleActor)

  return (
    <motion.section
      className="overflow-hidden rounded-lg border border-emerald-200 bg-white pb-3 shadow-sm sm:pb-0"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-4 py-3 text-white sm:p-5">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/12 px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-50 backdrop-blur sm:gap-2 sm:rounded-lg sm:px-2.5 sm:text-xs">
              <Bot className="size-3.5" aria-hidden="true" />
              {isRejected ? 'Verificare imagine' : 'Verificare CiviTm'}
            </span>
            <h2 className="mt-2 text-xl font-semibold leading-tight sm:mt-3 sm:text-3xl">
              {isSaving
                ? 'Verificam semnalul'
                : isRejected
                  ? 'Imaginea nu poate fi folosita pentru raport'
                  : 'Semnal pregatit pe harta'}
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-emerald-50/86 sm:hidden">
              {isRejected
                ? 'Adauga o fotografie mai clara cu problema urbana.'
                : 'Harta, punctele si urmatorul pas sunt pregatite.'}
            </p>
            <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-emerald-50/88 sm:block">
              {isRejected
                ? 'AI-ul nu a putut confirma o problema civica din imagine. Raportul poate fi retrimis cu o poza mai relevanta.'
                : 'Verificarea a rulat complet, iar semnalul poate fi inspectat pe harta live.'}
            </p>

            <div className="mt-3 hidden gap-2 text-sm sm:grid sm:grid-cols-3">
              <span className="rounded-lg border border-white/14 bg-white/10 px-3 py-2 backdrop-blur">
                <span className="block text-[0.68rem] font-semibold uppercase text-emerald-100">
                  Status
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 font-semibold">
                  {isSaving ? (
                    <Sparkles className="size-3.5" aria-hidden="true" />
                  ) : isRejected ? (
                    <FileWarning className="size-3.5" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  )}
                  {isSaving ? 'ruleaza acum' : isRejected ? 'respins' : 'gata'}
                </span>
              </span>
              <span className="rounded-lg border border-white/14 bg-white/10 px-3 py-2 backdrop-blur">
                <span className="block text-[0.68rem] font-semibold uppercase text-emerald-100">
                  Zona
                </span>
                <span className="mt-0.5 block truncate font-semibold">
                  {location.zoneName ?? location.name}
                </span>
              </span>
              <span className="rounded-lg border border-white/14 bg-white/10 px-3 py-2 backdrop-blur">
                <span className="block text-[0.68rem] font-semibold uppercase text-emerald-100">
                  Puncte
                </span>
                <span className="mt-0.5 block font-semibold">
                  {duplicatePoints !== null ? `+${duplicatePoints}` : 'se adauga'}
                </span>
              </span>
            </div>
          </div>

          <div className="relative hidden sm:block">
            <div className="absolute -inset-3 rounded-2xl bg-white/10 blur-xl" />
            <img
              src={imagePreviewUrl}
              alt="Fotografia semnalului raportat"
              className="relative aspect-[4/5] w-full rounded-xl border border-white/18 object-cover shadow-2xl shadow-emerald-950/30"
            />
          </div>
        </div>
      </div>

      <ReportAgentFlow
        issue={issue}
        location={location}
        description={description}
        imagePreviewUrl={imagePreviewUrl}
        streamState={streamState}
        isSaving={isSaving}
      />

      {!isSaving && isRejected && (
        <motion.div
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50/85 p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
              <FileWarning className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-emerald-950">
                Nu putem confirma problema din imagine
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {invalidReason}
              </p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <span className="rounded-lg border border-white/80 bg-white/75 px-3 py-2">
                  Fotografiaza clar problema si zona afectata.
                </span>
                <span className="rounded-lg border border-white/80 bg-white/75 px-3 py-2">
                  Evita selfie-uri, mancare, interioare private sau capturi de ecran.
                </span>
                <span className="rounded-lg border border-white/80 bg-white/75 px-3 py-2">
                  Adauga o descriere scurta daca problema nu este evidenta.
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!isSaving && !isRejected && (
        <div className="mt-5 hidden gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Link to={`/issues/${issue.id}`}>Vezi detaliile problemei</Link>
          </Button>
          <Button type="button" variant="outline" onClick={onViewOnMap}>
            <MapPinned data-icon="inline-start" aria-hidden="true" />
            Vezi pe harta
          </Button>
          {issue.relatedMission && (
            <Button asChild variant="outline">
              <Link to={`/missions/${issue.relatedMission.id}`}>Vezi evenimentul</Link>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onStartNewReport}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Trimite alt semnal
          </Button>
        </div>
      )}

      {!isSaving && isRejected && (
        <div className="mt-5 hidden gap-2 sm:grid sm:grid-cols-2">
          <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={onStartNewReport}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Incarca alta poza
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Inapoi la harta</Link>
          </Button>
        </div>
      )}

      {!isSaving && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-100/80 bg-white/92 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,.10)] backdrop-blur-2xl sm:hidden">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300/80" />
          <div className="mx-auto flex max-w-md items-center gap-2">
            {!isRejected && (
              <Button
                asChild
                variant="outline"
                className="h-12 w-28 shrink-0 rounded-full border-emerald-200 bg-white text-[0.95rem] font-semibold text-emerald-900 shadow-sm"
              >
                <Link to="/rewards">
                  <Gift data-icon="inline-start" aria-hidden="true" />
                  Rewards
                </Link>
              </Button>
            )}

            {isRejected ? (
              <Button
                type="button"
                className="h-12 flex-1 rounded-full bg-emerald-600 text-[0.95rem] font-semibold text-white shadow-sm shadow-emerald-900/15 hover:bg-emerald-700"
                aria-label="Incarca alta poza"
                title="Incarca alta poza"
                onClick={onStartNewReport}
              >
                <RotateCcw data-icon="inline-start" aria-hidden="true" />
                Incarca alta poza
              </Button>
            ) : hasCommunityEvent && issue.relatedMission ? (
              <Button
                asChild
                type="button"
                className="h-12 flex-1 rounded-full bg-emerald-600 text-[0.95rem] font-semibold text-white shadow-sm shadow-emerald-900/15 hover:bg-emerald-700"
              >
                <Link to={`/missions/${issue.relatedMission.id}`}>
                  <HeartHandshake data-icon="inline-start" aria-hidden="true" />
                  Participa
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                className="h-12 flex-1 rounded-full bg-emerald-600 text-[0.95rem] font-semibold text-white shadow-sm shadow-emerald-900/15 hover:bg-emerald-700"
                aria-label="Trimite alt semnal"
                title="Trimite alt semnal"
                onClick={onStartNewReport}
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                Adauga alt semnal
              </Button>
            )}
          </div>
        </div>
      )}

    </motion.section>
  )
}
