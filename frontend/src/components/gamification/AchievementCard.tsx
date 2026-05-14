import { Award, Sparkles, TrendingUp, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import type { GamificationAwardResponse } from '@/lib/api'
import { roBadge, roPointReason, roRank } from '@/lib/locale'

type AchievementCardProps = {
  gamification: GamificationAwardResponse
}

export function AchievementCard({ gamification }: AchievementCardProps) {
  const hasBadges = gamification.unlockedBadges.length > 0
  const nextRankLabel = gamification.nextRank
    ? `${gamification.currentRank.pointsToNext} puncte pana la ${roRank(gamification.nextRank.name)}`
    : 'Rank maxim atins'

  return (
    <motion.section
      className="mt-4 rounded-lg border border-lime-100 bg-lime-50 p-4 text-slate-950"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.26, ease: 'easeOut', delay: 0.06 }}
      aria-label="Reusita civica"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-800">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">
              Progres civic
            </p>
            <h3 className="mt-1 text-lg font-semibold text-emerald-950">
              +{gamification.pointsAwarded} puncte civice
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Total: {gamification.totalPoints} puncte · {roRank(gamification.currentRank.name)}
            </p>
          </div>
        </div>

        {hasBadges && (
          <div className="rounded-md border border-emerald-100 bg-white/80 px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Award className="size-4 text-emerald-700" aria-hidden="true" />
              {roBadge(gamification.unlockedBadges[0].name)}
            </div>
            <p className="mt-1 max-w-56 text-xs leading-5 text-slate-600">
              {gamification.unlockedBadges[0].description}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-md border border-lime-100 bg-white/80 p-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold text-emerald-950">
            <TrendingUp className="size-4 text-emerald-700" aria-hidden="true" />
            Progres rank
          </span>
          <span className="text-xs font-medium text-slate-500">
            {nextRankLabel}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${gamification.currentRank.progressPercent}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      {gamification.pointAwards.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {gamification.pointAwards.map((award) => (
            <span
              key={`${award.sourceType}-${award.reason}`}
              className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-lime-900 ring-1 ring-lime-100"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {roPointReason(award.reason)}: +{award.points}
            </span>
          ))}
        </div>
      )}
    </motion.section>
  )
}
