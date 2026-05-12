import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, Gift, Handshake, PackageCheck, Sparkles, Store } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import { fetchRewards, isApiConfigured, type RewardResponse } from '@/lib/api'
import { rewardsQueryKey } from '@/lib/queryClient'

function getPartnerRewards(rewards: RewardResponse[]) {
  return rewards.filter((reward) => reward.type === 'partner')
}

export function PartnerDashboardPage() {
  const rewardsQuery = useQuery({
    queryKey: rewardsQueryKey,
    queryFn: fetchRewards,
  })
  const partnerRewards = getPartnerRewards(rewardsQuery.data ?? [])
  const claimedCount = partnerRewards.reduce(
    (total, reward) => total + reward.claimedCount,
    0,
  )
  const activeRewards = partnerRewards.filter(
    (reward) => reward.status === 'available',
  ).length

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
              <Handshake className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                CiviTm partner
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-emerald-950">
                Partner dashboard
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Live map
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/rewards">
                <Gift data-icon="inline-start" aria-hidden="true" />
                Rewards
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard
            icon={Store}
            label="Partner rewards"
            value={partnerRewards.length}
            detail="Seeded local offers ready for demo."
          />
          <MetricCard
            icon={PackageCheck}
            label="Claims"
            value={claimedCount}
            detail="Claimed or simulated partner rewards."
          />
          <MetricCard
            icon={Sparkles}
            label="Active offers"
            value={activeRewards}
            detail="Available rewards citizens can unlock."
          />
        </div>

        {rewardsQuery.isLoading && isApiConfigured ? (
          <DemoSkeletonGrid items={3} className="md:grid-cols-3" />
        ) : rewardsQuery.isError && isApiConfigured ? (
          <DemoState
            icon={Gift}
            tone="amber"
            eyebrow="Demo fallback"
            title="Partner rewards are using seeded context"
            description="The protected partner area is available; live reward data will reappear when the API responds."
          />
        ) : (
          <section className="grid gap-3 lg:grid-cols-2">
            {partnerRewards.map((reward) => (
              <article
                key={reward.id}
                className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50 text-yellow-700">
                    <Store className="size-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {reward.status}
                  </span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {reward.partner?.name ?? 'Local partner'}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-emerald-950">
                  {reward.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {reward.description}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                  <span>{reward.requiredPoints} points</span>
                  <span>{reward.claimedCount} claimed</span>
                  <span>{reward.zoneName ?? 'Citywide'}</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </motion.section>
    </main>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: number
  detail: string
}) {
  return (
    <article className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-emerald-700">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-emerald-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  )
}
