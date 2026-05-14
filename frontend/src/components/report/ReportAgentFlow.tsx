import {
  Building2,
  Bot,
  Check,
  CircleDashed,
  Flag,
  Gift,
  GitBranch,
  LoaderCircle,
  MapPin,
  Radar,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CivicMap } from '@/components/map/CivicMap'
import type { ReportLocation } from '@/data/reportLocations'
import { mapIssueResponseToCivicMapItem } from '@/data/civicMapData'
import type { AgentStepResponse, IssueResponse } from '@/lib/api'
import {
  roActor,
  roAgentMessage,
  roAgentName,
  roBadge,
  roCategory,
  roRank,
  roReward,
  roSeverity,
} from '@/lib/locale'
import { cn } from '@/lib/utils'

type ReportAgentFlowProps = {
  issue: IssueResponse
  location: ReportLocation
  description: string
  imagePreviewUrl: string
  streamState: ReportStreamState
  isSaving?: boolean
}

type DisplayStep = {
  id: string
  agentName: string
  message: string
  status: AgentStepResponse['status'] | 'pending'
  order: number
  kind: 'photo' | 'agent' | 'mission' | 'points' | 'map'
}

export type ReportStreamState = {
  missionCreated: boolean
  rewardMatched: boolean
  zoneScoreUpdated: boolean
  pipelineFailed: boolean
  pointsAwarded: number | null
  totalPoints: number | null
  rankName: string | null
  badges: string[]
}

const plannedSteps: DisplayStep[] = [
  {
    id: 'vision-pending',
    agentName: 'Vision Agent',
    message: 'Analizeaza fotografia si cauta indicii vizuale.',
    status: 'pending',
    order: 1,
    kind: 'photo',
  },
  {
    id: 'triage-pending',
    agentName: 'Triage Agent',
    message: 'Asteapta rezultatul vizual ca sa aleaga responsabilul.',
    status: 'pending',
    order: 2,
    kind: 'agent',
  },
  {
    id: 'duplicate-pending',
    agentName: 'Duplicate Agent',
    message: 'Compara semnalul cu rapoartele apropiate.',
    status: 'pending',
    order: 3,
    kind: 'agent',
  },
  {
    id: 'mission-pending',
    agentName: 'Mission Agent',
    message: 'Pregateste actiunea civica potrivita pentru zona.',
    status: 'pending',
    order: 4,
    kind: 'mission',
  },
  {
    id: 'reward-pending',
    agentName: 'Reward Agent',
    message: 'Asteapta misiunea ca sa potriveasca recompensa.',
    status: 'pending',
    order: 5,
    kind: 'mission',
  },
]

const mapStep: DisplayStep = {
  id: 'map-reveal',
  agentName: 'City Agent',
  message: 'Semnalul este pregatit pentru harta live.',
  status: 'completed',
  order: 6,
  kind: 'map',
}

const STEP_DISPLAY_MS = 1800
const MAP_STEP_INDEX = plannedSteps.length
const TOTAL_DISPLAY_STEPS = plannedSteps.length + 1
const MAP_MARKER_DELAY_MS = 1600

function hasPoints(issue: IssueResponse, streamState: ReportStreamState) {
  return Boolean(issue.gamification || streamState.pointsAwarded !== null)
}

function canRevealMap(issue: IssueResponse, streamState: ReportStreamState) {
  return (
    hasPoints(issue, streamState) ||
    streamState.zoneScoreUpdated ||
    streamState.pipelineFailed ||
    (streamState.rewardMatched && !issue.gamification)
  )
}

function getCompletedSteps(issue: IssueResponse): DisplayStep[] {
  return [...(issue.agentRun?.steps ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((step) => {
      const kind: DisplayStep['kind'] =
        step.agentName === 'Vision Agent'
          ? 'photo'
          : step.agentName === 'Mission Agent' || step.agentName === 'Reward Agent'
            ? 'mission'
            : 'agent'

      return {
        id: step.id,
        agentName: step.agentName,
        message: step.message,
        status: step.status,
        order: step.order,
        kind,
      }
    })
}

function getStepIndexByAgentName(agentName: string) {
  const plannedIndex = plannedSteps.findIndex((step) => step.agentName === agentName)

  return plannedIndex >= 0 ? plannedIndex : -1
}

function getStepForDisplayIndex(
  displayIndex: number,
  issue: IssueResponse,
  _streamState: ReportStreamState,
) {
  const completedSteps = getCompletedSteps(issue)

  if (displayIndex >= MAP_STEP_INDEX) {
    return mapStep
  }

  const plannedStep = plannedSteps[displayIndex] ?? plannedSteps[0]
  const completedStep = completedSteps.find(
    (step) => step.agentName === plannedStep.agentName,
  )

  return completedStep ?? plannedStep
}

function getTargetDisplayIndex(issue: IssueResponse, streamState: ReportStreamState) {
  if (canRevealMap(issue, streamState)) {
    return MAP_STEP_INDEX
  }

  const completedNames = new Set(
    getCompletedSteps(issue).map((step) => step.agentName),
  )
  const nextStepIndex = plannedSteps.findIndex(
    (step) => !completedNames.has(step.agentName),
  )

  return nextStepIndex >= 0 ? nextStepIndex : plannedSteps.length
}

function getVisualTargetDisplayIndex(
  issue: IssueResponse,
  streamState: ReportStreamState,
  isSaving: boolean,
) {
  if (!isSaving) {
    return getTargetDisplayIndex(issue, streamState)
  }

  return Math.max(getTargetDisplayIndex(issue, streamState), MAP_STEP_INDEX - 1)
}

function getProgress(displayStepIndex: number, showMap: boolean) {
  return showMap
    ? 100
    : Math.min(
        92,
        Math.round(((displayStepIndex + 1) / TOTAL_DISPLAY_STEPS) * 100),
      )
}

function getVisionCategoryLabel(issue: IssueResponse) {
  const category = roCategory(issue.category, '')

  if (!category || category === 'alta problema' || category === 'problema') {
    return 'Categorie in confirmare'
  }

  return category
}

function getVisionSeverityLabel(issue: IssueResponse) {
  return `Prioritate ${roSeverity(issue.severity, 'medie')}`
}

function getVisionSummary(issue: IssueResponse) {
  return issue.aiSummary?.trim() || 'Analiza vizuala este in curs.'
}

function getAgentWorkText(agentName: string) {
  switch (agentName) {
    case 'Vision Agent':
      return 'Citeste fotografia si extrage tipul problemei, severitatea si nivelul de incredere.'
    case 'Triage Agent':
      return 'Ia rezultatul vizual si decide cine trebuie sa preia semnalul civic.'
    case 'Duplicate Agent':
      return 'Compara semnalul cu rapoartele apropiate ca sa evite dublurile.'
    case 'Mission Agent':
      return 'Transforma problema intr-o actiune concreta pentru comunitate.'
    case 'Reward Agent':
      return 'Calculeaza punctele, badge-urile si recompensa potrivita.'
    case 'City Agent':
      return 'Publica semnalul pe harta orasului si actualizeaza impactul zonei.'
    default:
      return 'Proceseaza semnalul si pregateste urmatorul pas.'
  }
}

function getAgentReturnText(
  currentStep: DisplayStep,
  issue: IssueResponse,
  streamState: ReportStreamState,
) {
  switch (currentStep.agentName) {
    case 'Vision Agent': {
      const confidence =
        issue.aiConfidence !== null
          ? ` Incredere ${Math.round(issue.aiConfidence * 100)}%.`
          : ''

      return `${getVisionCategoryLabel(issue)}. ${getVisionSeverityLabel(issue)}.${confidence} ${getVisionSummary(issue)}`
    }
    case 'Triage Agent':
      return `Responsabil: ${roActor(issue.responsibleActor)}${issue.isUrgent ? ' · semnal urgent' : ''}.`
    case 'Duplicate Agent':
      return issue.duplicateCount > 0
        ? `${issue.duplicateCount} raport similar in apropiere${issue.nearestDuplicate ? ` · ${issue.nearestDuplicate.distanceMeters}m pana la cel mai apropiat` : ''}.`
        : 'Nu a gasit duplicate relevante in apropiere.'
    case 'Mission Agent':
      return issue.relatedMission
        ? `${issue.relatedMission.title} · ${issue.relatedMission.participantsJoined}/${issue.relatedMission.participantsNeeded} inscrisi · +${issue.relatedMission.impactPoints} impact.`
        : 'Misiunea este in pregatire pentru zona raportata.'
    case 'Reward Agent': {
      const pointsAwarded = issue.gamification?.pointsAwarded ?? streamState.pointsAwarded
      const rankName = issue.gamification?.currentRank.name ?? streamState.rankName
      const reward = issue.relatedReward
        ? ` · ${roReward(issue.relatedReward.title)}`
        : ''

      return pointsAwarded !== null
        ? `+${pointsAwarded} puncte${rankName ? ` · ${roRank(rankName) || rankName}` : ''}${reward}.`
        : `Punctele si recompensa se sincronizeaza${reward}.`
    }
    case 'City Agent':
      return 'Semnalul este pregatit pentru harta live.'
    default:
      return roAgentMessage(currentStep.message)
  }
}

type ResultFact = {
  label: string
  value: string
  tone?: 'neutral' | 'success' | 'warning'
}

function getAgentResultFacts(
  currentStep: DisplayStep,
  issue: IssueResponse,
  streamState: ReportStreamState,
  isWaiting: boolean,
): ResultFact[] {
  if (isWaiting) {
    return [
      {
        label: 'Status',
        value: 'Analiza este in curs. Rezultatul apare imediat ce agentul termina.',
        tone: 'neutral',
      },
    ]
  }

  switch (currentStep.agentName) {
    case 'Vision Agent':
      return [
        { label: 'Problema', value: getVisionCategoryLabel(issue), tone: 'success' },
        { label: 'Prioritate', value: getVisionSeverityLabel(issue) },
        {
          label: 'Incredere',
          value:
            issue.aiConfidence !== null
              ? `${Math.round(issue.aiConfidence * 100)}%`
              : 'in curs',
        },
        { label: 'Rezumat', value: getVisionSummary(issue) },
      ]
    case 'Triage Agent':
      return [
        { label: 'Responsabil', value: roActor(issue.responsibleActor), tone: 'success' },
        {
          label: 'Urgenta',
          value: issue.isUrgent ? 'Semnal urgent' : 'Flux normal',
          tone: issue.isUrgent ? 'warning' : 'neutral',
        },
      ]
    case 'Duplicate Agent':
      return [
        {
          label: 'Duplicate',
          value:
            issue.duplicateCount > 0
              ? `${issue.duplicateCount} rapoarte similare`
              : 'Nu exista duplicate apropiate',
          tone: issue.duplicateCount > 0 ? 'warning' : 'success',
        },
        {
          label: 'Distanta',
          value: issue.nearestDuplicate
            ? `${issue.nearestDuplicate.distanceMeters}m pana la cel mai apropiat`
            : 'niciun raport apropiat',
        },
      ]
    case 'Mission Agent':
      return issue.relatedMission
        ? [
            { label: 'Misiune', value: issue.relatedMission.title, tone: 'success' },
            {
              label: 'Participanti',
              value: `${issue.relatedMission.participantsJoined}/${issue.relatedMission.participantsNeeded}`,
            },
            { label: 'Impact', value: `+${issue.relatedMission.impactPoints}` },
          ]
        : [
            {
              label: 'Decizie',
              value: 'Nu este nevoie de o misiune comunitara pentru acest semnal.',
              tone: 'neutral',
            },
          ]
    case 'Reward Agent': {
      const pointsAwarded = issue.gamification?.pointsAwarded ?? streamState.pointsAwarded
      const rankName = issue.gamification?.currentRank.name ?? streamState.rankName
      const badges =
        issue.gamification?.unlockedBadges.map((badge) => badge.name) ??
        streamState.badges

      return [
        {
          label: 'Puncte',
          value: pointsAwarded !== null ? `+${pointsAwarded}` : 'in curs',
          tone: pointsAwarded !== null ? 'success' : 'neutral',
        },
        {
          label: 'Rank',
          value: rankName ? roRank(rankName) || rankName : 'se sincronizeaza',
        },
        {
          label: 'Badge',
          value:
            badges.length > 0
              ? badges.map((badge) => roBadge(badge) || badge).join(', ')
              : 'in curs',
        },
      ]
    }
    default:
      return [{ label: 'Rezultat', value: getAgentReturnText(currentStep, issue, streamState) }]
  }
}

function PhotoSceneFrame({
  imagePreviewUrl,
  children,
}: {
  imagePreviewUrl: string
  children: ReactNode
}) {
  return (
    <div className="relative overflow-hidden bg-slate-950">
      {imagePreviewUrl ? (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-950">
          <motion.img
            src={imagePreviewUrl}
            alt=""
            className="max-h-full w-full object-contain opacity-95"
            initial={{ scale: 1.005, x: 0, y: 0 }}
            animate={{
              scale: 1.035,
              x: ['0%', '-0.8%', '0.7%'],
              y: ['0%', '0.6%', '-0.4%'],
            }}
            transition={{ duration: 8.5, ease: 'easeInOut' }}
          />
        </div>
      ) : (
        <div className="aspect-[4/3] w-full bg-emerald-900" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_36%,rgba(2,6,23,.18)_68%,rgba(2,6,23,.72)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(0deg, rgba(255,255,255,.25) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/45 to-transparent" />
      <div className="pointer-events-none absolute inset-0">{children}</div>
    </div>
  )
}

function SceneStatusPill({ isWaiting }: { isWaiting: boolean }) {
  return (
    <div className="absolute left-3 top-3 rounded-md bg-slate-950/75 px-2 py-1 text-xs font-semibold text-emerald-50 backdrop-blur">
      {isWaiting ? 'Se proceseaza' : 'Raspuns primit'}
    </div>
  )
}

function VisionPhotoScene({
  imagePreviewUrl,
  isWaiting,
}: {
  imagePreviewUrl: string
  isWaiting: boolean
}) {
  return (
    <PhotoSceneFrame imagePreviewUrl={imagePreviewUrl}>
      <div className="absolute inset-0 bg-slate-950/10" />
      <motion.div
        className="absolute inset-y-0 left-1/2 w-px bg-teal-200/70 shadow-[0_0_28px_rgba(45,212,191,.8)]"
        animate={{ x: ['-8rem', '8rem', '-8rem'], opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 2.9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-x-7 top-[16%] h-[50%] rounded-xl border border-teal-200/80 shadow-[0_0_36px_rgba(45,212,191,.42)]"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: [0.35, 1, 0.72], scale: [0.96, 1, 0.98] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-x-7 top-[16%] h-[50%] rounded-xl">
        {[
          'left-0 top-0 border-l border-t',
          'right-0 top-0 border-r border-t',
          'bottom-0 left-0 border-b border-l',
          'bottom-0 right-0 border-b border-r',
        ].map((position) => (
          <motion.span
            key={position}
            className={cn('absolute size-8 border-teal-100', position)}
            animate={{ opacity: [0.35, 1, 0.45] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <motion.div
        className="absolute inset-x-5 top-[24%] h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent"
        animate={{ y: ['0rem', '7rem', '0rem'], opacity: [0.1, 1, 0.1] }}
        transition={{ duration: 2.3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute left-1/2 top-[38%] size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200 shadow-[0_0_28px_rgba(45,212,191,.95)]"
        animate={{ scale: [0.7, 1.45, 0.8], opacity: [0.55, 1, 0.6] }}
        transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2">
        {['detectie', 'categorie', 'risc'].map((label, index) => (
          <motion.span
            key={label}
            className="h-1.5 rounded-full bg-teal-200/80 shadow-[0_0_12px_rgba(45,212,191,.5)]"
            initial={{ scaleX: 0.2, opacity: 0.35 }}
            animate={{ scaleX: [0.25, 1, 0.45], opacity: [0.35, 1, 0.45] }}
            transition={{
              delay: index * 0.22,
              duration: 1.35,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <SceneStatusPill isWaiting={isWaiting} />
    </PhotoSceneFrame>
  )
}

function TriagePhotoScene({
  imagePreviewUrl,
  issue,
  isWaiting,
}: {
  imagePreviewUrl: string
  issue: IssueResponse
  isWaiting: boolean
}) {
  const actor = issue.responsibleActor
  const routeOptions = [
    { id: 'community', label: 'Comunitate', icon: Users },
    { id: 'city_hall', label: 'Primarie', icon: Building2 },
    { id: 'community_and_city_hall', label: 'Ambele', icon: GitBranch },
  ]

  return (
    <PhotoSceneFrame imagePreviewUrl={imagePreviewUrl}>
      <div className="absolute inset-0 bg-slate-950/20" />
      <motion.div
        className="absolute left-1/2 top-[22%] h-28 w-px origin-top bg-teal-200/80"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute left-[22%] right-[22%] top-[42%] h-px bg-teal-200/80"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.75, ease: 'easeOut' }}
      />
      <div className="absolute bottom-4 left-3 right-3 grid grid-cols-3 gap-2">
        {routeOptions.map((option, index) => {
          const Icon = option.icon
          const isActive =
            actor === option.id ||
            (option.id === 'community_and_city_hall' && actor === 'unknown')

          return (
            <motion.div
              key={option.id}
              className={cn(
                'rounded-lg border px-2 py-2 text-center text-[0.68rem] font-semibold backdrop-blur',
                isActive
                  ? 'border-teal-200 bg-teal-300 text-teal-950 shadow-lg shadow-teal-950/20'
                  : 'border-white/20 bg-slate-950/62 text-white',
              )}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: isActive ? -4 : 0 }}
              transition={{ delay: 0.16 * index, duration: 0.45, ease: 'easeOut' }}
            >
              <Icon className="mx-auto mb-1 size-4" aria-hidden="true" />
              {option.label}
            </motion.div>
          )
        })}
      </div>
      <SceneStatusPill isWaiting={isWaiting} />
    </PhotoSceneFrame>
  )
}

function DuplicatePhotoScene({
  imagePreviewUrl,
  issue,
  isWaiting,
}: {
  imagePreviewUrl: string
  issue: IssueResponse
  isWaiting: boolean
}) {
  return (
    <PhotoSceneFrame imagePreviewUrl={imagePreviewUrl}>
      <div className="absolute inset-0 bg-slate-950/24" />
      <div className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="absolute inset-0 rounded-full border border-teal-200/70"
            initial={{ scale: 0.25, opacity: 0.75 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{
              delay: index * 0.55,
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal-300 text-teal-950 shadow-lg shadow-teal-950/30">
          <Radar className="size-5" aria-hidden="true" />
        </span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/16 bg-slate-950/74 p-3 text-sm font-semibold text-white backdrop-blur">
        {issue.duplicateCount > 0
          ? `${issue.duplicateCount} rapoarte similare gasite`
          : 'Nu exista duplicate apropiate'}
      </div>
      <SceneStatusPill isWaiting={isWaiting} />
    </PhotoSceneFrame>
  )
}

function MissionCreationScene({
  issue,
  isWaiting,
}: {
  issue: IssueResponse
  isWaiting: boolean
}) {
  const mission = issue.relatedMission
  const hasMission = Boolean(mission)
  const checks = hasMission
    ? [
        'Locatia intra in zona de actiune',
        'Misiune pregatita pentru comunitate',
        `Impact estimat +${mission?.impactPoints ?? 0}`,
      ]
    : isWaiting
      ? [
          'Verific daca problema are nevoie de actiune',
          'Caut rolul potrivit pentru comunitate',
          'Astept rezultatul de triere',
        ]
      : [
          'Semnalul ramane problema activa pe harta',
          'Nu necesita misiune comunitara separata',
          `Responsabil: ${roActor(issue.responsibleActor)}`,
        ]

  return (
    <div className="relative min-h-[17rem] overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div
        className="absolute inset-0 opacity-55"
        style={{
          backgroundImage:
            'linear-gradient(rgba(20,184,166,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,.16) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <motion.div
        className="absolute left-8 right-8 top-8 h-px origin-left bg-teal-400/60"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute bottom-9 left-8 top-8 w-px origin-top bg-teal-400/60"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.16, duration: 0.75, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute right-5 top-7 flex size-14 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-lg shadow-emerald-900/10"
        initial={{ scale: 0.76, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.18, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {hasMission ? (
          <Flag className="size-6" aria-hidden="true" />
        ) : (
          <Check className="size-6" aria-hidden="true" />
        )}
      </motion.div>
      <motion.div
        className="relative mx-auto mt-12 max-w-sm rounded-xl border border-emerald-200 bg-white/94 p-4 shadow-xl shadow-emerald-900/10 backdrop-blur"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.28, duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="absolute -left-2 top-5 h-14 w-1 rounded-full bg-emerald-500"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.55, duration: 0.45, ease: 'easeOut' }}
        />
        <p className="text-xs font-semibold uppercase text-emerald-700">
          {hasMission ? 'Misiune generata' : isWaiting ? 'Decizie in curs' : 'Fara misiune separata'}
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-tight text-emerald-950">
          {mission?.title ??
            (isWaiting
              ? 'Se verifica daca e nevoie de o actiune civica'
              : 'Problema ramane activa pe harta')}
        </h3>
        {hasMission && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-md bg-emerald-50 p-2">
              {mission?.participantsJoined}/{mission?.participantsNeeded} inscrisi
            </span>
            <span className="rounded-md bg-lime-50 p-2">
              +{mission?.impactPoints ?? 0} impact
            </span>
          </div>
        )}
        <div className="mt-4 grid gap-2">
          {checks.map((check, index) => (
            <motion.div
              key={check}
              className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-semibold text-emerald-900"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.62 + index * 0.16, duration: 0.38, ease: 'easeOut' }}
            >
              <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
              {check}
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-5 left-8 right-12 h-px origin-left bg-gradient-to-r from-teal-500/80 via-emerald-400/60 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.75, duration: 0.85, ease: 'easeOut' }}
      />
    </div>
  )
}

function RewardGenerationScene({
  issue,
  streamState,
}: {
  issue: IssueResponse
  streamState: ReportStreamState
}) {
  const pointsAwarded = issue.gamification?.pointsAwarded ?? streamState.pointsAwarded
  const rankName = issue.gamification?.currentRank.name ?? streamState.rankName
  const badges =
    issue.gamification?.unlockedBadges.map((badge) => badge.name) ??
    streamState.badges
  const hasPoints = pointsAwarded !== null

  return (
    <div className="relative min-h-[17rem] overflow-hidden bg-gradient-to-br from-white via-emerald-50 to-lime-50 p-4 text-emerald-950">
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_50%_10%,rgba(16,185,129,.24),transparent_62%)]" />
      {[0, 1, 2, 3].map((coin) => (
        <motion.span
          key={coin}
          className="absolute flex size-7 items-center justify-center rounded-full border border-emerald-200 bg-white text-xs font-bold text-emerald-700 shadow-sm"
          style={{
            left: `${18 + coin * 17}%`,
            top: `${18 + (coin % 2) * 10}%`,
          }}
          initial={{ opacity: 0, y: -18, scale: 0.7 }}
          animate={{
            opacity: hasPoints ? [0, 1, 1] : [0.25, 0.75, 0.25],
            y: hasPoints ? [0, 12, 6] : [0, 7, 0],
            scale: hasPoints ? [0.7, 1.06, 1] : [0.85, 1, 0.85],
          }}
          transition={{
            delay: coin * 0.12,
            duration: hasPoints ? 0.85 : 1.45,
            repeat: hasPoints ? 0 : Infinity,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          +
        </motion.span>
      ))}
      <motion.div
        className="relative mx-auto mt-4 flex size-20 items-center justify-center rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/10"
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: [0.72, 1.08, 1], opacity: 1, rotate: [-4, 2, 0] }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <Gift className="size-9 text-emerald-600" aria-hidden="true" />
      </motion.div>
      <motion.div
        className="relative mx-auto mt-4 max-w-sm overflow-hidden rounded-xl border border-emerald-200 bg-white p-4 text-center shadow-xl shadow-emerald-900/10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.48, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-y-0 -left-24 w-20 bg-gradient-to-r from-transparent via-amber-200/55 to-transparent"
          animate={{ x: ['0%', '560%'] }}
          transition={{ delay: 0.35, duration: 1.8, ease: 'easeInOut' }}
        />
        <p className="relative text-xs font-semibold uppercase text-emerald-700">
          Puncte civice
        </p>
        <motion.h3
          className="relative mt-1 text-4xl font-semibold"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
        >
          {hasPoints ? `+${pointsAwarded}` : 'Se calculeaza'}
        </motion.h3>
        <p className="relative mt-2 text-sm font-semibold text-slate-600">
          {rankName ? roRank(rankName) || rankName : 'Rank-ul se sincronizeaza'}
        </p>
        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: '12%' }}
            animate={{ width: hasPoints ? '74%' : ['18%', '52%', '18%'] }}
            transition={{
              delay: 0.45,
              duration: hasPoints ? 0.9 : 1.5,
              repeat: hasPoints ? 0 : Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
        <div className="relative mt-4 flex flex-wrap justify-center gap-2">
          {(badges.length > 0 ? badges : ['Badge-uri in curs']).slice(0, 3).map((badge) => (
            <motion.span
              key={badge}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
              initial={{ opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <Star className="size-3.5" aria-hidden="true" />
              {roBadge(badge) || badge}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function AgentScene({
  currentStep,
  issue,
  imagePreviewUrl,
  streamState,
  isWaiting,
}: {
  currentStep: DisplayStep
  issue: IssueResponse
  imagePreviewUrl: string
  streamState: ReportStreamState
  isWaiting: boolean
}) {
  switch (currentStep.agentName) {
    case 'Vision Agent':
      return (
        <VisionPhotoScene
          imagePreviewUrl={imagePreviewUrl}
          isWaiting={isWaiting}
        />
      )
    case 'Triage Agent':
      return (
        <TriagePhotoScene
          imagePreviewUrl={imagePreviewUrl}
          issue={issue}
          isWaiting={isWaiting}
        />
      )
    case 'Duplicate Agent':
      return (
        <DuplicatePhotoScene
          imagePreviewUrl={imagePreviewUrl}
          issue={issue}
          isWaiting={isWaiting}
        />
      )
    case 'Mission Agent':
      return <MissionCreationScene issue={issue} isWaiting={isWaiting} />
    case 'Reward Agent':
      return <RewardGenerationScene issue={issue} streamState={streamState} />
    default:
      return (
        <VisionPhotoScene
          imagePreviewUrl={imagePreviewUrl}
          isWaiting={isWaiting}
        />
      )
  }
}

function FinalMapReveal({
  issue,
  location,
  description,
}: {
  issue: IssueResponse
  location: ReportLocation
  description: string
}) {
  const mapItem = useMemo(() => mapIssueResponseToCivicMapItem(issue), [issue])
  const [selectedMapItemId, setSelectedMapItemId] = useState<string | null>(null)
  const [highlightedMapItemId, setHighlightedMapItemId] = useState<string | null>(
    null,
  )
  const [showMapMarker, setShowMapMarker] = useState(false)
  useEffect(() => {
    setSelectedMapItemId(null)
    setHighlightedMapItemId(null)
    setShowMapMarker(false)
    const showTimeout = window.setTimeout(() => setShowMapMarker(true), MAP_MARKER_DELAY_MS)
    const pulseTimeout = window.setTimeout(
      () => setHighlightedMapItemId(issue.id),
      MAP_MARKER_DELAY_MS + 120,
    )

    return () => {
      window.clearTimeout(showTimeout)
      window.clearTimeout(pulseTimeout)
    }
  }, [issue.id])

  return (
    <motion.section
      className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="p-3">
        <motion.div
          className="h-[22rem] min-h-[20rem] overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm sm:h-[26rem] lg:h-[30rem]"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.16, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <CivicMap
            items={showMapMarker ? [mapItem] : []}
            activeFilter="all"
            selectedItemId={selectedMapItemId}
            highlightedItemId={highlightedMapItemId}
            focusItemId={showMapMarker ? issue.id : null}
            markerRevealDelayMs={120}
            onSelectedItemChange={setSelectedMapItemId}
          />
        </motion.div>

        <motion.div
          className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45, ease: 'easeOut' }}
        >
          <span className="flex items-center gap-2 font-semibold text-emerald-950">
            <MapPin className="size-4 text-rose-600" aria-hidden="true" />
            {location.name}
          </span>
          <p className="mt-1 text-slate-600">{location.address}</p>
          {description && <p className="mt-2 text-slate-700">{description}</p>}
        </motion.div>
      </div>
    </motion.section>
  )
}

function AnalysisStep({
  issue,
  imagePreviewUrl,
  currentStep,
  streamState,
}: {
  issue: IssueResponse
  imagePreviewUrl: string
  currentStep: DisplayStep
  streamState: ReportStreamState
}) {
  const isWaiting = currentStep.status === 'pending' || currentStep.status === 'running'
  const resultFacts = getAgentResultFacts(currentStep, issue, streamState, isWaiting)

  return (
    <motion.div
      className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm"
      initial={{ opacity: 0, x: 26 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentStep.agentName}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
        >
          <AgentScene
            currentStep={currentStep}
            issue={issue}
            imagePreviewUrl={imagePreviewUrl}
            streamState={streamState}
            isWaiting={isWaiting}
          />
        </motion.div>
      </AnimatePresence>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              isWaiting ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-600 text-white',
            )}
          >
            {isWaiting ? (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Pasul {Math.min(currentStep.order, TOTAL_DISPLAY_STEPS)} din {TOTAL_DISPLAY_STEPS}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-emerald-950">
              {roAgentName(currentStep.agentName)}
            </h3>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Lucreaza
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-700">
              {getAgentWorkText(currentStep.agentName)}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              A returnat
            </p>
            <div className="mt-2 grid gap-2">
              {resultFacts.map((fact, index) => (
                <motion.div
                  key={`${fact.label}-${fact.value}`}
                  className={cn(
                    'rounded-lg border bg-white px-3 py-2',
                    fact.tone === 'success'
                      ? 'border-emerald-200'
                      : fact.tone === 'warning'
                        ? 'border-amber-200'
                        : 'border-slate-200',
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.12,
                    duration: 0.34,
                    ease: 'easeOut',
                  }}
                >
                  <p className="text-[0.68rem] font-semibold uppercase text-slate-500">
                    {fact.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-5 text-emerald-950">
                    {fact.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ReportAgentFlow({
  issue,
  location,
  description,
  imagePreviewUrl,
  streamState,
  isSaving = false,
}: ReportAgentFlowProps) {
  const readyForMap = canRevealMap(issue, streamState)
  const [displayStepIndex, setDisplayStepIndex] = useState(0)
  const completedSteps = getCompletedSteps(issue)
  const targetDisplayIndex = getVisualTargetDisplayIndex(
    issue,
    streamState,
    isSaving,
  )
  const showMap = readyForMap && displayStepIndex >= MAP_STEP_INDEX
  const currentStep = getStepForDisplayIndex(displayStepIndex, issue, streamState)
  const progress = getProgress(displayStepIndex, showMap)
  const completedTrack = [
    ...plannedSteps,
    mapStep,
  ]
  const visibleCompletedSteps = completedSteps.filter((step) => {
    const stepIndex = getStepIndexByAgentName(step.agentName)

    return stepIndex >= 0 && stepIndex < displayStepIndex
  })

  useEffect(() => {
    setDisplayStepIndex(0)
  }, [issue.id])

  useEffect(() => {
    if (displayStepIndex >= targetDisplayIndex) {
      return
    }

    const timeout = window.setTimeout(() => {
      setDisplayStepIndex((currentIndex) =>
        Math.min(currentIndex + 1, targetDisplayIndex),
      )
    }, STEP_DISPLAY_MS)

    return () => window.clearTimeout(timeout)
  }, [displayStepIndex, targetDisplayIndex])

  return (
    <div className="mt-4">
      <section className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Analiza agentilor
            </p>
            <h2 className="mt-1 text-lg font-semibold text-emerald-950">
              {showMap ? 'Semnal pregatit pentru harta' : 'Semnalul trece prin pipeline'}
            </h2>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
            {showMap ? (
              <Trophy className="size-5" aria-hidden="true" />
            ) : (
              <Bot className="size-5" aria-hidden="true" />
            )}
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-1">
          {completedTrack.map((step) => {
            const isDone =
              showMap || completedTrack.findIndex((item) => item.id === step.id) < displayStepIndex
            const isActive =
              !showMap &&
              completedTrack.findIndex((item) => item.id === step.id) === displayStepIndex

            return (
              <span
                key={step.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  isDone ? 'bg-emerald-500' : isActive ? 'bg-cyan-400' : 'bg-white',
                )}
              />
            )
          })}
        </div>
      </section>

      {!showMap && (
        <div className="mt-3 grid gap-2 text-sm">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="flex items-center gap-2 font-semibold text-emerald-950">
            <MapPin className="size-4 text-emerald-600" aria-hidden="true" />
            {location.name}
          </span>
          <p className="mt-1 text-slate-600">{location.address}</p>
        </div>
        {description && (
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3 text-slate-700">
            {description}
          </div>
        )}
        </div>
      )}

      <div className="mt-3">
        <AnimatePresence mode="wait">
          {showMap ? (
            <FinalMapReveal
              key="map"
              issue={issue}
              location={location}
              description={description}
            />
          ) : (
            <AnalysisStep
              key="analysis"
              issue={issue}
              imagePreviewUrl={imagePreviewUrl}
              currentStep={currentStep}
              streamState={streamState}
            />
          )}
        </AnimatePresence>
      </div>

      {!showMap && visibleCompletedSteps.length > 0 && (
        <div className="mt-3 grid gap-2">
          {visibleCompletedSteps.slice(-2).map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-white p-2 text-xs text-slate-600"
            >
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                <span className="font-semibold text-slate-800">
                  {roAgentName(step.agentName)}:
                </span>{' '}
                {roAgentMessage(step.message)}
              </span>
            </div>
          ))}
        </div>
      )}

      {!showMap && visibleCompletedSteps.length === 0 && (
        <p className="mt-3 flex items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-sm font-medium text-emerald-800">
          <CircleDashed className="mr-2 size-4 animate-spin" aria-hidden="true" />
          Astept primul raspuns al agentilor.
        </p>
      )}
    </div>
  )
}
