import {
  Building2,
  Bot,
  Camera,
  Check,
  CircleDashed,
  Flag,
  Gift,
  GitBranch,
  GitMerge,
  LoaderCircle,
  MapPin,
  Radar,
  Star,
  Trophy,
  Users,
} from '@/components/icons/hugeicons'
import visionAgentImage from '@/assets/ai-agents/01_vision_agent_square.png'
import triageAgentImage from '@/assets/ai-agents/02_triage_agent_square.png'
import duplicateAgentImage from '@/assets/ai-agents/03_duplicate_agent_square.png'
import missionAgentImage from '@/assets/ai-agents/04_mission_agent_square.png'
import rewardAgentImage from '@/assets/ai-agents/05_reward_agent_square.png'
import cityAgentImage from '@/assets/ai-agents/06_city_agent_square.png'
import authorityEmailAgentImage from '@/assets/ai-agents/07_authority_email_agent_square.png'
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CivicMap } from '@/components/map/CivicMap'
import { Button } from '@/components/ui/button'
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
  roStatus,
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
    message: 'Verifica daca semnalul are nevoie de un eveniment comunitar.',
    status: 'pending',
    order: 4,
    kind: 'mission',
  },
  {
    id: 'reward-pending',
    agentName: 'Reward Agent',
    message: 'Asteapta evenimentul comunitar ca sa potriveasca recompensa.',
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

const agentAvatarByName: Record<string, string> = {
  'Vision Agent': visionAgentImage,
  'Triage Agent': triageAgentImage,
  'Duplicate Agent': duplicateAgentImage,
  'Mission Agent': missionAgentImage,
  'Reward Agent': rewardAgentImage,
  'City Agent': cityAgentImage,
  'Authority Email Agent': authorityEmailAgentImage,
}

const LIVE_STEP_DISPLAY_MS = 2200
const CACHED_STEP_DISPLAY_MS = 1450
const DUPLICATE_RESULT_DISPLAY_MS = 4200
const MAP_STEP_INDEX = plannedSteps.length
const TOTAL_DISPLAY_STEPS = plannedSteps.length + 1
const MAP_MARKER_DELAY_MS = 1600

function hasPoints(issue: IssueResponse, streamState: ReportStreamState) {
  return Boolean(issue.gamification || streamState.pointsAwarded !== null)
}

function canRevealMap(issue: IssueResponse, streamState: ReportStreamState) {
  if (issue.status === 'rejected' || issue.isValidIssue === false) {
    return false
  }

  return (
    hasPoints(issue, streamState) ||
    streamState.zoneScoreUpdated
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
  streamState: ReportStreamState,
) {
  const completedSteps = getCompletedSteps(issue)

  if (canRevealMap(issue, streamState) && displayIndex >= MAP_STEP_INDEX) {
    return mapStep
  }

  const plannedStep =
    plannedSteps[Math.min(displayIndex, plannedSteps.length - 1)] ?? plannedSteps[0]
  const completedStep = completedSteps.find(
    (step) => step.agentName === plannedStep.agentName,
  )

  return completedStep ?? plannedStep
}

function getTargetDisplayIndex(issue: IssueResponse, streamState: ReportStreamState) {
  if (issue.status === 'rejected' || issue.isValidIssue === false) {
    return 0
  }

  if (canRevealMap(issue, streamState)) {
    return MAP_STEP_INDEX
  }

  const completedNames = new Set(
    getCompletedSteps(issue).map((step) => step.agentName),
  )
  const nextStepIndex = plannedSteps.findIndex(
    (step) => !completedNames.has(step.agentName),
  )

  return nextStepIndex >= 0 ? nextStepIndex : plannedSteps.length - 1
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

function getStepDisplayDelayMs(
  currentStep: DisplayStep,
  issue: IssueResponse,
  hasCachedResultForStep: boolean,
) {
  if (
    currentStep.agentName === 'Duplicate Agent' &&
    currentStep.status !== 'pending' &&
    currentStep.status !== 'running' &&
    (issue.duplicateCount > 0 || issue.nearestDuplicate)
  ) {
    return DUPLICATE_RESULT_DISPLAY_MS
  }

  return hasCachedResultForStep ? CACHED_STEP_DISPLAY_MS : LIVE_STEP_DISPLAY_MS
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
  if (issue.status === 'rejected' || issue.isValidIssue === false) {
    return issue.invalidReason || 'Imaginea nu confirma o problema civica raportabila.'
  }

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
      return 'Creeaza eveniment comunitar doar cand problema are nevoie de mai multi oameni.'
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
      if (issue.status === 'rejected' || issue.isValidIssue === false) {
        return `Nu putem confirma problema din imagine. ${getVisionSummary(issue)}`
      }

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
        ? `Eveniment comunitar generat: ${issue.relatedMission.title} · ${issue.relatedMission.participantsJoined}/${issue.relatedMission.participantsNeeded} inscrisi · +${issue.relatedMission.impactPoints} impact.`
        : issue.duplicateCount > 0
          ? 'Nu creeaza eveniment nou pentru ca raportul pare duplicat.'
          : issue.isUrgent
            ? 'Nu creeaza eveniment comunitar pentru ca semnalul necesita escaladare.'
            : 'Nu necesita eveniment comunitar; ramane problema activa sau rutata.'
    case 'Reward Agent': {
      const pointsAwarded = issue.gamification?.pointsAwarded ?? streamState.pointsAwarded
      const rankName = issue.gamification?.currentRank.name ?? streamState.rankName
      const reward = issue.relatedReward
        ? ` · ${roReward(issue.relatedReward.title)}`
        : ''

      return pointsAwarded !== null
        ? `+${pointsAwarded} puncte${rankName ? ` · ${roRank(rankName) || rankName}` : ''}${reward}.`
        : issue.relatedMission
          ? `Punctele si recompensa se sincronizeaza${reward}.`
          : 'Fara eveniment comunitar nou, se pastreaza punctele potrivite raportului.'
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
        value: 'Analiza este in curs. Rezultatul apare imediat ce verificarea termina.',
        tone: 'neutral',
      },
    ]
  }

  switch (currentStep.agentName) {
    case 'Vision Agent':
      if (issue.status === 'rejected' || issue.isValidIssue === false) {
        return [
          {
            label: 'Decizie',
            value: 'Imagine respinsa pentru raport civic',
            tone: 'warning',
          },
          {
            label: 'Motiv',
            value: getVisionSummary(issue),
            tone: 'warning',
          },
        ]
      }

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
            { label: 'Eveniment', value: issue.relatedMission.title, tone: 'success' },
            {
              label: 'Participanti',
              value: `${issue.relatedMission.participantsJoined}/${issue.relatedMission.participantsNeeded}`,
            },
            { label: 'Impact', value: `+${issue.relatedMission.impactPoints}` },
          ]
        : [
            {
              label: 'Decizie',
              value:
                issue.duplicateCount > 0
                  ? 'Raport duplicat: nu se creeaza eveniment nou.'
                  : issue.isUrgent
                    ? 'Semnal urgent: nu se creeaza eveniment comunitar.'
                    : 'Nu este nevoie de un eveniment comunitar pentru acest semnal.',
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
    <div className="relative w-full min-w-0 overflow-hidden bg-slate-950">
      {imagePreviewUrl ? (
        <div className="flex h-64 w-full items-center justify-center bg-slate-950 sm:aspect-[4/3] sm:h-auto">
          <motion.img
            src={imagePreviewUrl}
            alt=""
            className="h-full w-full object-contain opacity-95"
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
        <div className="h-64 w-full bg-emerald-900 sm:aspect-[4/3] sm:h-auto" />
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

function SceneStatusPill({
  isWaiting,
  waitingLabel = 'Analizam fotografia',
  doneLabel = 'Raspuns primit',
}: {
  isWaiting: boolean
  waitingLabel?: string
  doneLabel?: string
}) {
  return (
    <motion.div
      className={cn(
        'absolute left-3 top-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur',
        isWaiting
          ? 'border-teal-200 bg-white text-teal-950 shadow-teal-950/25'
          : 'border-emerald-100/70 bg-white/92 text-emerald-900 shadow-emerald-950/15',
      )}
      animate={isWaiting ? { y: [0, -2, 0], scale: [1, 1.015, 1] } : { y: 0, scale: 1 }}
      transition={
        isWaiting
          ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.2 }
      }
    >
      {isWaiting ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Check className="size-4" aria-hidden="true" />
      )}
      {isWaiting ? waitingLabel : doneLabel}
    </motion.div>
  )
}

function MobileAnalysisLightScene({
  imagePreviewUrl,
  currentStep,
  issue,
  streamState,
  isWaiting,
}: {
  imagePreviewUrl: string
  currentStep: DisplayStep
  issue: IssueResponse
  streamState: ReportStreamState
  isWaiting: boolean
}) {
  const resultFacts = getAgentResultFacts(currentStep, issue, streamState, isWaiting)
    .filter((fact) => fact.label !== 'Status')
    .slice(0, 2)
  const isVision = currentStep.agentName === 'Vision Agent'
  const isTriage = currentStep.agentName === 'Triage Agent'
  const isDuplicate = currentStep.agentName === 'Duplicate Agent'
  const waitingLabel = isVision
    ? 'Analizam fotografia'
    : isTriage
      ? 'Alegem ruta'
      : isDuplicate
        ? 'Cautam duplicate'
        : 'Analiza in curs'
  const doneLabel = isVision
    ? 'Verificare finalizata'
    : isTriage
      ? 'Ruta aleasa'
      : isDuplicate
        ? 'Duplicate verificate'
        : 'Rezultat primit'
  const routeOptions = [
    { id: 'community', label: 'Comunitate', icon: Users },
    { id: 'city_hall', label: 'Primarie', icon: Building2 },
    { id: 'community_and_city_hall', label: 'Ambele', icon: GitBranch },
  ]

  return (
    <div className="overflow-hidden rounded-xl bg-white">
      <div className="relative h-56 overflow-hidden bg-slate-950">
        {imagePreviewUrl ? (
          <motion.img
            src={imagePreviewUrl}
            alt=""
            className="h-full w-full object-contain"
            initial={{ scale: 1.01 }}
            animate={{ scale: isWaiting ? [1.01, 1.025, 1.015] : 1.01 }}
            transition={{
              duration: 7,
              repeat: isWaiting ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
        ) : (
          <div className="h-full w-full bg-emerald-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/28" />

        {isVision && (
          <motion.div
            className="absolute inset-x-7 top-1/2 h-px bg-gradient-to-r from-transparent via-white/62 to-transparent shadow-[0_0_18px_rgba(153,246,228,.45)]"
            animate={{ y: isWaiting ? ['-3.25rem', '3.5rem', '-3.25rem'] : 0 }}
            transition={{
              duration: 4,
              repeat: isWaiting ? Infinity : 0,
              ease: 'easeInOut',
            }}
          />
        )}

        {isTriage && (
          <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2">
            {routeOptions.map((option, index) => {
              const Icon = option.icon
              const isActive =
                issue.responsibleActor === option.id ||
                (option.id === 'community_and_city_hall' &&
                  issue.responsibleActor === 'unknown')
              const isRouting = isWaiting || isActive

              return (
                <motion.span
                  key={option.id}
                  className={cn(
                    'relative min-w-0 overflow-hidden rounded-lg border px-2 py-2 text-center text-[0.68rem] font-semibold backdrop-blur',
                    isRouting
                      ? 'border-teal-200 bg-teal-300 text-teal-950 shadow-lg shadow-teal-950/20'
                      : 'border-white/20 bg-slate-950/62 text-white',
                  )}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: isWaiting ? [0.8, 1, 0.8] : 1,
                    y: isActive ? -4 : 0,
                    scale: isWaiting ? [1, 1.035, 1] : 1,
                  }}
                  transition={{
                    delay: index * 0.12,
                    duration: isWaiting ? 1.25 : 0.38,
                    repeat: isWaiting ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                >
                  {isWaiting && (
                    <motion.span
                      className="absolute inset-y-0 -left-8 w-7 bg-gradient-to-r from-transparent via-white/55 to-transparent"
                      animate={{ x: ['0%', '520%'] }}
                      transition={{
                        delay: index * 0.18,
                        duration: 1.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="mx-auto mb-1 size-4" aria-hidden="true" />
                  <span className="block truncate">{option.label}</span>
                </motion.span>
              )
            })}
          </div>
        )}

        {isDuplicate && (
          <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="absolute inset-0 rounded-full border border-teal-200/70"
                initial={{ scale: 0.25, opacity: 0.7 }}
                animate={{ scale: 1.45, opacity: 0 }}
                transition={{
                  delay: index * 0.5,
                  duration: 2.2,
                  repeat: isWaiting ? Infinity : 0,
                  ease: 'easeOut',
                }}
              />
            ))}
            <span className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal-300 text-teal-950 shadow-lg shadow-teal-950/30">
              <Radar className="size-5" aria-hidden="true" />
            </span>
          </div>
        )}

        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/28 bg-white/94 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-slate-950/18 backdrop-blur">
            {isWaiting ? (
              <LoaderCircle className="size-4 animate-spin text-teal-700" aria-hidden="true" />
            ) : (
              <Check className="size-4 text-emerald-700" aria-hidden="true" />
            )}
            <span className="truncate">
              {isWaiting ? waitingLabel : doneLabel}
            </span>
          </span>
          <span className="rounded-full bg-slate-950/58 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {Math.min(currentStep.order, TOTAL_DISPLAY_STEPS)}/{TOTAL_DISPLAY_STEPS}
          </span>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {roAgentName(currentStep.agentName)}
        </p>
        <p className="break-words text-[0.95rem] font-semibold leading-snug text-emerald-950">
          {getAgentReturnText(currentStep, issue, streamState)}
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: TOTAL_DISPLAY_STEPS }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 rounded-full',
                index < currentStep.order ? 'bg-teal-500' : 'bg-emerald-100',
              )}
            />
          ))}
        </div>
        {resultFacts.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {resultFacts.map((fact) => (
              <span
                key={`${fact.label}-${fact.value}`}
                className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5"
              >
                <span className="block text-[0.62rem] font-semibold uppercase text-emerald-700">
                  {fact.label}
                </span>
                <span className="mt-0.5 block max-h-9 overflow-hidden break-words text-xs font-semibold leading-snug text-emerald-950">
                  {fact.value}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
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
  const checks = [
    'Foto incarcata',
    'Categorie in lucru',
    'Prioritate in lucru',
  ]

  return (
    <PhotoSceneFrame imagePreviewUrl={imagePreviewUrl}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-slate-950/42" />
      <motion.div
        className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-teal-100/22 shadow-[0_0_54px_rgba(45,212,191,.5)]"
        animate={{
          scale: isWaiting ? [0.86, 1.16, 0.92] : 1,
          opacity: isWaiting ? [0.5, 1, 0.62] : 0.86,
        }}
        transition={{ duration: 1.85, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-x-6 top-1/2 h-1 rounded-full bg-gradient-to-r from-transparent via-teal-200 to-transparent shadow-[0_0_26px_rgba(45,212,191,.72)]"
        animate={{ y: isWaiting ? ['-5rem', '5rem', '-5rem'] : 0, opacity: isWaiting ? [0.35, 1, 0.35] : 0 }}
        transition={{ duration: 2.4, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-white/92 text-teal-700 shadow-xl shadow-slate-950/20"
        animate={{ y: isWaiting ? [0, -4, 0] : 0 }}
        transition={{ duration: 1.8, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
      >
        <Camera className="size-6" aria-hidden="true" />
      </motion.span>
      <motion.div
        className="absolute left-5 right-5 top-[58%] h-1 overflow-hidden rounded-full bg-white/40"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        <motion.div
          className="h-full rounded-full bg-teal-300 shadow-[0_0_16px_rgba(45,212,191,.65)]"
          initial={{ x: '-55%' }}
          animate={{ x: isWaiting ? ['-55%', '115%'] : '0%', width: isWaiting ? '55%' : '100%' }}
          transition={{ duration: 1.25, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.div
        className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/28 bg-white/88 p-3 text-slate-700 shadow-xl shadow-slate-950/18 backdrop-blur"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase text-teal-700">
              Verificare foto
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-5 text-emerald-950">
              {isWaiting ? 'Cautam detalii utile in imagine' : 'Detaliile foto sunt pregatite'}
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            {isWaiting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {checks.map((label, index) => (
            <motion.span
              key={label}
              className="min-w-0 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[0.62rem] font-semibold text-emerald-900"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + index * 0.14, duration: 0.34, ease: 'easeOut' }}
            >
              <span className="block truncate">{label}</span>
            </motion.span>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute right-4 top-4 hidden rounded-xl border border-white/28 bg-slate-950/44 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur sm:block"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.24, duration: 0.4, ease: 'easeOut' }}
      >
        AI vizual activ
      </motion.div>
      <SceneStatusPill isWaiting={isWaiting} waitingLabel="Scanez fotografia" doneLabel="Foto verificata" />
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
  const selectedLabel =
    routeOptions.find(
      (option) =>
        actor === option.id ||
        (option.id === 'community_and_city_hall' && actor === 'unknown'),
    )?.label ?? roActor(actor)

  return (
    <PhotoSceneFrame imagePreviewUrl={imagePreviewUrl}>
      <div className="absolute inset-0 bg-slate-950/28" />
      <motion.div
        className="absolute left-1/2 top-[20%] flex size-16 -translate-x-1/2 items-center justify-center rounded-2xl border border-white/35 bg-white/92 text-teal-700 shadow-xl shadow-teal-950/20"
        initial={{ opacity: 0, y: -10, scale: 0.9 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: isWaiting ? [1, 1.06, 1] : 1,
        }}
        transition={{
          duration: isWaiting ? 1.45 : 0.45,
          repeat: isWaiting ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        <GitBranch className="size-7" aria-hidden="true" />
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-[33%] h-24 w-px origin-top bg-teal-200/90 shadow-[0_0_18px_rgba(45,212,191,.5)]"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: isWaiting ? [0.25, 1, 0.55] : 1, opacity: 1 }}
        transition={{ duration: isWaiting ? 1.6 : 0.75, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-[18%] right-[18%] top-[54%] h-px bg-teal-200/90 shadow-[0_0_18px_rgba(45,212,191,.5)]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: isWaiting ? [0.35, 1, 0.5] : 1, opacity: 1 }}
        transition={{ delay: 0.18, duration: isWaiting ? 1.6 : 0.75, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
      />
      <div className="absolute bottom-14 left-3 right-3 grid min-w-0 grid-cols-3 gap-2">
        {routeOptions.map((option, index) => {
          const Icon = option.icon
          const isActive =
            actor === option.id ||
            (option.id === 'community_and_city_hall' && actor === 'unknown')
          const isRouting = isWaiting || isActive

          return (
            <motion.div
              key={option.id}
              className={cn(
                'relative overflow-hidden rounded-lg border px-2 py-2 text-center text-[0.68rem] font-semibold backdrop-blur',
                isRouting
                  ? 'border-teal-200 bg-teal-300 text-teal-950 shadow-lg shadow-teal-950/20'
                  : 'border-white/20 bg-slate-950/62 text-white',
              )}
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: isWaiting ? [0.76, 1, 0.76] : 1,
                y: isActive ? -5 : 0,
                scale: isWaiting ? [1, 1.04, 1] : 1,
              }}
              transition={{
                delay: 0.16 * index,
                duration: isWaiting ? 1.25 : 0.45,
                repeat: isWaiting ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              {isWaiting && (
                <motion.span
                  className="absolute inset-y-0 -left-8 w-7 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  animate={{ x: ['0%', '520%'] }}
                  transition={{
                    delay: 0.16 * index,
                    duration: 1.55,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  aria-hidden="true"
                />
              )}
              <Icon className="mx-auto mb-1 size-4" aria-hidden="true" />
              <span className="block truncate">{option.label}</span>
            </motion.div>
          )
        })}
      </div>
      <motion.div
        className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/24 bg-white/92 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-lg backdrop-blur"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35, ease: 'easeOut' }}
      >
        {isWaiting ? 'Aleg ruta civica potrivita' : `Ruta aleasa: ${selectedLabel}`}
      </motion.div>
      <SceneStatusPill isWaiting={isWaiting} waitingLabel="Rutare in curs" doneLabel="Ruta aleasa" />
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
      <div className="absolute inset-0 bg-slate-950/30" />
      <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="absolute inset-0 rounded-full border-2 border-teal-200/75"
            initial={{ scale: 0.2, opacity: 0.82 }}
            animate={{ scale: isWaiting ? 1.48 : 1.1, opacity: isWaiting ? 0 : 0.35 }}
            transition={{
              delay: index * 0.55,
              duration: 1.9,
              repeat: isWaiting ? Infinity : 0,
              ease: 'easeOut',
            }}
          />
        ))}
        <motion.span
          className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-teal-300 text-teal-950 shadow-lg shadow-teal-950/30"
          animate={{ scale: isWaiting ? [1, 1.1, 1] : 1, rotate: isWaiting ? [0, 4, -4, 0] : 0 }}
          transition={{ duration: 1.25, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
        >
          <Radar className="size-5" aria-hidden="true" />
        </motion.span>
        {[0, 1, 2, 3].map((dot) => (
          <motion.span
            key={dot}
            className="absolute flex size-5 items-center justify-center rounded-full border border-white/50 bg-white/90 text-[0.6rem] font-bold text-teal-700 shadow-lg"
            style={{
              left: `${18 + (dot % 2) * 58}%`,
              top: `${20 + Math.floor(dot / 2) * 52}%`,
            }}
            initial={{ opacity: 0, scale: 0.65 }}
            animate={{ opacity: isWaiting ? [0.35, 1, 0.35] : 0.82, scale: isWaiting ? [0.75, 1, 0.75] : 1 }}
            transition={{
              delay: dot * 0.16,
              duration: 1.35,
              repeat: isWaiting ? Infinity : 0,
              ease: 'easeInOut',
            }}
          >
            {dot + 1}
          </motion.span>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-white/16 bg-slate-950/74 p-3 text-sm font-semibold text-white backdrop-blur">
        {isWaiting
          ? 'Caut rapoarte apropiate in zona'
          : issue.duplicateCount > 0
            ? `${issue.duplicateCount} rapoarte similare gasite`
            : 'Nu exista duplicate apropiate'}
      </div>
      <SceneStatusPill isWaiting={isWaiting} waitingLabel="Caut duplicate" doneLabel="Duplicate verificate" />
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
  const statusLabel = hasMission
    ? 'Eveniment comunitar generat'
    : isWaiting
      ? 'Decizie in curs'
      : 'Fara eveniment separat'
  const title = mission?.title ??
    (isWaiting
      ? 'Verific daca raportul cere o actiune de grup'
      : 'Problema ramane activa pe harta')
  const checks = hasMission
    ? [
        'Locatia intra in zona de actiune',
        'Eveniment pregatit pentru comunitate',
        `Impact estimat +${mission?.impactPoints ?? 0}`,
      ]
    : isWaiting
      ? [
          'Verific daca problema cere un grup',
          'Caut rolul potrivit pentru comunitate',
          'Astept rezultatul de triere',
        ]
      : [
          'Semnalul ramane problema activa pe harta',
          'Nu necesita eveniment comunitar separat',
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
        className="absolute left-7 top-7 flex size-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-lg shadow-emerald-900/10"
        initial={{ scale: 0.76, opacity: 0, rotate: -8 }}
        animate={{
          scale: isWaiting ? [1, 1.08, 1] : 1,
          opacity: 1,
          rotate: isWaiting ? [-3, 3, -3] : 0,
        }}
        transition={{
          delay: 0.08,
          duration: isWaiting ? 1.55 : 0.55,
          repeat: isWaiting ? Infinity : 0,
          ease: 'easeInOut',
        }}
      >
        {hasMission ? (
          <Flag className="size-6" aria-hidden="true" />
        ) : isWaiting ? (
          <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-6" aria-hidden="true" />
        )}
      </motion.div>
      <motion.div
        className="relative ml-auto max-w-[calc(100%-4.75rem)] rounded-xl border border-emerald-200 bg-white/94 p-4 shadow-xl shadow-emerald-900/10 backdrop-blur sm:max-w-sm"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.28, duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className={cn(
            'absolute -left-2 top-5 h-14 w-1 rounded-full',
            isWaiting ? 'bg-teal-400' : hasMission ? 'bg-emerald-500' : 'bg-slate-300',
          )}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isWaiting ? [0.35, 1, 0.55] : 1 }}
          transition={{
            delay: 0.55,
            duration: isWaiting ? 1.3 : 0.45,
            repeat: isWaiting ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />
        <p className="text-xs font-semibold uppercase text-emerald-700">
          {statusLabel}
        </p>
        <h3 className="mt-1 text-lg font-semibold leading-tight text-emerald-950">
          {title}
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
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold',
                isWaiting
                  ? 'border-teal-100 bg-teal-50/75 text-teal-950'
                  : 'border-emerald-100 bg-emerald-50/70 text-emerald-900',
              )}
              initial={{ opacity: 0, x: -12 }}
              animate={{
                opacity: isWaiting ? [0.7, 1, 0.7] : 1,
                x: 0,
              }}
              transition={{
                delay: 0.62 + index * 0.16,
                duration: isWaiting ? 1.35 : 0.38,
                repeat: isWaiting ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              {isWaiting ? (
                <LoaderCircle className="size-3.5 shrink-0 animate-spin text-teal-600" aria-hidden="true" />
              ) : (
                <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
              )}
              <span className="min-w-0 break-words">{check}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="absolute bottom-5 left-8 right-12 h-1 origin-left overflow-hidden rounded-full bg-emerald-100"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.75, duration: 0.85, ease: 'easeOut' }}
      >
        <motion.span
          className="block h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-lime-400"
          animate={{ x: isWaiting ? ['-65%', '110%'] : '0%', width: isWaiting ? '55%' : '100%' }}
          transition={{ duration: 1.45, repeat: isWaiting ? Infinity : 0, ease: 'easeInOut' }}
        />
      </motion.div>
      <motion.div
        className="absolute bottom-3 left-7 right-7 grid grid-cols-3 gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.35 }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1 rounded-full',
              step === 0 || hasMission || !isWaiting ? 'bg-emerald-300' : 'bg-emerald-100',
            )}
          />
        ))}
      </motion.div>
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
  const rewardTitle = issue.relatedReward
    ? roReward(issue.relatedReward.title)
    : streamState.rewardMatched
      ? 'Reward local potrivit'
      : 'Reward in verificare'

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
        className="relative mx-auto max-w-sm overflow-hidden rounded-xl border border-emerald-200 bg-white p-4 shadow-xl shadow-emerald-900/10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.48, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-y-0 -left-24 w-20 bg-gradient-to-r from-transparent via-amber-200/55 to-transparent"
          animate={{ x: ['0%', '560%'] }}
          transition={{ delay: 0.35, duration: 1.8, repeat: hasPoints ? 0 : Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex items-center gap-3">
          <motion.span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
            initial={{ scale: 0.72, opacity: 0 }}
            animate={{
              scale: hasPoints ? [0.72, 1.08, 1] : [1, 1.06, 1],
              opacity: 1,
              rotate: hasPoints ? [-4, 2, 0] : [-2, 2, -2],
            }}
            transition={{
              duration: hasPoints ? 0.7 : 1.4,
              repeat: hasPoints ? 0 : Infinity,
              ease: 'easeInOut',
            }}
          >
            <Gift className="size-7" aria-hidden="true" />
          </motion.span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Puncte si recompense
            </p>
            <motion.h3
              className="mt-0.5 text-3xl font-semibold leading-tight sm:text-4xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.45 }}
            >
              {hasPoints ? `+${pointsAwarded}` : 'Se calculeaza'}
            </motion.h3>
          </div>
        </div>

        <div className="relative mt-4 grid gap-2 text-sm">
          <motion.div
            className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.35 }}
          >
            <span className="font-semibold text-slate-600">Rank</span>
            <span className="min-w-0 truncate font-semibold text-emerald-950">
              {rankName ? roRank(rankName) || rankName : 'Se sincronizeaza'}
            </span>
          </motion.div>
          <motion.div
            className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-lime-100 bg-lime-50/80 px-3 py-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.35 }}
          >
            <span className="font-semibold text-slate-600">Reward</span>
            <span className="min-w-0 truncate font-semibold text-emerald-950">
              {rewardTitle}
            </span>
          </motion.div>
        </div>

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
        <div className="relative mt-4 flex flex-wrap gap-2">
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

function getFinalCategoryLabel(issue: IssueResponse) {
  const category = roCategory(issue.category, '')

  if (!category || category === 'alta problema' || category === 'problema') {
    return 'Tip in confirmare'
  }

  return category
}

function getFinalActorLabel(issue: IssueResponse) {
  const actor = roActor(issue.responsibleActor, '')

  if (!actor || actor === 'neclar' || actor === 'unknown') {
    return 'Rutare civica'
  }

  return actor
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
  streamState,
}: {
  issue: IssueResponse
  location: ReportLocation
  description: string
  streamState: ReportStreamState
}) {
  const mapItem = useMemo(() => mapIssueResponseToCivicMapItem(issue), [issue])
  const [selectedMapItemId, setSelectedMapItemId] = useState<string | null>(null)
  const [highlightedMapItemId, setHighlightedMapItemId] = useState<string | null>(
    null,
  )
  const [showMapMarker, setShowMapMarker] = useState(false)
  const pointsAwarded = issue.gamification?.pointsAwarded ?? streamState.pointsAwarded
  const resultCards = [
    {
      label: 'Tip',
      value: getFinalCategoryLabel(issue),
      icon: GitBranch,
      className: 'text-teal-950',
      iconClassName: 'bg-teal-50 text-teal-700 ring-teal-100',
    },
    {
      label: 'Responsabil',
      value: getFinalActorLabel(issue),
      icon: Building2,
      className: 'text-emerald-950',
      iconClassName: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    },
    {
      label: 'Puncte',
      value: pointsAwarded !== null ? `+${pointsAwarded}` : 'Se adauga',
      icon: Trophy,
      className: 'text-lime-950',
      iconClassName: 'bg-lime-50 text-lime-700 ring-lime-100',
    },
  ]

  useEffect(() => {
    const resetTimeout = window.setTimeout(() => {
      setSelectedMapItemId(null)
      setHighlightedMapItemId(null)
      setShowMapMarker(false)
    }, 0)
    const showTimeout = window.setTimeout(() => setShowMapMarker(true), MAP_MARKER_DELAY_MS)
    const pulseTimeout = window.setTimeout(
      () => setHighlightedMapItemId(issue.id),
      MAP_MARKER_DELAY_MS + 120,
    )

    return () => {
      window.clearTimeout(resetTimeout)
      window.clearTimeout(showTimeout)
      window.clearTimeout(pulseTimeout)
    }
  }, [issue.id])

  return (
    <motion.section
      className="min-w-0 overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grid min-w-0 gap-0 p-2 sm:gap-3 sm:p-3 lg:p-4">
        <motion.div
          className="relative z-0 h-[calc(100dvh-14rem)] min-h-[29rem] min-w-0 overflow-hidden rounded-t-xl bg-white sm:h-[28rem] sm:min-h-0 sm:rounded-xl lg:h-[34rem]"
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
          className="relative z-30 -mt-28 rounded-t-2xl border border-emerald-100 bg-white p-4 text-sm shadow-xl shadow-slate-900/12 sm:mt-0 sm:rounded-xl sm:border-emerald-200 sm:p-5 sm:shadow-sm sm:shadow-emerald-900/8 lg:p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45, ease: 'easeOut' }}
        >
          <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-emerald-200 sm:hidden" />
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 sm:size-12">
              <MapPin className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-emerald-950 sm:text-lg">
                {location.name}
              </span>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600 sm:text-base">
                {location.address}
              </p>
              {description && (
                <p className="mt-2 hidden text-sm leading-6 text-slate-700 sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-2 rounded-xl border border-emerald-100 bg-emerald-50/55 p-2 sm:grid-cols-3 sm:gap-2 sm:border-emerald-200 sm:bg-emerald-50/70 sm:p-2.5 lg:gap-3 lg:p-3">
            {resultCards.map((item, index) => {
              const Icon = item.icon

              return (
                <motion.span
                  key={item.label}
                  className={cn(
                    'flex min-w-0 items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 shadow-sm shadow-emerald-900/5 lg:gap-3 lg:px-4 lg:py-3',
                    item.className,
                  )}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.55 + index * 0.1,
                    duration: 0.32,
                    ease: 'easeOut',
                  }}
                >
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 lg:size-10',
                      item.iconClassName,
                    )}
                  >
                    <Icon className="size-4 lg:size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.65rem] font-bold uppercase text-emerald-700 lg:text-[0.7rem]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-bold leading-snug text-slate-800 lg:text-base">
                      {item.value}
                    </span>
                  </span>
                </motion.span>
              )
            })}
          </div>
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
  const showDuplicateResult =
    currentStep.agentName === 'Duplicate Agent' &&
    !isWaiting &&
    (issue.duplicateCount > 0 || Boolean(issue.nearestDuplicate))

  return (
    <motion.div
      className="min-w-0 overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm shadow-emerald-900/6 sm:rounded-xl"
      initial={{ opacity: 0, x: 26 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(21rem,.92fr)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep.agentName}
            className="min-h-full min-w-0 overflow-hidden lg:border-r lg:border-emerald-100"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
          >
            <div className="lg:hidden">
              {currentStep.agentName === 'Mission Agent' ? (
                <MissionCreationScene issue={issue} isWaiting={isWaiting} />
              ) : currentStep.agentName === 'Reward Agent' ? (
                <RewardGenerationScene issue={issue} streamState={streamState} />
              ) : (
                <MobileAnalysisLightScene
                  imagePreviewUrl={imagePreviewUrl}
                  currentStep={currentStep}
                  issue={issue}
                  streamState={streamState}
                  isWaiting={isWaiting}
                />
              )}
            </div>
            <div className="hidden lg:block">
              <AgentScene
                currentStep={currentStep}
                issue={issue}
                imagePreviewUrl={imagePreviewUrl}
                streamState={streamState}
                isWaiting={isWaiting}
              />
            </div>
          </motion.div>
        </AnimatePresence>

      <div className="hidden p-3 sm:block sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm sm:size-11',
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
            <h3 className="mt-1 text-lg font-semibold leading-tight text-emerald-950 sm:text-xl">
              {roAgentName(currentStep.agentName)}
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-600 sm:hidden">
              {getAgentReturnText(currentStep, issue, streamState)}
            </p>
            <p className="mt-1 hidden text-sm leading-5 text-slate-600 sm:block">
              {isWaiting ? 'Verificarea ruleaza in timp real.' : 'Rezultatul a intrat in flow.'}
            </p>
          </div>
        </div>

        <div className="mt-4 hidden gap-2 sm:grid">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Lucreaza
            </p>
            <p className="mt-1 break-words text-sm leading-5 text-slate-700">
              {getAgentWorkText(currentStep.agentName)}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase text-emerald-700">
              A returnat
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
                  <p className="mt-0.5 break-words text-sm font-semibold leading-5 text-emerald-950">
                    {fact.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
      {showDuplicateResult && <DuplicateFlowCard issue={issue} streamState={streamState} />}
    </motion.div>
  )
}

function DuplicateFlowCard({
  issue,
  streamState,
}: {
  issue: IssueResponse
  streamState: ReportStreamState
}) {
  const duplicatePoints =
    issue.gamification?.pointsAwarded ?? streamState.pointsAwarded

  return (
    <motion.div
      className="border-t border-amber-100 bg-amber-50/80 p-3 sm:p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: 'easeOut' }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
          <GitMerge className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Rezultatul verificarii duplicate
          </p>
          <h3 className="mt-1 text-base font-semibold leading-tight text-emerald-950 sm:text-lg">
            Problema pare deja raportata
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            Am gasit un raport similar in apropiere. Semnalul tau ramane ca
            o confirmare care creste prioritatea problemei existente.
          </p>

          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <span className="rounded-lg border border-white/85 bg-white/75 px-3 py-2">
              <span className="block text-[0.68rem] font-semibold uppercase text-slate-500">
                Rapoarte similare
              </span>
              <span className="font-semibold text-emerald-950">
                {Math.max(issue.duplicateCount, 1)}
              </span>
            </span>
            <span className="rounded-lg border border-white/85 bg-white/75 px-3 py-2">
              <span className="block text-[0.68rem] font-semibold uppercase text-slate-500">
                Cel mai apropiat
              </span>
              <span className="font-semibold text-emerald-950">
                {issue.nearestDuplicate
                  ? `${issue.nearestDuplicate.distanceMeters}m`
                  : 'in apropiere'}
              </span>
            </span>
            <span className="rounded-lg border border-white/85 bg-white/75 px-3 py-2">
              <span className="block text-[0.68rem] font-semibold uppercase text-slate-500">
                Puncte
              </span>
              <span className="font-semibold text-emerald-950">
                {duplicatePoints !== null ? `+${duplicatePoints}` : 'confirmare'}
              </span>
            </span>
          </div>

          {issue.nearestDuplicate && (
            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-white/85 bg-white/75 p-3 sm:flex-row sm:items-center sm:justify-between">
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
  )
}

function AgentTrackPanel({
  steps,
  displayStepIndex,
  showMap,
  className,
}: {
  steps: DisplayStep[]
  displayStepIndex: number
  showMap: boolean
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-emerald-200 bg-white p-3 shadow-sm shadow-emerald-900/5', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Etape
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-950">
            {showMap ? 'Toate etapele sunt gata' : 'Verificare in desfasurare'}
          </p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Bot className="size-4.5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
        {steps.map((step, index) => {
          const StepIcon =
            step.kind === 'photo'
              ? Radar
              : step.kind === 'mission'
                ? Flag
                : step.kind === 'map'
                  ? MapPin
                  : Bot
          const stepAvatar = agentAvatarByName[step.agentName]
          const isDone = showMap || index < displayStepIndex
          const isActive = !showMap && index === displayStepIndex
          const stepTone = isDone
            ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
            : isActive
              ? 'border-teal-300 bg-teal-50 text-teal-950'
              : 'border-slate-200 bg-slate-50 text-slate-500'

          return (
            <motion.div
              key={step.id}
              className={cn(
                'relative flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border px-2.5 py-2 transition lg:px-3',
                stepTone,
                isActive && 'shadow-md shadow-teal-900/10 ring-2 ring-teal-200/70',
              )}
              animate={isActive ? { y: [0, -2, 0], scale: [1, 1.01, 1] } : { y: 0, scale: 1 }}
              transition={
                isActive
                  ? { duration: 1.25, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
            >
              {isActive && (
                <motion.span
                  className="absolute inset-y-0 -left-12 w-10 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  animate={{ x: ['0%', '620%'] }}
                  transition={{ duration: 1.55, repeat: Infinity, ease: 'easeInOut' }}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'relative flex size-8 shrink-0 items-center justify-center rounded-lg',
                  isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-teal-500 text-white' : 'bg-white text-slate-400',
                )}
              >
                {isActive && (
                  <motion.span
                    className="absolute -inset-1 rounded-xl border border-teal-300"
                    animate={{ scale: [0.9, 1.28], opacity: [0.8, 0] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                    aria-hidden="true"
                  />
                )}
                <span className="grid size-full place-items-center rounded-[0.45rem] bg-white/20 p-1">
                  {isDone ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : isActive ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : stepAvatar ? (
                    <img src={stepAvatar} alt="" className="size-5 rounded-sm object-cover" />
                  ) : (
                    <StepIcon className="size-4" aria-hidden="true" />
                  )}
                </span>
                {!isDone && !isActive && !stepAvatar && (
                  <span
                    className="absolute -right-0.5 -bottom-0.5 inline-flex size-3 rounded-full border border-white bg-slate-300"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">
                  {roAgentName(step.agentName)}
                </span>
                <span className="mt-0.5 block truncate text-[0.68rem] font-medium opacity-75">
                  {isDone ? 'finalizat' : isActive ? 'ruleaza acum' : 'in asteptare'}
                </span>
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
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
  const completedSteps = useMemo(() => getCompletedSteps(issue), [issue])
  const targetDisplayIndex = getVisualTargetDisplayIndex(
    issue,
    streamState,
    isSaving,
  )
  const showMap = readyForMap && displayStepIndex >= MAP_STEP_INDEX
  const currentStep = getStepForDisplayIndex(displayStepIndex, issue, streamState)
  const progress = getProgress(displayStepIndex, showMap)
  const completedStepsKey = completedSteps
    .map((step) => `${step.id}:${step.agentName}:${step.status}`)
    .join('|')
  const completedTrack = [
    ...plannedSteps,
    mapStep,
  ]
  const visibleCompletedSteps = completedSteps.filter((step) => {
    const stepIndex = getStepIndexByAgentName(step.agentName)

    return stepIndex >= 0 && stepIndex < displayStepIndex
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => setDisplayStepIndex(0), 0)

    return () => window.clearTimeout(timeout)
  }, [issue.id])

  useEffect(() => {
    if (displayStepIndex >= targetDisplayIndex) {
      return
    }

    const hasCachedResultForStep =
      readyForMap ||
      completedSteps.some((step) => getStepIndexByAgentName(step.agentName) >= displayStepIndex)
    const stepDelayMs = getStepDisplayDelayMs(
      currentStep,
      issue,
      hasCachedResultForStep,
    )

    const timeout = window.setTimeout(() => {
      setDisplayStepIndex((currentIndex) =>
        Math.min(currentIndex + 1, targetDisplayIndex),
      )
    }, stepDelayMs)

    return () => window.clearTimeout(timeout)
  }, [completedSteps, completedStepsKey, currentStep, displayStepIndex, issue, readyForMap, targetDisplayIndex])

  return (
    <div className="bg-gradient-to-b from-emerald-50/70 to-white p-2.5 sm:bg-none sm:p-5">
      <section className="hidden overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/70 shadow-sm sm:block">
        <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Analiza raportului
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-tight text-emerald-950 sm:text-2xl">
              {showMap ? 'Semnal pregatit pentru harta' : 'Verificam semnalul'}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {showMap
                ? 'Rezultatul este gata pentru inspectare si publicare pe harta.'
                : `${roAgentName(currentStep.agentName)} ruleaza acum si pregateste pasul urmator.`}
            </p>
          </div>
          <span className="hidden size-12 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm sm:flex">
            {showMap ? (
              <Trophy className="size-6" aria-hidden="true" />
            ) : (
              <Bot className="size-6" aria-hidden="true" />
            )}
          </span>
        </div>

        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="h-2 overflow-hidden rounded-full bg-white">
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
        </div>
      </section>

      <div className="grid min-w-0 gap-2.5 sm:mt-3 sm:gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        {!showMap && (
          <div className="lg:hidden">
            <AgentTrackPanel
              steps={completedTrack}
              displayStepIndex={displayStepIndex}
              showMap={showMap}
              className="rounded-xl border-emerald-100/90 bg-white/96 p-3"
            />
          </div>
        )}

        <div className="hidden lg:block">
          <AgentTrackPanel
            steps={completedTrack}
            displayStepIndex={displayStepIndex}
            showMap={showMap}
          />
        </div>

        <div className="grid min-w-0 gap-3">
          {!showMap && (
            <div className="hidden gap-2 text-sm sm:grid sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <span className="flex items-center gap-2 font-semibold text-emerald-950">
                  <MapPin className="size-4 text-emerald-600" aria-hidden="true" />
                  {location.name}
                </span>
                <p className="mt-1 line-clamp-2 text-slate-600">{location.address}</p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-slate-700 shadow-sm">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-teal-700">
                  <GitBranch className="size-3.5" aria-hidden="true" />
                  Date pentru analiza
                </span>
                <p className="mt-1 line-clamp-2 text-sm">
                  {description || 'Fotografia si locatia sunt suficiente pentru analiza.'}
                </p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {showMap ? (
              <FinalMapReveal
                key="map"
                issue={issue}
                location={location}
                description={description}
                streamState={streamState}
              />
            ) : (
              <AnalysisStep
                key={currentStep.agentName}
                issue={issue}
                imagePreviewUrl={imagePreviewUrl}
                currentStep={currentStep}
                streamState={streamState}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {!showMap && visibleCompletedSteps.length > 0 && (
        <div className="mt-3 hidden gap-2 lg:ml-[19rem] lg:grid">
          {visibleCompletedSteps.slice(-2).map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-white p-2 text-xs text-slate-600 shadow-sm"
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
        <p className="mt-3 hidden items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-sm font-medium text-emerald-800 sm:flex lg:ml-[19rem]">
          <CircleDashed className="mr-2 size-4 animate-spin" aria-hidden="true" />
          Astept primul rezultat al verificarii.
        </p>
      )}
    </div>
  )
}
