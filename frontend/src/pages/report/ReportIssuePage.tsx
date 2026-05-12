import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileWarning, HeartHandshake } from 'lucide-react'
import { motion } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { ImageUploader } from '@/components/report/ImageUploader'
import { IssueDescriptionInput } from '@/components/report/IssueDescriptionInput'
import { LocationPicker } from '@/components/report/LocationPicker'
import { ReportSuccessCard } from '@/components/report/ReportSuccessCard'
import { SubmitIssueButton } from '@/components/report/SubmitIssueButton'
import type { ReportLocation } from '@/data/reportLocations'
import { createIssue, type IssueResponse } from '@/lib/api'
import { issuesQueryKey, missionsQueryKey } from '@/lib/queryClient'
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
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    if (!imageFile) {
      setSubmitState('error')
      setFormError('Add a photo before submitting the report.')
      return
    }

    if (!selectedLocation) {
      setSubmitState('error')
      setFormError('Add an exact location or choose a nearby area before sending.')
      return
    }

    if (!session?.access_token) {
      setSubmitState('error')
      setFormError('Your session expired. Please login again before reporting.')
      return
    }

    setSubmitState('submitting')

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
          : 'CiviTm could not save this report.',
      )
    }
  }

  return (
    <main className="min-h-svh bg-orange-50 px-4 py-4 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-4xl">
        <Link
          to="/"
          className="mb-3 inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-500/25"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Live map
        </Link>

        <div className="min-w-0">
          <div className="mb-4 rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <HeartHandshake className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  CiviTm report
                </p>
                <h1 className="!my-0 !text-2xl !leading-tight font-semibold text-emerald-950 sm:!text-3xl">
                  Share a city signal
                </h1>
              </div>
            </div>
          </div>

          {submitState === 'success' && reportDraft ? (
            <ReportSuccessCard
              location={reportDraft.location}
              description={reportDraft.description}
              issue={reportDraft.createdIssue}
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
