import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query'
import type { LucideIcon } from '@/components/icons/hugeicons'
import {
  ArrowLeft,
  Bot,
  Camera,
  CheckCircle2,
  CopyCheck,
  ExternalLink,
  Flag,
  Gift,
  ImageOff,
  ImagePlus,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  TriangleAlert,
  Upload,
  X,
} from '@/components/icons/hugeicons'
import { AnimatePresence, motion } from 'motion/react'
import { AgentTimeline } from '@/components/agents/AgentTimeline'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchIssueById,
  isApiConfigured,
  resolveIssue,
  type ResolveIssueResponse,
  type IssueResponse,
} from '@/lib/api'
import { issueQueryKey, issuesQueryKey, publicActivityQueryKey } from '@/lib/queryClient'
import { roActor, roCategory, roReward, roSeverity, roStatus } from '@/lib/locale'
import { isSameDisplayText } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

type ResolutionGamification = ResolveIssueResponse['gamification']

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
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.session)
  const authStatus = useAuthStore((state) => state.status)
  const profile = useAuthStore((state) => state.profile)
  const setProfile = useAuthStore((state) => state.setProfile)
  const imageUrls = issue.imageUrls.length > 0 ? issue.imageUrls : [issue.imageUrl].filter(Boolean)
  const isRejected = issue.status === 'rejected' || issue.isValidIssue === false
  const isResolved = issue.status === 'resolved' || issue.status === 'issue_resolved' || Boolean(issue.afterImageUrl)
  const invalidReason =
    issue.invalidReason ??
    'AI-ul nu a putut confirma o problema civica reala din imaginea incarcata.'
  const issueDescription =
    issue.description ?? 'Un cetatean a raportat aceasta problema prin CiviTm.'
  const shouldShowAiSummary =
    Boolean(issue.aiSummary) &&
    !isSameDisplayText(issue.aiSummary, issueDescription)
  const [preview, setPreview] = useState<null | {
    title: string
    images: Array<{
      label: string
      imageUrl: string
      tone: 'emerald' | 'rose'
    }>
  }>(null)
  const resolveMutation = useMutation({
    mutationFn: (input: { afterImage: File; resolutionNote: string }) =>
      resolveIssue({
        issueId: issue.id,
        afterImage: input.afterImage,
        resolutionNote: input.resolutionNote,
        accessToken: session?.access_token ?? '',
      }),
    onSuccess: (resolution) => {
      queryClient.setQueryData(issueQueryKey(issue.id), resolution.issue)
      queryClient.invalidateQueries({ queryKey: issuesQueryKey })
      queryClient.invalidateQueries({ queryKey: publicActivityQueryKey(48, 50) })
      queryClient.invalidateQueries({ queryKey: publicActivityQueryKey(168, 80) })

      if (profile && resolution.gamification) {
        setProfile({
          ...profile,
          points: resolution.gamification.totalPoints,
          rankName: resolution.gamification.currentRank.name,
        })
      }
    },
  })
  const resolutionGamification = resolveMutation.data?.gamification ?? issue.gamification

  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-6xl gap-5 pb-24 sm:pb-0"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TopNavigation />
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <MapPin className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {isRejected ? 'Raport respins' : 'Problema publica'}
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
                  Eveniment
                </Link>
              </Button>
            )}
          </div>
        </div>

        {isResolved && !isRejected && (
          <ResolutionImpactBanner gamification={resolutionGamification} />
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm">
              {issue.imageUrl ? (
                <div className="bg-slate-100">
                  <button
                    type="button"
                    className="group relative block w-full outline-none focus-visible:ring-3 focus-visible:ring-emerald-300/60"
                    aria-label="Mareste fotografia raportului"
                    onClick={() =>
                      setPreview({
                        title: issue.title,
                        images: [
                          {
                            label: 'Fotografie raport',
                            imageUrl: imageUrls[0],
                            tone: 'emerald',
                          },
                        ],
                      })
                    }
                  >
                    <img
                      src={imageUrls[0]}
                      alt=""
                      className="mx-auto max-h-[32rem] w-full object-contain"
                    />
                    <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg bg-white/90 text-emerald-700 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Search className="size-4" aria-hidden="true" />
                    </span>
                  </button>
                  {imageUrls.length > 1 && (
                    <div className="grid grid-cols-3 gap-2 border-t border-emerald-100 bg-emerald-50/40 p-2 sm:grid-cols-6">
                      {imageUrls.map((imageUrl, index) => (
                        <button
                          key={imageUrl}
                          type="button"
                          className="overflow-hidden rounded-md bg-white outline-none focus-visible:ring-3 focus-visible:ring-emerald-300/60"
                          aria-label={`Mareste fotografia raportului ${index + 1}`}
                          onClick={() =>
                            setPreview({
                              title: issue.title,
                              images: [
                                {
                                  label: `Fotografie ${index + 1}`,
                                  imageUrl,
                                  tone: 'emerald',
                                },
                              ],
                            })
                          }
                        >
                          <img
                            src={imageUrl}
                            alt=""
                            className="aspect-square w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center bg-orange-50 text-emerald-700">
                  <ImageOff className="size-8" aria-hidden="true" />
                </div>
              )}
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={roStatus(issue.status)} tone={isRejected ? 'rose' : 'emerald'} />
                  <StatusBadge label={roSeverity(issue.severity)} tone="amber" />
                  <StatusBadge label={roCategory(issue.category)} tone="slate" />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {issueDescription}
                </p>
              </div>
            </div>

            {isRejected && (
              <InfoCard
                icon={TriangleAlert}
                title="Raport respins de AI"
                tone="amber"
                body={invalidReason}
                footer="Incearca din nou cu o poza clara a problemei, zona afectata vizibila si o descriere scurta."
              />
            )}

            {shouldShowAiSummary && issue.aiSummary && (
              <InfoCard
                icon={Bot}
                title="Ce a inteles CiviTm"
                tone="teal"
                body={issue.aiSummary}
                footer={
                  issue.aiConfidence !== null
                    ? `Verificare automata ${Math.round(issue.aiConfidence * 100)}%`
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
              <BeforeAfterComparison
                beforeImageUrl={issue.imageUrl}
                afterImageUrl={issue.afterImageUrl}
                onOpen={() =>
                  setPreview({
                    title: 'Compara inainte si dupa',
                    images: [
                      { label: 'Inainte', imageUrl: issue.imageUrl, tone: 'rose' },
                      { label: 'Dupa', imageUrl: issue.afterImageUrl!, tone: 'emerald' },
                    ],
                  })
                }
              />
            )}

            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Bot className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Istoric verificari
                  </p>
                  <h2 className="text-lg font-semibold text-emerald-950">
                    CiviTm a analizat raportul
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pasii de mai jos arata pe scurt cum a fost verificata problema.
              </p>
              <div className="mt-4">
                <AgentTimeline run={issue.agentRun} />
              </div>
            </section>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
            {!isRejected && (
              <ResolutionPanel
                issue={issue}
                isResolved={isResolved}
                authStatus={authStatus}
                isAuthenticated={Boolean(session?.access_token)}
                mutation={resolveMutation}
              />
            )}

            <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Rutare civica
              </p>
              <dl className="mt-4 grid gap-3 text-sm">
                <DetailRow label="Zona" value={issue.zoneName ?? 'Timisoara'} />
                <DetailRow
                  label="Locatie"
                  value={`${issue.latitude.toFixed(5)}, ${issue.longitude.toFixed(5)}`}
                />
                <DetailRow label="Responsabil" value={roActor(issue.responsibleActor)} />
                <DetailRow label="Creat" value={formatDate(issue.createdAt)} />
                {!isRejected && (
                  <DetailRow
                    label="Eveniment comunitar"
                    value={issue.relatedMission ? 'Conectat' : 'Nu este necesar'}
                  />
                )}
              </dl>
            </section>

            {!isRejected && issue.relatedMission && (
              <section className="rounded-lg border border-lime-200 bg-white p-4 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-lime-50 text-lime-700">
                  <Flag className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-emerald-950">
                  Eveniment comunitar
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {issue.relatedMission.title} ·{' '}
                  {issue.relatedMission.participantsJoined}/
                  {issue.relatedMission.participantsNeeded} inscrisi · +
                  {issue.relatedMission.impactPoints} puncte de impact
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                  <Link to={`/missions/${issue.relatedMission.id}`}>
                    <ExternalLink data-icon="inline-start" aria-hidden="true" />
                    Vezi evenimentul
                  </Link>
                </Button>
              </section>
            )}

            {!isRejected && issue.relatedReward && (
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
      <ImagePreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </main>
  )
}

function BeforeAfterComparison({
  beforeImageUrl,
  afterImageUrl,
  onOpen,
}: {
  beforeImageUrl: string
  afterImageUrl: string
  onOpen: () => void
}) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Inainte / dupa
          </p>
          <h2 className="text-lg font-semibold text-emerald-950">
            Compara rezultatul
          </h2>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onOpen}
        >
          <Search data-icon="inline-start" aria-hidden="true" />
          Mareste comparatia
        </Button>
      </div>

      <div className="mt-4">
        <ImageCompareSlider
          beforeImageUrl={beforeImageUrl}
          afterImageUrl={afterImageUrl}
          className="min-h-[26rem]"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <BeforeAfterImage
          label="Inainte"
          imageUrl={beforeImageUrl}
          tone="rose"
          onOpen={onOpen}
        />
        <BeforeAfterImage
          label="Dupa"
          imageUrl={afterImageUrl}
          tone="emerald"
          onOpen={onOpen}
        />
      </div>
    </section>
  )
}

function ImageCompareSlider({
  beforeImageUrl,
  afterImageUrl,
  className,
}: {
  beforeImageUrl: string
  afterImageUrl: string
  className?: string
}) {
  const [position, setPosition] = useState(50)

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-lg border border-emerald-100 bg-orange-50">
        <div className="relative min-h-[26rem] w-full">
          <img
            src={afterImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <img
              src={beforeImageUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,118,110,0.45)]"
            style={{ left: `${position}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-200 bg-white text-xs font-bold text-emerald-700 shadow-sm"
            style={{ left: `${position}%` }}
          >
            ||
          </div>
          <span className="absolute left-3 top-3 rounded-md bg-rose-50/95 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
            Inainte
          </span>
          <span className="absolute right-3 top-3 rounded-md bg-emerald-50/95 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Dupa
          </span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        aria-label="Controleaza comparatia inainte si dupa"
        className="mt-3 h-2 w-full accent-emerald-600"
        onChange={(event) => setPosition(Number(event.target.value))}
      />
    </div>
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

function ResolutionImpactBanner({ gamification }: { gamification: ResolutionGamification }) {
  const points = gamification?.pointsAwarded ?? 0
  const badges = gamification?.unlockedBadges ?? []
  const primaryStat = points > 0
    ? { label: 'Puncte', value: `+${points}` }
    : { label: 'Status', value: 'Rezolvat' }
  const secondaryStat = points > 0
    ? { label: 'Badge-uri', value: badges.length > 0 ? String(badges.length) : '0' }
    : { label: 'Dovada', value: 'After' }

  return (
    <motion.section
      className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <motion.span
          className="relative flex size-14 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
          initial={{ scale: 0.75, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        >
          <motion.span
            className="absolute inset-0 rounded-lg border border-emerald-300"
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.55 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            aria-hidden="true"
          />
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </motion.span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Rezolvare confirmata
          </p>
          <h2 className="text-xl font-semibold text-emerald-950">
            Ai inchis problema si impactul e vizibil pe harta
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Poza de dupa ramane in before/after, iar raportul intra in zona de probleme rezolvate.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:w-56">
          <ImpactStat label={primaryStat.label} value={primaryStat.value} />
          <ImpactStat label={secondaryStat.label} value={secondaryStat.value} />
        </div>
      </div>
      <div className="grid h-1 grid-cols-4">
        <span className="bg-emerald-500" />
        <span className="bg-lime-400" />
        <span className="bg-teal-500" />
        <span className="bg-yellow-300" />
      </div>
    </motion.section>
  )
}

function ResolutionPanel({
  issue,
  isResolved,
  authStatus,
  isAuthenticated,
  mutation,
}: {
  issue: IssueResponse
  isResolved: boolean
  authStatus: 'loading' | 'authenticated' | 'unauthenticated'
  isAuthenticated: boolean
  mutation: UseMutationResult<
    ResolveIssueResponse,
    Error,
    { afterImage: File; resolutionNote: string }
  >
}) {
  const [afterImage, setAfterImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const canSubmit = Boolean(afterImage) && !mutation.isPending
  const verified = mutation.data?.verified === true
  const rejected = mutation.data?.verified === false

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    setAfterImage(file)
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }

      return file ? URL.createObjectURL(file) : null
    })
    mutation.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!afterImage || !canSubmit) {
      return
    }

    mutation.mutate({
      afterImage,
      resolutionNote,
    })
  }

  if (isResolved) {
    return (
      <ResolutionSuccessCard gamification={mutation.data?.gamification ?? issue.gamification} />
    )
  }

  if (authStatus !== 'loading' && !isAuthenticated) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
        <span className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
          <Camera className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-emerald-950">
          Ai rezolvat problema?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Autentifica-te ca sa incarci poza de dupa, sa porneasca agentul de verificare si sa primesti puncte.
        </p>
        <Button asChild size="sm" className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700">
          <Link to={`/login?returnTo=/issues/${issue.id}`}>
            <Upload data-icon="inline-start" aria-hidden="true" />
            Intra in cont
          </Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
        <ImagePlus className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-emerald-950">
        Am rezolvat problema
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Incarca o poza clara de dupa interventie. Resolution Agent verifica imaginea si acorda punctele doar daca problema pare rezolvata.
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Poza de dupa
          </span>
          <span className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 px-3 py-4 text-center text-sm text-emerald-800 transition hover:bg-emerald-50">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Previzualizare poza dupa"
                className="max-h-44 w-full rounded-md object-cover"
              />
            ) : (
              <>
                <Upload className="size-6" aria-hidden="true" />
                <span className="mt-2 font-semibold">Alege imagine</span>
                <span className="mt-1 text-xs text-slate-500">JPG sau PNG, zona rezolvata vizibila</span>
              </>
            )}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageChange}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Ce ai facut? Optional
          </span>
          <textarea
            value={resolutionNote}
            onChange={(event) => {
              setResolutionNote(event.target.value)
              mutation.reset()
            }}
            rows={3}
            className="mt-2 w-full resize-none rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            placeholder="Ex: Am strans deseurile si zona este libera acum. Poti lasa gol daca poza arata clar rezolvarea."
          />
        </label>

        {mutation.isError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {mutation.error.message}
          </p>
        )}

        {rejected && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            {mutation.data?.message}
          </p>
        )}

        <AnimatePresence>
          {verified && mutation.data?.gamification && (
            <ResolutionRewardSummary gamification={mutation.data.gamification} />
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {mutation.isPending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles data-icon="inline-start" aria-hidden="true" />
          )}
          Trimite la verificare
        </Button>
      </form>
    </section>
  )
}

function ResolutionSuccessCard({ gamification }: { gamification: ResolutionGamification }) {
  return (
    <motion.section
      className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="p-4">
        <motion.span
          className="flex size-12 items-center justify-center rounded-lg bg-emerald-600 text-white"
          initial={{ scale: 0.75 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        >
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </motion.span>
        <h2 className="mt-4 text-lg font-semibold text-emerald-950">
          Problema este rezolvata
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          CiviTm pastreaza poza inainte/dupa si impactul este vizibil pe harta.
        </p>

        {gamification ? (
          <div className="mt-4">
            <ResolutionRewardSummary gamification={gamification} compact />
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800">
            Rezolvarea este inregistrata in admin si in feed-ul public.
          </div>
        )}
      </div>
    </motion.section>
  )
}

function ResolutionRewardSummary({
  gamification,
  compact = false,
}: {
  gamification: NonNullable<ResolutionGamification>
  compact?: boolean
}) {
  return (
    <motion.div
      className="rounded-lg border border-lime-200 bg-lime-50 px-3 py-3 text-sm text-lime-950 shadow-sm"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <Trophy className="size-4 text-yellow-600" aria-hidden="true" />
          +{gamification.pointsAwarded} puncte civice
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-lime-200">
          {gamification.currentRank.name}
        </span>
      </div>
      <p className="mt-1 text-lime-800">
        Total {gamification.totalPoints} puncte dupa verificare.
      </p>
      {!compact && gamification.pointAwards.length > 0 && (
        <div className="mt-3 grid gap-2">
          {gamification.pointAwards.map((award) => (
            <motion.div
              key={award.sourceType}
              className="flex items-center justify-between rounded-md bg-white px-2 py-2 text-xs font-semibold text-slate-700 ring-1 ring-lime-100"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <span>{roPointAward(award.reason)}</span>
              <span className="text-emerald-700">+{award.points}</span>
            </motion.div>
          ))}
        </div>
      )}
      {gamification.unlockedBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {gamification.unlockedBadges.map((badge) => (
            <motion.span
              key={badge.id}
              className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-lime-200"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {badge.name}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ImpactStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-center">
      <motion.p
        className="text-xl font-semibold text-emerald-950"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.2, ease: 'easeOut' }}
      >
        {value}
      </motion.p>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{label}</p>
    </div>
  )
}

function roPointAward(reason: string) {
  const labels: Record<string, string> = {
    'After photo uploaded': 'Poza de dupa',
    'Issue resolved by citizen': 'Problema inchisa',
  }

  return labels[reason] ?? reason
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
  tone,
  onOpen,
}: {
  label: string
  imageUrl: string
  tone: 'emerald' | 'rose'
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      className="group overflow-hidden rounded-lg border border-emerald-100 text-left outline-none transition hover:border-emerald-300 focus-visible:ring-3 focus-visible:ring-emerald-300/60"
      aria-label={`Mareste comparatia ${label.toLowerCase()}`}
      onClick={onOpen}
    >
      <span className="relative flex aspect-[4/3] w-full items-center justify-center bg-slate-100">
        <img src={imageUrl} alt="" className="h-full w-full object-contain" />
        <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg bg-white/90 text-emerald-700 opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <Search className="size-4" aria-hidden="true" />
        </span>
      </span>
      <span
        className={`block px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
          tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}
      >
        {label}
      </span>
    </button>
  )
}

function ImagePreviewDialog({
  preview,
  onClose,
}: {
  preview: null | {
    title: string
    images: Array<{
      label: string
      imageUrl: string
      tone: 'emerald' | 'rose'
    }>
  }
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {preview && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={preview.title}
          onClick={onClose}
        >
          <motion.div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-emerald-100 px-3 py-2.5 sm:px-4">
              <h2 className="min-w-0 truncate text-sm font-semibold text-emerald-950 sm:text-base">
                {preview.title}
              </h2>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Inchide previzualizarea imaginii"
                onClick={onClose}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="grid max-h-[calc(92vh-3.25rem)] gap-3 overflow-auto bg-slate-50 p-3 sm:grid-cols-2 sm:p-4">
              {preview.images.map((image) => (
                <figure
                  key={`${image.label}-${image.imageUrl}`}
                  className="overflow-hidden rounded-lg border border-emerald-100 bg-white"
                >
                  <div className="flex max-h-[72vh] min-h-60 items-center justify-center bg-slate-100">
                    <img
                      src={image.imageUrl}
                      alt=""
                      className="max-h-[72vh] w-full object-contain"
                    />
                  </div>
                  <figcaption
                    className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                      image.tone === 'emerald'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {image.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
