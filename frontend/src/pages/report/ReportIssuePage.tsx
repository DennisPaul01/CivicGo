import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileWarning, HeartHandshake } from 'lucide-react'
import { motion } from 'motion/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageUploader } from '@/components/report/ImageUploader'
import { IssueDescriptionInput } from '@/components/report/IssueDescriptionInput'
import { LocationPicker } from '@/components/report/LocationPicker'
import { ReportSuccessCard } from '@/components/report/ReportSuccessCard'
import { SubmitIssueButton } from '@/components/report/SubmitIssueButton'
import type { ReportStreamState } from '@/components/report/ReportAgentFlow'
import type { ReportLocation } from '@/data/reportLocations'
import {
  apiBaseUrl,
  createIssue,
  fetchIssueById,
  isApiConfigured,
  type IssueResponse,
} from '@/lib/api'
import { issueQueryKey, issuesQueryKey, missionsQueryKey } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { useMapStore } from '@/stores/mapStore'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

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
    pointsAwarded?: number
    totalPoints?: number
    rankName?: string
    badges?: string[]
  }
}

function createReportDraft(
  imageFile: File,
  description: string,
  location: ReportLocation,
  createdIssue: IssueResponse,
): ReportDraft {
  return {
    imageName: imageFile.name,
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
    afterImageUrl: null,
    latitude: location.latitude,
    longitude: location.longitude,
    zoneName: location.zoneName ?? location.name,
    aiSummary: null,
    aiConfidence: null,
    isUrgent: false,
    rewardEligible: true,
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
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.session)
  const profile = useAuthStore((state) => state.profile)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setActiveFilter = useMapStore((state) => state.setActiveFilter)
  const setSelectedItemId = useMapStore((state) => state.setSelectedItemId)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<ReportLocation | null>(
    null,
  )
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [formError, setFormError] = useState('')
  const [reportDraft, setReportDraft] = useState<ReportDraft | null>(null)
  const [streamState, setStreamState] =
    useState<ReportStreamState>(initialStreamState)
  const streamRefetchTimerRef = useRef<number | null>(null)
  const liveIssueQuery = useQuery({
    queryKey: issueQueryKey(reportDraft?.createdIssue.id ?? ''),
    queryFn: () => fetchIssueById(reportDraft!.createdIssue.id),
    enabled: submitState === 'success' && Boolean(reportDraft?.createdIssue.id),
  })
  const visibleIssue = liveIssueQuery.data ?? reportDraft?.createdIssue ?? null

  const canSubmit = useMemo(
    () =>
      Boolean(
        imageFile &&
          selectedLocation &&
          session?.access_token &&
          submitState !== 'submitting',
      ),
    [imageFile, selectedLocation, session?.access_token, submitState],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleFileChange(file: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setImageFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
    setSubmitState('idle')
    setFormError('')
    setStreamState(initialStreamState)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!imageFile) {
      setSubmitState('error')
      setFormError('Adauga o fotografie inainte sa trimiti raportul.')
      return
    }

    if (!selectedLocation) {
      setSubmitState('error')
      setFormError('Adauga locatia exacta sau alege o zona apropiata inainte de trimitere.')
      return
    }

    if (!session?.access_token) {
      setSubmitState('error')
      setFormError('Sesiunea a expirat. Autentifica-te din nou inainte de raportare.')
      return
    }

    const optimisticIssue = createOptimisticIssue(
      previewUrl,
      description,
      selectedLocation,
    )
    setReportDraft(
      createReportDraft(imageFile, description, selectedLocation, optimisticIssue),
    )
    setSubmitState('submitting')
    setStreamState(initialStreamState)

    try {
      const createdIssue = await createIssue({
        image: imageFile,
        description,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        zoneName: selectedLocation.zoneName ?? selectedLocation.name,
        accessToken: session.access_token,
      })
      const nextDraft = createReportDraft(
        imageFile,
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

  useEffect(() => {
    if (!profile || !liveIssueQuery.data?.gamification) {
      return
    }

    if (
      profile.points === liveIssueQuery.data.gamification.totalPoints &&
      profile.rankName === liveIssueQuery.data.gamification.currentRank.name
    ) {
      return
    }

    setProfile({
      ...profile,
      points: liveIssueQuery.data.gamification.totalPoints,
      rankName: liveIssueQuery.data.gamification.currentRank.name,
    })
  }, [liveIssueQuery.data?.gamification, profile, setProfile])

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

  useEffect(() => {
    if (!isApiConfigured || submitState !== 'success' || !reportDraft?.createdIssue.id) {
      return
    }

    const issueId = reportDraft.createdIssue.id
    const source = new EventSource(`${apiBaseUrl}/api/issues/${issueId}/events`)
    const streamedEvents = [
      'issue.created',
      'agent.step.completed',
      'issue.analyzed',
      'duplicate.detected',
      'mission.created',
      'reward.matched',
      'points.awarded',
      'zone.score.updated',
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
          eventName === 'points.awarded'
            ? envelope?.data?.rankName ?? current.rankName
            : current.rankName,
        badges:
          eventName === 'points.awarded'
            ? envelope?.data?.badges ?? current.badges
            : current.badges,
      }))
    }

    const handleIssueEvent = (event: Event) => {
      updateStreamState(event.type, event)

      if (streamRefetchTimerRef.current !== null) {
        window.clearTimeout(streamRefetchTimerRef.current)
      }

      streamRefetchTimerRef.current = window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: issueQueryKey(issueId) })
        streamRefetchTimerRef.current = null
      }, 250)
    }

    streamedEvents.forEach((eventName) => {
      source.addEventListener(eventName, handleIssueEvent)
    })

    return () => {
      streamedEvents.forEach((eventName) => {
        source.removeEventListener(eventName, handleIssueEvent)
      })
      if (streamRefetchTimerRef.current !== null) {
        window.clearTimeout(streamRefetchTimerRef.current)
        streamRefetchTimerRef.current = null
      }
      source.close()
    }
  }, [queryClient, reportDraft?.createdIssue.id, submitState])

  return (
    <main className="min-h-svh bg-orange-50 px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <Link
          to="/"
          className="mb-3 inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Harta live
        </Link>

        <div className="min-w-0">
          <div className="mb-4 rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <HeartHandshake className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Raport CiviTm
                </p>
                <h1 className="!my-0 !text-2xl !leading-tight font-semibold text-emerald-950 sm:!text-3xl">
                  Trimite un semnal urban
                </h1>
              </div>
            </div>
          </div>

          {(submitState === 'submitting' || submitState === 'success') &&
          reportDraft &&
          visibleIssue ? (
            <ReportSuccessCard
              location={reportDraft.location}
              description={reportDraft.description}
              issue={visibleIssue}
              imagePreviewUrl={previewUrl}
              streamState={streamState}
              isSaving={submitState === 'submitting'}
            />
          ) : (
            <motion.form
              className="grid gap-3"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ImageUploader
                file={imageFile}
                previewUrl={previewUrl}
                onFileChange={handleFileChange}
              />

              <IssueDescriptionInput
                value={description}
                onChange={(value) => {
                  setDescription(value)
                  setSubmitState('idle')
                  setFormError('')
                }}
              />

              <LocationPicker
                selectedLocationId={selectedLocation?.id ?? ''}
                selectedLocation={selectedLocation}
                onLocationChange={(location) => {
                  setSelectedLocation(location)
                  setSubmitState('idle')
                  setFormError('')
                }}
              />

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
            </motion.form>
          )}
        </div>
      </section>
    </main>
  )
}
