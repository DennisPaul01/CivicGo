import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  Check,
  FileWarning,
  HeartHandshake,
  MapPinned,
  MessageSquareText,
  Sparkles,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { ImageUploader } from '@/components/report/ImageUploader'
import { IssueDescriptionInput } from '@/components/report/IssueDescriptionInput'
import { LocationPicker } from '@/components/report/LocationPicker'
import { ReportSuccessCard } from '@/components/report/ReportSuccessCard'
import { SubmitIssueButton } from '@/components/report/SubmitIssueButton'
import { Button } from '@/components/ui/button'
import type { ReportStreamState } from '@/components/report/ReportAgentFlow'
import type { ReportLocation } from '@/data/reportLocations'
import {
  apiBaseUrl,
  createIssue,
  isApiConfigured,
  type AgentStepResponse,
  type IssueResponse,
} from '@/lib/api'
import { issueQueryKey, issuesQueryKey, missionsQueryKey } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useMapStore } from '@/stores/mapStore'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'
type MobileReportStep = 'photo' | 'details' | 'location'

type ReportDraft = {
  imageName: string
  description: string
  location: ReportLocation
  createdIssue: IssueResponse
  createdAt: string
}

const initialStreamState: ReportStreamState = {
  missionCreated: false,
  rewardMatched: false,
  zoneScoreUpdated: false,
  pipelineFailed: false,
  pointsAwarded: null,
  totalPoints: null,
  rankName: null,
  badges: [],
}

type StreamEnvelope = {
  type?: string
  data?: {
    agentName?: string
    step?: AgentStepResponse | null
    category?: string
    severity?: string
    summary?: string | null
    confidence?: number | null
    isUrgent?: boolean
    isValidIssue?: boolean
    invalidReason?: string | null
    responsibleActor?: string
    rewardEligible?: boolean
    status?: string
    duplicateCount?: number
    nearestDuplicate?: IssueResponse['nearestDuplicate']
    missionId?: string
    rewardId?: string
    title?: string
    partnerName?: string | null
    impactPoints?: number
    pointsAwarded?: number
    totalPoints?: number
    rankName?: string
    name?: string
    badges?: string[]
  }
}

type PrefetchedReport = {
  key: string
  promise: Promise<IssueResponse>
  issue: IssueResponse | null
  error: Error | null
}

function createReportDraft(
  imageFiles: File[],
  description: string,
  location: ReportLocation,
  createdIssue: IssueResponse,
): ReportDraft {
  return {
    imageName:
      imageFiles.length === 1
        ? imageFiles[0]?.name ?? 'Imagine raport'
        : `${imageFiles.length} imagini`,
    description: description.trim(),
    location,
    createdIssue,
    createdAt: new Date().toISOString(),
  }
}

function createOptimisticIssue(
  imagePreviewUrl: string,
  description: string,
  location: ReportLocation,
): IssueResponse {
  const createdAt = new Date().toISOString()

  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `local-${crypto.randomUUID()}`
        : `local-${Date.now()}`,
    title: 'Semnal urban in procesare',
    description: description.trim() || null,
    category: 'other',
    severity: 'medium',
    status: 'new',
    responsibleActor: 'community_and_city_hall',
    imageUrl: imagePreviewUrl,
    imageUrls: imagePreviewUrl ? [imagePreviewUrl] : [],
    afterImageUrl: null,
    latitude: location.latitude,
    longitude: location.longitude,
    zoneName: location.zoneName ?? location.name,
    aiSummary: null,
    aiConfidence: null,
    isUrgent: false,
    rewardEligible: true,
    isValidIssue: true,
    invalidReason: null,
    aiAnalyzedAt: null,
    duplicateCount: 0,
    nearestDuplicate: null,
    agentRun: null,
    relatedMission: null,
    relatedReward: null,
    gamification: null,
    createdByUserId: 'local-user',
    createdAt,
  }
}

export function ReportIssuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.session)
  const profile = useAuthStore((state) => state.profile)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setActiveFilter = useMapStore((state) => state.setActiveFilter)
  const setSelectedItemId = useMapStore((state) => state.setSelectedItemId)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<ReportLocation | null>(
    null,
  )
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [formError, setFormError] = useState('')
  const [reportDraft, setReportDraft] = useState<ReportDraft | null>(null)
  const [activeMobileStep, setActiveMobileStep] =
    useState<MobileReportStep>('photo')
  const [streamState, setStreamState] =
    useState<ReportStreamState>(initialStreamState)
  const formRef = useRef<HTMLFormElement | null>(null)
  const prefetchedReportRef = useRef<PrefetchedReport | null>(null)
  const [prefetchedIssueId, setPrefetchedIssueId] = useState('')
  const visibleIssue = reportDraft?.createdIssue ?? null
  const patchVisibleIssue = useCallback(
    (issueId: string, updater: (issue: IssueResponse) => IssueResponse) => {
      queryClient.setQueryData<IssueResponse>(issueQueryKey(issueId), (currentIssue) =>
        currentIssue ? updater(currentIssue) : currentIssue,
      )
      queryClient.setQueryData<IssueResponse[]>(issuesQueryKey, (currentIssues = []) =>
        currentIssues.map((issue) => (issue.id === issueId ? updater(issue) : issue)),
      )
      setReportDraft((currentDraft) =>
        currentDraft?.createdIssue.id === issueId
          ? {
              ...currentDraft,
              createdIssue: updater(currentDraft.createdIssue),
            }
          : currentDraft,
      )
    },
    [queryClient],
  )
  const canSubmit = useMemo(
    () =>
      Boolean(
        imageFiles.length > 0 &&
          selectedLocation &&
          session?.access_token &&
          submitState !== 'submitting',
    ),
    [imageFiles.length, selectedLocation, session?.access_token, submitState],
  )
  const completionSteps = [
    {
      id: 'photo' as const,
      label: 'Fotografii',
      helper: imageFiles.length > 0 ? `${imageFiles.length} atasate` : 'obligatoriu',
      isDone: imageFiles.length > 0,
      icon: Camera,
    },
    {
      id: 'details' as const,
      label: 'Detalii',
      helper: description.trim() ? 'adaugate' : 'optional',
      isDone: description.trim().length > 0,
      icon: MessageSquareText,
    },
    {
      id: 'location' as const,
      label: 'Locatie',
      helper: selectedLocation ? selectedLocation.name : 'obligatoriu',
      isDone: Boolean(selectedLocation),
      icon: MapPinned,
    },
  ]
  const completedRequiredSteps =
    (imageFiles.length > 0 ? 1 : 0) + (selectedLocation ? 1 : 0)
  const progressPercent = (completedRequiredSteps / 2) * 100
  const activeMobileStepIndex = completionSteps.findIndex(
    (step) => step.id === activeMobileStep,
  )
  const isFirstMobileStep = activeMobileStepIndex === 0
  const isLastMobileStep = activeMobileStep === 'location'

  function goToMobileStep(step: MobileReportStep) {
    setActiveMobileStep(step)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function goToNextMobileStep() {
    const nextStep = completionSteps[activeMobileStepIndex + 1]

    if (nextStep) {
      goToMobileStep(nextStep.id)
    }
  }

  function goToPreviousMobileStep() {
    const previousStep = completionSteps[activeMobileStepIndex - 1]

    if (previousStep) {
      goToMobileStep(previousStep.id)
    }
  }

  const accessToken = session?.access_token ?? ''

  const reportPrefetchKey = useMemo(() => {
    if (!selectedLocation || imageFiles.length === 0 || !accessToken) {
      return ''
    }

    const imageSignature = imageFiles
      .map((file) => `${file.name}:${file.size}:${file.lastModified}`)
      .join('|')

    return [
      imageSignature,
      selectedLocation.id,
      selectedLocation.latitude,
      selectedLocation.longitude,
      selectedLocation.zoneName ?? selectedLocation.name,
      accessToken.slice(-10),
    ].join('::')
  }, [accessToken, imageFiles, selectedLocation])

  const startReportPrefetch = useCallback(() => {
    if (!reportPrefetchKey || !selectedLocation || imageFiles.length === 0) {
      return null
    }

    const currentPrefetch = prefetchedReportRef.current

    if (currentPrefetch?.key === reportPrefetchKey) {
      return currentPrefetch.promise
    }

    if (!accessToken) {
      return null
    }

    const promise = createIssue({
      images: imageFiles,
      description,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      zoneName: selectedLocation.zoneName ?? selectedLocation.name,
      accessToken,
    })

    const nextPrefetch: PrefetchedReport = {
      key: reportPrefetchKey,
      promise,
      issue: null,
      error: null,
    }

    prefetchedReportRef.current = nextPrefetch

    promise
      .then((createdIssue) => {
        if (prefetchedReportRef.current?.key !== reportPrefetchKey) {
          return createdIssue
        }

        prefetchedReportRef.current = {
          ...nextPrefetch,
          issue: createdIssue,
        }
        queryClient.setQueryData(issueQueryKey(createdIssue.id), createdIssue)
        queryClient.setQueryData<IssueResponse[]>(
          issuesQueryKey,
          (currentIssues = []) => [
            createdIssue,
            ...currentIssues.filter((issue) => issue.id !== createdIssue.id),
          ],
        )
        setPrefetchedIssueId(createdIssue.id)

        return createdIssue
      })
      .catch((error: unknown) => {
        if (prefetchedReportRef.current?.key !== reportPrefetchKey) {
          return
        }

        prefetchedReportRef.current = {
          ...nextPrefetch,
          error: error instanceof Error ? error : new Error('Prefetch failed.'),
        }
      })

    return promise
  }, [
    description,
    imageFiles,
    queryClient,
    reportPrefetchKey,
    selectedLocation,
    accessToken,
  ])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  useEffect(() => {
    const clearPrefetchedIssueId = () => {
      window.setTimeout(() => setPrefetchedIssueId(''), 0)
    }

    if (!reportPrefetchKey) {
      prefetchedReportRef.current = null
      clearPrefetchedIssueId()
      return
    }

    if (submitState !== 'idle') {
      return
    }

    if (
      prefetchedReportRef.current &&
      prefetchedReportRef.current.key !== reportPrefetchKey
    ) {
      prefetchedReportRef.current = null
      clearPrefetchedIssueId()
    }

    const timeout = window.setTimeout(() => {
      startReportPrefetch()
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [reportPrefetchKey, startReportPrefetch, submitState])

  function handleFilesChange(files: File[]) {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))

    setImageFiles(files)
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)))
    setSubmitState('idle')
    setFormError('')
    setStreamState(initialStreamState)
    prefetchedReportRef.current = null
    setPrefetchedIssueId('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (imageFiles.length === 0) {
      setSubmitState('error')
      setFormError('Adauga cel putin o fotografie inainte sa trimiti raportul.')
      goToMobileStep('photo')
      return
    }

    if (!selectedLocation) {
      setSubmitState('error')
      setFormError('Adauga locatia exacta sau alege o zona apropiata inainte de trimitere.')
      goToMobileStep('location')
      return
    }

    if (!session?.access_token) {
      setSubmitState('error')
      setFormError('Sesiunea a expirat. Autentifica-te din nou inainte de raportare.')
      return
    }

    const optimisticIssue = createOptimisticIssue(
      previewUrls[0] ?? '',
      description,
      selectedLocation,
    )
    setReportDraft(
      createReportDraft(imageFiles, description, selectedLocation, optimisticIssue),
    )
    setSubmitState('submitting')

    try {
      const prefetchedReport =
        prefetchedReportRef.current?.key === reportPrefetchKey
          ? prefetchedReportRef.current
          : null
      if (prefetchedReport?.error) {
        prefetchedReportRef.current = null
      }
      const createdIssue =
        prefetchedReport?.issue ??
        (await (prefetchedReport?.error
          ? startReportPrefetch()
          : prefetchedReport?.promise ?? startReportPrefetch()))

      if (!createdIssue) {
        throw new Error('CiviTm nu a putut pregati raportul.')
      }

      const nextDraft = createReportDraft(
        imageFiles,
        description,
        selectedLocation,
        createdIssue,
      )
      queryClient.setQueryData<IssueResponse[]>(
        issuesQueryKey,
        (currentIssues = []) => [
          createdIssue,
          ...currentIssues.filter((issue) => issue.id !== createdIssue.id),
        ],
      )
      queryClient.setQueryData(issueQueryKey(createdIssue.id), createdIssue)
      void queryClient.invalidateQueries({ queryKey: issuesQueryKey })
      void queryClient.invalidateQueries({ queryKey: missionsQueryKey })
      if (profile && createdIssue.gamification) {
        setProfile({
          ...profile,
          points: createdIssue.gamification.totalPoints,
          rankName: createdIssue.gamification.currentRank.name,
        })
      }
      setActiveFilter('all')
      setSelectedItemId(createdIssue.id)
      setReportDraft(nextDraft)
      setSubmitState('success')
    } catch (error) {
      setSubmitState('error')
      setFormError(
        error instanceof Error
          ? error.message
          : 'CiviTm nu a putut salva raportul.',
      )
    }
  }

  function resetReportForm() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))

    setImageFiles([])
    setPreviewUrls([])
    setDescription('')
    setSelectedLocation(null)
    setActiveMobileStep('photo')
    setSubmitState('idle')
    setFormError('')
    setReportDraft(null)
    setStreamState(initialStreamState)
    prefetchedReportRef.current = null
    setPrefetchedIssueId('')
  }

  function viewIssueOnMap(issueId: string) {
    setActiveFilter('all')
    setSelectedItemId(issueId)
    navigate(`/?issue=${issueId}`)
  }

  useEffect(() => {
    if (!profile || streamState.totalPoints === null) {
      return
    }

    if (
      profile.points === streamState.totalPoints &&
      profile.rankName === streamState.rankName
    ) {
      return
    }

    setProfile({
      ...profile,
      points: streamState.totalPoints,
      rankName: streamState.rankName ?? profile.rankName,
    })
  }, [profile, setProfile, streamState.rankName, streamState.totalPoints])

  const reportDraftIssueId =
    reportDraft?.createdIssue.id && !reportDraft.createdIssue.id.startsWith('local-')
      ? reportDraft.createdIssue.id
      : ''
  const streamedIssueId = reportDraftIssueId || prefetchedIssueId

  useEffect(() => {
    if (!isApiConfigured || !streamedIssueId) {
      return
    }

    const issueId = streamedIssueId
    const source = new EventSource(`${apiBaseUrl}/api/issues/${issueId}/events`)
    const streamedEvents = [
      'issue.created',
      'agent.step.completed',
      'issue.analyzed',
      'duplicate.detected',
      'mission.created',
      'reward.matched',
      'points.awarded',
      'badge.unlocked',
      'rank.changed',
      'zone.score.updated',
      'issue.status.changed',
      'issue.resolved',
      'agent.pipeline.failed',
    ]
    const updateStreamState = (eventName: string, event: Event) => {
      let envelope: StreamEnvelope | null = null

      if ('data' in event && typeof event.data === 'string') {
        try {
          envelope = JSON.parse(event.data) as StreamEnvelope
        } catch {
          envelope = null
        }
      }

      setStreamState((current) => ({
        ...current,
        missionCreated: current.missionCreated || eventName === 'mission.created',
        rewardMatched: current.rewardMatched || eventName === 'reward.matched',
        zoneScoreUpdated:
          current.zoneScoreUpdated || eventName === 'zone.score.updated',
        pipelineFailed:
          current.pipelineFailed || eventName === 'agent.pipeline.failed',
        pointsAwarded:
          eventName === 'points.awarded'
            ? envelope?.data?.pointsAwarded ?? current.pointsAwarded
            : current.pointsAwarded,
        totalPoints:
          eventName === 'points.awarded'
            ? envelope?.data?.totalPoints ?? current.totalPoints
            : current.totalPoints,
        rankName:
          eventName === 'points.awarded' || eventName === 'rank.changed'
            ? envelope?.data?.rankName ?? current.rankName
            : current.rankName,
        badges:
          eventName === 'points.awarded'
            ? envelope?.data?.badges ?? current.badges
            : eventName === 'badge.unlocked' && envelope?.data?.name
              ? [...new Set([...current.badges, envelope.data.name])]
            : current.badges,
      }))

      if (eventName === 'issue.analyzed' && envelope?.data) {
        const isValidIssue = envelope.data?.isValidIssue ?? true
        patchVisibleIssue(issueId, (currentIssue) => ({
          ...currentIssue,
          category: envelope.data?.category ?? currentIssue.category,
          severity: envelope.data?.severity ?? currentIssue.severity,
          aiSummary: envelope.data?.summary ?? currentIssue.aiSummary,
          aiConfidence: envelope.data?.confidence ?? currentIssue.aiConfidence,
          isUrgent: envelope.data?.isUrgent ?? currentIssue.isUrgent,
          isValidIssue,
          invalidReason:
            isValidIssue === false
              ? envelope.data?.invalidReason ?? currentIssue.invalidReason
              : null,
          responsibleActor:
            envelope.data?.responsibleActor ?? currentIssue.responsibleActor,
          rewardEligible:
            envelope.data?.rewardEligible ?? currentIssue.rewardEligible,
          status:
            envelope.data?.status ??
            (isValidIssue === false ? 'rejected' : 'ai_analyzed'),
          aiAnalyzedAt: new Date().toISOString(),
        }))
      }

      if (eventName === 'duplicate.detected' && envelope?.data) {
        patchVisibleIssue(issueId, (currentIssue) => ({
          ...currentIssue,
          duplicateCount: envelope.data?.duplicateCount ?? currentIssue.duplicateCount,
          nearestDuplicate:
            envelope.data?.nearestDuplicate ?? currentIssue.nearestDuplicate,
          status:
            (envelope.data?.duplicateCount ?? currentIssue.duplicateCount) > 0
              ? 'duplicate_detected'
              : currentIssue.status,
        }))
      }

      if (eventName === 'mission.created' && envelope?.data?.missionId) {
        patchVisibleIssue(issueId, (currentIssue) => ({
          ...currentIssue,
          relatedMission: {
            id: envelope.data?.missionId ?? '',
            title: envelope.data?.title ?? 'Misiune civica in zona',
            status: 'active',
            participantsNeeded:
              currentIssue.relatedMission?.participantsNeeded ?? 5,
            participantsJoined:
              currentIssue.relatedMission?.participantsJoined ?? 0,
            impactPoints:
              envelope.data?.impactPoints ??
              currentIssue.relatedMission?.impactPoints ??
              80,
            reward: currentIssue.relatedMission?.reward ?? null,
          },
        }))
      }

      if (eventName === 'reward.matched' && envelope?.data?.rewardId) {
        patchVisibleIssue(issueId, (currentIssue) => ({
          ...currentIssue,
          relatedReward: {
            id: envelope.data?.rewardId ?? '',
            type: 'partner',
            title: envelope.data?.title ?? 'Recompensa locala',
            partnerName: envelope.data?.partnerName ?? null,
            requiredPoints: currentIssue.relatedReward?.requiredPoints ?? 0,
            status: currentIssue.relatedReward?.status ?? 'active',
          },
        }))
      }

      if (eventName === 'agent.step.completed' && envelope?.data?.step) {
        const nextStep = envelope.data.step

        patchVisibleIssue(issueId, (currentIssue) => {
            const currentRun = currentIssue.agentRun
            const currentSteps = currentRun?.steps ?? []
            const nextSteps = [
              ...currentSteps.filter((step) => step.id !== nextStep.id),
              nextStep,
            ].sort((a, b) => a.order - b.order)

            return {
              ...currentIssue,
              agentRun: currentRun
                ? {
                    ...currentRun,
                    steps: nextSteps,
                  }
                : {
                    id: nextStep.agentRunId,
                    issueId,
                    status: 'running',
                    startedAt: nextStep.startedAt ?? new Date().toISOString(),
                    completedAt: null,
                    createdAt: nextStep.startedAt ?? new Date().toISOString(),
                    steps: nextSteps,
                  },
            }
        })
      }
    }

    const handleIssueEvent = (event: Event) => {
      updateStreamState(event.type, event)
    }

    streamedEvents.forEach((eventName) => {
      source.addEventListener(eventName, handleIssueEvent)
    })

    return () => {
      streamedEvents.forEach((eventName) => {
        source.removeEventListener(eventName, handleIssueEvent)
      })
      source.close()
    }
  }, [patchVisibleIssue, streamedIssueId])

  return (
    <main className="min-h-svh bg-[#f7fbf2] px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <div className="sticky top-3 z-50 mx-auto mb-4 w-full max-w-6xl sm:top-4">
        <TopNavigation />
      </div>
      <section className="mx-auto w-full max-w-6xl">
        <Link
          to="/"
          className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-emerald-800 transition hover:bg-white hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Harta live
        </Link>

        <div className="min-w-0 pb-32 sm:pb-0">
          {!(
            (submitState === 'submitting' || submitState === 'success') &&
            reportDraft &&
            visibleIssue
          ) && (
          <div className="mb-4 overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm">
            <div className="grid gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm sm:size-11">
                    <HeartHandshake className="size-4.5 sm:size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Raport CiviTm
                    </p>
                    <h1 className="!my-0 !text-xl !leading-tight font-semibold text-emerald-950 sm:!text-3xl">
                      Semnaleaza rapid o problema urbana
                    </h1>
                  </div>
                </div>
                <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-slate-600 sm:block sm:text-base">
                  Adauga o poza, confirma locatia si CiviTm o trimite prin analiza AI,
                  harta live si misiunile civice.
                </p>
              </div>

              <div className="rounded-lg border border-lime-200 bg-lime-50/80 p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">
                      Gata de trimis
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-950">
                      {completedRequiredSteps}/2 pasi obligatorii completati
                    </p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white text-lime-700 shadow-sm">
                    <Sparkles className="size-4.5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="hidden border-t border-emerald-100 bg-emerald-50/40 sm:grid sm:grid-cols-3">
              {completionSteps.map((step) => {
                const StepIcon = step.icon

                return (
                  <div
                    key={step.label}
                    className="flex min-h-16 items-center gap-3 border-t border-emerald-100 px-4 py-3 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
                  >
                    <span
                      className={
                        step.isDone
                          ? 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white'
                          : 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700'
                      }
                    >
                      {step.isDone ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <StepIcon className="size-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-emerald-950">
                        {step.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-slate-600">
                        {step.helper}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          )}

          {(submitState === 'submitting' || submitState === 'success') &&
          reportDraft &&
          visibleIssue ? (
            <ReportSuccessCard
              location={reportDraft.location}
              description={reportDraft.description}
              issue={visibleIssue}
              imagePreviewUrl={previewUrls[0] ?? visibleIssue.imageUrl}
              streamState={streamState}
              isSaving={submitState === 'submitting'}
              onStartNewReport={resetReportForm}
              onViewOnMap={() => viewIssueOnMap(visibleIssue.id)}
            />
          ) : (
            <motion.form
              ref={formRef}
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="sticky top-20 z-20 -mx-1 rounded-lg border border-emerald-200 bg-white/96 p-1 shadow-sm backdrop-blur lg:hidden">
                <div className="grid grid-cols-3 gap-1">
                  {completionSteps.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = activeMobileStep === step.id

                    return (
                      <button
                        key={step.id}
                        type="button"
                        className={cn(
                          'flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-center text-[0.68rem] font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25',
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : step.isDone
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800',
                        )}
                        aria-current={isActive ? 'step' : undefined}
                        onClick={() => goToMobileStep(step.id)}
                      >
                        <span
                          className={cn(
                            'flex size-5 items-center justify-center rounded-full',
                            isActive
                              ? 'bg-white/16'
                              : step.isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {step.isDone ? (
                            <Check className="size-3" aria-hidden="true" />
                          ) : (
                            <StepIcon className="size-3" aria-hidden="true" />
                          )}
                        </span>
                        <span className="max-w-full truncate">
                          {index + 1}. {step.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid min-w-0 gap-4">
                <div
                  className={cn(
                    activeMobileStep === 'photo' ? 'block' : 'hidden',
                    'lg:block',
                  )}
                >
                  <ImageUploader
                    files={imageFiles}
                    previewUrls={previewUrls}
                    onFilesChange={handleFilesChange}
                  />
                </div>

                <div
                  className={cn(
                    activeMobileStep === 'details' ? 'block' : 'hidden',
                    'lg:block',
                  )}
                >
                  <IssueDescriptionInput
                    value={description}
                    onChange={(value) => {
                      setDescription(value)
                      setSubmitState('idle')
                      setFormError('')
                    }}
                  />
                </div>

                <div
                  className={cn(
                    activeMobileStep === 'location' ? 'block' : 'hidden',
                    'lg:block',
                  )}
                >
                  <LocationPicker
                    selectedLocationId={selectedLocation?.id ?? ''}
                    selectedLocation={selectedLocation}
                    onLocationChange={(location) => {
                      setSelectedLocation(location)
                      setSubmitState('idle')
                      setFormError('')
                    }}
                  />
                </div>
              </div>

              <aside className="hidden gap-3 lg:sticky lg:top-4 lg:grid">
                <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Rezumat rapid
                  </p>
                  <div className="mt-3 grid gap-2">
                    {completionSteps.map((step) => {
                      const StepIcon = step.icon

                      return (
                        <div
                          key={step.label}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <span
                            className={
                              step.isDone
                                ? 'flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white'
                                : 'flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-500'
                            }
                          >
                            {step.isDone ? (
                              <Check className="size-3.5" aria-hidden="true" />
                            ) : (
                              <StepIcon className="size-3.5" aria-hidden="true" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900">
                              {step.label}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {step.helper}
                            </span>
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-900">
                    Dupa trimitere, raportul apare pe harta si porneste timeline-ul AI.
                  </p>
                </div>

                {formError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </div>
                )}

                <SubmitIssueButton
                  isSubmitting={submitState === 'submitting'}
                  disabled={!canSubmit}
                />
              </aside>

              <div className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-emerald-200 bg-white/96 p-2 shadow-xl shadow-slate-900/14 backdrop-blur lg:hidden">
                {formError && (
                  <div className="mb-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium leading-5 text-rose-700">
                    <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 min-w-20 border-emerald-200 text-emerald-800"
                    disabled={isFirstMobileStep}
                    onClick={goToPreviousMobileStep}
                  >
                    Inapoi
                  </Button>

                  {isLastMobileStep ? (
                    <div className="min-w-0 flex-1">
                      <SubmitIssueButton
                        isSubmitting={submitState === 'submitting'}
                        disabled={!canSubmit}
                      />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="h-11 flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                      disabled={activeMobileStep === 'photo' && imageFiles.length === 0}
                      onClick={goToNextMobileStep}
                    >
                      {activeMobileStep === 'photo' && imageFiles.length === 0
                        ? 'Adauga poza'
                        : activeMobileStep === 'photo'
                          ? 'Continua la detalii'
                        : activeMobileStep === 'details'
                          ? 'Alege locatia'
                          : 'Continua'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.form>
          )}
        </div>
      </section>
    </main>
  )
}
