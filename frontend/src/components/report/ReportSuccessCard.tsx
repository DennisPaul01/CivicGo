import { Bot, CheckCircle2, Flag, Gift, ImageUp, MapPin, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AgentTimeline } from '@/components/agents/AgentTimeline'
import { AchievementCard } from '@/components/gamification/AchievementCard'
import { Button } from '@/components/ui/button'
import type { ReportLocation } from '@/data/reportLocations'
import type { IssueResponse } from '@/lib/api'

type ReportSuccessCardProps = {
  location: ReportLocation
  description: string
  issue: IssueResponse
}

export function ReportSuccessCard({
  location,
  description,
  issue,
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
        Signal saved
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        CiviTm saved the image in Supabase Storage and created a new issue in
        the API. The AI agents checked it and prepared the next civic action.
      </p>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>
            <span className="block font-semibold text-slate-800">
              {location.name}
            </span>
            <span className="block text-slate-600">{location.address}</span>
          </span>
        </div>

        {description && (
          <div className="flex items-start gap-2 rounded-lg border border-purple-100 bg-purple-50 p-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-700" aria-hidden="true" />
            <span className="text-slate-700">{description}</span>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <ImageUp className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <span>
            <span className="block font-semibold text-emerald-950">
              Issue #{issue.id.slice(0, 8)} created
            </span>
            <span className="block text-slate-600">
              Status: {issue.status} · Image URL stored
            </span>
          </span>
        </div>

        {issue.aiSummary && (
          <div className="flex items-start gap-2 rounded-lg border border-teal-100 bg-teal-50 p-3">
            <Bot className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-teal-950">
                AI checked: {issue.category.replaceAll('_', ' ')} · {issue.severity}
              </span>
              <span className="mt-1 block text-slate-700">{issue.aiSummary}</span>
              {issue.aiConfidence !== null && (
                <span className="mt-1 block text-xs font-medium text-teal-700">
                  Confidence: {Math.round(issue.aiConfidence * 100)}%
                </span>
              )}
            </span>
          </div>
        )}

        {issue.relatedMission && (
          <div className="flex items-start gap-2 rounded-lg border border-lime-100 bg-lime-50 p-3">
            <Flag className="mt-0.5 size-4 shrink-0 text-lime-700" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-lime-950">
                Mission generated: {issue.relatedMission.title}
              </span>
              <span className="mt-1 block text-slate-700">
                {issue.relatedMission.participantsJoined}/
                {issue.relatedMission.participantsNeeded} joined · +
                {issue.relatedMission.impactPoints} mission impact points
              </span>
            </span>
          </div>
        )}

        {issue.relatedReward && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-100 bg-yellow-50 p-3">
            <Gift className="mt-0.5 size-4 shrink-0 text-yellow-700" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-yellow-950">
                Reward matched: {issue.relatedReward.title}
              </span>
              <span className="mt-1 block text-slate-700">
                {issue.relatedReward.partnerName ?? 'CiviTm system reward'} ·{' '}
                {issue.relatedReward.requiredPoints} Civic Points required
              </span>
            </span>
          </div>
        )}
      </div>

      {issue.gamification && (
        <AchievementCard gamification={issue.gamification} />
      )}

      <AgentTimeline run={issue.agentRun} />

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Link to={`/issues/${issue.id}`}>View issue details</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/?issue=${issue.id}`}>View on live map</Link>
        </Button>
        {issue.relatedMission && (
          <Button asChild variant="outline">
            <Link to={`/missions/${issue.relatedMission.id}`}>Open mission</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/report">Share another signal</Link>
        </Button>
      </div>
    </motion.section>
  )
}
