import {
  Award,
  Bot,
  CheckCircle2,
  ClipboardList,
  Flag,
  Gift,
  GitMerge,
  MapPinned,
  Medal,
  Sparkles,
  RotateCcw,
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
import { roBadge, roRank, roReward, roStatus } from '@/lib/locale'

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
  const hasDuplicateSignal = issue.duplicateCount > 0 || Boolean(issue.nearestDuplicate)
  const duplicatePoints =
    issue.gamification?.pointsAwarded ?? streamState.pointsAwarded
  const pointsLabel =
    duplicatePoints !== null ? `+${duplicatePoints}` : isSaving ? 'in calcul' : '+0'
  const unlockedBadges =
    issue.gamification?.unlockedBadges.map((badge) => badge.name) ??
    streamState.badges
  const badgeLabel =
    unlockedBadges.length > 0
      ? roBadge(unlockedBadges[0]) || unlockedBadges[0]
      : duplicatePoints !== null
        ? 'First Reporter'
        : 'se verifica'
  const rankName = issue.gamification?.currentRank.name ?? streamState.rankName
  const rewardLabel = issue.relatedReward
    ? issue.relatedReward.partnerName
      ? `${issue.relatedReward.partnerName}: ${roReward(issue.relatedReward.title)}`
      : roReward(issue.relatedReward.title)
    : streamState.rewardMatched
      ? 'reward local potrivit'
      : rankName
        ? roRank(rankName) || rankName
        : 'se sincronizeaza'

  return (
    <motion.section
      className="overflow-hidden rounded-lg border border-emerald-200 bg-white pb-20 shadow-sm sm:pb-0"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-4 text-white sm:p-5">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/12 px-2.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-50 backdrop-blur sm:gap-2 sm:rounded-lg sm:px-2.5 sm:text-xs">
              <Bot className="size-3.5" aria-hidden="true" />
              Verificare CiviTm
            </span>
            <h2 className="mt-3 text-[1.35rem] font-semibold leading-tight sm:mt-3 sm:text-3xl">
              {isSaving ? 'Verificarea a pornit' : 'Semnalul a fost procesat'}
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-emerald-50/86 sm:hidden">
              Vezi pas cu pas analiza si ce primesti pentru semnal.
            </p>
            <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-emerald-50/88 sm:block">
              Urmareste cum fotografia devine analiza, triere, misiune si impact pe harta.
            </p>

            <div className="mt-4 grid grid-cols-[0.86fr_minmax(0,1fr)] gap-2 sm:hidden">
              <span className="row-span-2 flex min-w-0 flex-col justify-between rounded-xl border border-white/16 bg-white/14 p-3 shadow-sm shadow-emerald-950/10 backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-lg bg-lime-200/18 text-lime-100">
                  <Award className="size-4.5" aria-hidden="true" />
                </span>
                <span className="mt-4 block text-[0.62rem] font-semibold uppercase tracking-wide text-emerald-100">
                  Puncte
                </span>
                <span className="mt-0.5 block truncate text-2xl font-semibold leading-none">
                  {pointsLabel}
                </span>
              </span>
              <span className="min-w-0 rounded-xl border border-white/14 bg-white/12 px-3 py-2.5 backdrop-blur">
                <Medal className="mb-1 size-4 text-lime-100" aria-hidden="true" />
                <span className="block text-[0.62rem] font-semibold uppercase text-emerald-100">
                  Badge
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold">
                  {badgeLabel}
                </span>
              </span>
              <span className="min-w-0 rounded-xl border border-white/14 bg-white/12 px-3 py-2.5 backdrop-blur">
                <Gift className="mb-1 size-4 text-lime-100" aria-hidden="true" />
                <span className="block text-[0.62rem] font-semibold uppercase text-emerald-100">
                  Reward
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold">
                  {rewardLabel}
                </span>
              </span>
            </div>

            <div className="mt-3 hidden gap-2 text-sm sm:grid sm:grid-cols-3">
              <span className="rounded-lg border border-white/14 bg-white/10 px-3 py-2 backdrop-blur">
                <span className="block text-[0.68rem] font-semibold uppercase text-emerald-100">
                  Status
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 font-semibold">
                  {isSaving ? (
                    <Sparkles className="size-3.5" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  )}
                  {isSaving ? 'ruleaza acum' : 'gata'}
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
                  {pointsLabel}
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

      {!isSaving && hasDuplicateSignal && (
        <motion.div
          className="mt-5 rounded-lg border border-amber-200 bg-amber-50/80 p-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
              <GitMerge className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-emerald-950">
                Problema pare deja raportata
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Am gasit un raport similar in apropiere. Semnalul tau este pastrat ca
                confirmare si ajuta la prioritizarea problemei existente.
              </p>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <span className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Rapoarte similare
                  </span>
                  <span className="font-semibold text-emerald-950">
                    {Math.max(issue.duplicateCount, 1)}
                  </span>
                </span>
                <span className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Cel mai apropiat
                  </span>
                  <span className="font-semibold text-emerald-950">
                    {issue.nearestDuplicate
                      ? `${issue.nearestDuplicate.distanceMeters}m`
                      : 'in apropiere'}
                  </span>
                </span>
                <span className="rounded-lg border border-white/80 bg-white/70 px-3 py-2">
                  <span className="block text-xs font-semibold uppercase text-slate-500">
                    Puncte
                  </span>
                  <span className="font-semibold text-emerald-950">
                    {duplicatePoints !== null ? `+${duplicatePoints}` : 'confirmare'}
                  </span>
                </span>
              </div>

              {issue.nearestDuplicate && (
                <div className="mt-3 flex flex-col gap-2 rounded-lg border border-white/80 bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-emerald-950">
                      {issue.nearestDuplicate.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Status: {roStatus(issue.nearestDuplicate.status)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0">
                    <Link to={`/issues/${issue.nearestDuplicate.issueId}`}>
                      Vezi raportul existent
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {!isSaving && (
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
              <Link to={`/missions/${issue.relatedMission.id}`}>Deschide misiunea</Link>
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onStartNewReport}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Trimite alt semnal
          </Button>
        </div>
      )}

      {!isSaving && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-100/80 bg-white/88 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,.10)] backdrop-blur-2xl sm:hidden">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300/80" />
          <div className="mx-auto flex max-w-md items-center gap-2">
            <Button
              type="button"
              className="h-12 flex-1 rounded-full bg-emerald-600 text-[0.95rem] font-semibold text-white shadow-sm shadow-emerald-900/15 hover:bg-emerald-700"
              onClick={onViewOnMap}
            >
              <MapPinned data-icon="inline-start" aria-hidden="true" />
              Vezi pe harta
            </Button>

            <Button
              asChild
              type="button"
              variant="outline"
              size="icon"
              className="size-12 shrink-0 rounded-full border-emerald-200 bg-emerald-50/80 text-emerald-800 shadow-sm"
              aria-label="Vezi detaliile problemei"
              title="Vezi detaliile problemei"
            >
              <Link to={`/issues/${issue.id}`}>
                <ClipboardList className="size-5" aria-hidden="true" />
              </Link>
            </Button>

            {issue.relatedMission ? (
              <Button
                asChild
                type="button"
                variant="outline"
                size="icon"
                className="size-12 shrink-0 rounded-full border-lime-200 bg-lime-50/80 text-lime-800 shadow-sm"
                aria-label="Deschide misiunea"
                title="Deschide misiunea"
              >
                <Link to={`/missions/${issue.relatedMission.id}`}>
                  <Flag className="size-5" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12 shrink-0 rounded-full border-slate-200 bg-white/85 text-slate-700 shadow-sm"
                aria-label="Trimite alt semnal"
                title="Trimite alt semnal"
                onClick={onStartNewReport}
              >
                <RotateCcw className="size-5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      )}

    </motion.section>
  )
}
