import { CheckCircle2 } from 'lucide-react'
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
}

export function ReportSuccessCard({
  location,
  description,
  issue,
  imagePreviewUrl,
  streamState,
  isSaving = false,
}: ReportSuccessCardProps) {
  return (
    <motion.section
      className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <span className="flex size-12 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </span>

      <h2 className="mt-4 text-2xl font-semibold text-emerald-950">
        {isSaving ? 'Semnalul intra in flow' : 'Semnal salvat'}
      </h2>

      <ReportAgentFlow
        issue={issue}
        location={location}
        description={description}
        imagePreviewUrl={imagePreviewUrl}
        streamState={streamState}
        isSaving={isSaving}
      />

      {!isSaving && (
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
            <Link to={`/issues/${issue.id}`}>Vezi detaliile problemei</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/?issue=${issue.id}`}>Vezi pe harta live</Link>
          </Button>
          {issue.relatedMission && (
            <Button asChild variant="outline">
              <Link to={`/missions/${issue.relatedMission.id}`}>Deschide misiunea</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/report">Trimite alt semnal</Link>
          </Button>
        </div>
      )}
    </motion.section>
  )
}
