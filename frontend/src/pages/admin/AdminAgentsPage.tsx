import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  LayoutDashboard,
  Pencil,
  Power,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from '@/components/icons/hugeicons'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { DemoSkeletonGrid, DemoState } from '@/components/ui/demo-state'
import {
  fetchAdminAgents,
  isApiConfigured,
  updateAdminAgent,
  type AdminAgentResponse,
  type UpdateAdminAgentInput,
} from '@/lib/api'
import { adminAgentsQueryKey } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'

type AgentFormState = UpdateAdminAgentInput

const emptyForm: AgentFormState = {
  name: '',
  role: '',
  description: '',
  instructions: '',
  model: '',
  fallbackMode: '',
  isEnabled: true,
}

const agentDefaults = {
  vision: {
    role: 'Clasificator poza si sesizare',
    description:
      'Analizeaza poza, descrierea, locatia si coordonatele, apoi returneaza categoria, severitatea, rezumatul, increderea si riscul.',
    instructions:
      'Analizeaza sesizarea CiviTm cu poza, descriere, locatie si coordonate. Foloseste taxonomia Timisoara, alege categoria cea mai specifica sau other cand dovezile sunt neclare. Returneaza category, subcategory extra, severity low/medium/high/critical, confidence, summary scurt, visibleEvidence, safetyRisk si isUrgent. Nu folosi urgent ca severity; pentru riscuri de siguranta foloseste critical + isUrgent true. Nu exagera ce se vede in poza si explica incertitudinea.',
    fallbackMode: 'Fallback pe descriere, categorie si zona, cu incredere medie.',
  },
  triage: {
    role: 'Router actor responsabil',
    description: 'Alege ruta practica pentru primarie, comunitate, parteneri sau actiune mixta.',
    instructions:
      'Decide ruta practica folosind categoria, severitatea, locatia, duplicatul si Vision Agent. Mapare DB: city_hall -> city_hall, community -> community, mixed -> community_and_city_hall; partner ramane semnal pentru Reward Agent, nu responsibleActor. Alege city_hall pentru infrastructura, siguranta, drumuri, iluminat, canalizare, transport sau responsabilitate legala. Alege community pentru actiuni locale sigure. Nu atribui vina; propune urmatoarea actiune utila si o eticheta UI scurta.',
    fallbackMode: 'Mapare determinista dupa categorie, risc si actor responsabil.',
  },
  duplicate: {
    role: 'Verificator duplicate apropiate',
    description: 'Compara sesizari active apropiate si pastreaza clusterele vizibile pentru demo.',
    instructions:
      'Verifica daca noua sesizare este probabil duplicat. Compara distanta, categoria, subcategoria, severitatea, statusul, data, textul/imaginea cand exista si aceeasi strada/zona/reper. Marcheaza duplicat doar cand potrivirea este clara; daca e medie, recomanda admin review, nu bloca. Pastreaza clusterele vizibile pentru storytelling si nu ascunde sesizari valide.',
    fallbackMode: 'Scan numeric lat/lng 300m plus hash imagine si categorie/status.',
  },
  mission: {
    role: 'Planificator misiuni civice',
    description: 'Transforma sesizari eligibile in misiuni mici, sigure si locale.',
    instructions:
      'Creeaza o misiune mica doar daca sesizarea este potrivita pentru actiune sigura din partea comunitatii sau partenerilor. Foloseste categoria, severitatea, locatia, ruta Triage si duplicatul. Nu crea misiuni pentru probleme periculoase sau tehnice care cer interventie oficiala. Misiunile trebuie sa fie locale, realiste pentru HackTM, prietenoase civic, cu participanti, timp estimat, impact, materiale, note de siguranta si criterii de succes cand exista in output.',
    fallbackMode: 'Template local pentru deseuri mari eligibile si zona raportata.',
  },
  reward: {
    role: 'Matcher recompense civice',
    description: 'Potriveste misiuni si actiuni civice cu recompense de sistem sau parteneri.',
    instructions:
      'Potriveste misiunea cu recompense realiste folosind tipul misiunii, dificultatea, punctele de impact, nivelul userului, lista de rewards si zona. Prefera parteneri locali cand exista date reale potrivite. Nu inventa oferte, bani, beneficii oficiale sau premii indisponibile. Daca nu exista partener potrivit, foloseste reward de sistem, badge sau rank progress. Recompensa trebuie sa incurajeze actiuni utile, nu spam.',
    fallbackMode: 'Selectie din rewards seeded; fallback system reward.',
  },
  city: {
    role: 'Analist impact oras',
    description: 'Genereaza insight-uri pentru admin din sesizari, misiuni, zone si impact.',
    instructions:
      'Analizeaza sesizarile active, misiunile, zonele si semnalele de impact pentru dashboard admin. Concentreaza-te pe zona cea mai activa, semnal civic puternic, tipare repetate, riscuri urgente, impact comunitar, oportunitati pentru parteneri si urmatoarea actiune vizibila. Nu exagera cand sunt putine date; foloseste semnal timpuriu sau tipar emergent.',
    fallbackMode: 'Rezumat determinist din zone, categorii, urgente si misiuni.',
  },
  authorityEmail: {
    role: 'Redactor email autoritati',
    description: 'Pregateste emailuri concise in romana pentru autoritatea locala potrivita.',
    instructions:
      'Scrie email concis in romana pentru autoritatea locala potrivita folosind tipul sesizarii, severitatea, locatia, data si dovada foto. Include subiect clar, salut politicos, context scurt, coordonate, data, motivul severitatii, URL foto si actiunea solicitata. Ton profesional, neutru si factual; nu acuza si nu spune ca problema a fost verificata oficial. Daca autoritatea e incerta, cere redirectionarea catre departamentul potrivit.',
    fallbackMode: 'Sablon email dupa categorie, actor responsabil si severitate.',
  },
} as const

const demoAdminAgents: AdminAgentResponse[] = [
  {
    id: 'demo-vision',
    key: 'vision',
    name: 'Vision Agent',
    role: agentDefaults.vision.role,
    description: agentDefaults.vision.description,
    instructions: agentDefaults.vision.instructions,
    model: 'gpt-4o-mini',
    fallbackMode: agentDefaults.vision.fallbackMode,
    isEnabled: true,
    sortOrder: 1,
    totalSteps: 0,
    completedSteps: 0,
    fallbackSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    lastRunAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'demo-triage',
    key: 'triage',
    name: 'Triage Agent',
    role: agentDefaults.triage.role,
    description: agentDefaults.triage.description,
    instructions: agentDefaults.triage.instructions,
    model: 'gpt-4o-mini',
    fallbackMode: agentDefaults.triage.fallbackMode,
    isEnabled: true,
    sortOrder: 2,
    totalSteps: 0,
    completedSteps: 0,
    fallbackSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    lastRunAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'demo-duplicate',
    key: 'duplicate',
    name: 'Duplicate Agent',
    role: agentDefaults.duplicate.role,
    description: agentDefaults.duplicate.description,
    instructions: agentDefaults.duplicate.instructions,
    model: 'deterministic',
    fallbackMode: agentDefaults.duplicate.fallbackMode,
    isEnabled: true,
    sortOrder: 3,
    totalSteps: 0,
    completedSteps: 0,
    fallbackSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    lastRunAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'demo-mission',
    key: 'mission',
    name: 'Mission Agent',
    role: agentDefaults.mission.role,
    description: agentDefaults.mission.description,
    instructions: agentDefaults.mission.instructions,
    model: 'gpt-4o-mini',
    fallbackMode: agentDefaults.mission.fallbackMode,
    isEnabled: true,
    sortOrder: 4,
    totalSteps: 0,
    completedSteps: 0,
    fallbackSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    lastRunAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'demo-reward',
    key: 'reward',
    name: 'Reward Agent',
    role: agentDefaults.reward.role,
    description: agentDefaults.reward.description,
    instructions: agentDefaults.reward.instructions,
    model: 'deterministic',
    fallbackMode: agentDefaults.reward.fallbackMode,
    isEnabled: true,
    sortOrder: 5,
    totalSteps: 0,
    completedSteps: 0,
    fallbackSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    lastRunAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'demo-city',
    key: 'city',
    name: 'City Agent',
    role: agentDefaults.city.role,
    description: agentDefaults.city.description,
    instructions: agentDefaults.city.instructions,
    model: 'deterministic',
    fallbackMode: agentDefaults.city.fallbackMode,
    isEnabled: true,
    sortOrder: 6,
    totalSteps: 0,
    completedSteps: 0,
    fallbackSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    lastRunAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'demo-authority-email',
    key: 'authority_email',
    name: 'Authority Email Agent',
    role: agentDefaults.authorityEmail.role,
    description: agentDefaults.authorityEmail.description,
    instructions: agentDefaults.authorityEmail.instructions,
    model: 'deterministic',
    fallbackMode: agentDefaults.authorityEmail.fallbackMode,
    isEnabled: true,
    sortOrder: 7,
    totalSteps: 0,
    completedSteps: 0,
    fallbackSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    lastRunAt: null,
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-05-15T00:00:00Z',
  },
]

export function AdminAgentsPage() {
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.session)
  const accessToken = session?.access_token ?? null
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [form, setForm] = useState<AgentFormState>(emptyForm)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const agentsQuery = useQuery({
    queryKey: adminAgentsQueryKey,
    queryFn: () => fetchAdminAgents(accessToken),
    enabled: Boolean(accessToken && isApiConfigured),
    refetchInterval: 5_000,
  })
  const fetchedAgents = useMemo(() => agentsQuery.data ?? [], [agentsQuery.data])
  const shouldUseDemoAgents =
    !agentsQuery.isLoading &&
    (!isApiConfigured || (!agentsQuery.isError && fetchedAgents.length === 0))
  const shouldShowAdminApiError =
    !agentsQuery.isLoading && isApiConfigured && agentsQuery.isError
  const agents = useMemo(
    () => (shouldUseDemoAgents ? demoAdminAgents : fetchedAgents),
    [fetchedAgents, shouldUseDemoAgents],
  )
  const canEditAgents =
    isApiConfigured &&
    Boolean(accessToken) &&
    !shouldUseDemoAgents &&
    !agentsQuery.isError
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId],
  )
  const enabledCount = agents.filter((agent) => agent.isEnabled).length
  const totalSteps = agents.reduce((sum, agent) => sum + agent.totalSteps, 0)
  const fallbackSteps = agents.reduce((sum, agent) => sum + agent.fallbackSteps, 0)
  const failedSteps = agents.reduce((sum, agent) => sum + agent.failedSteps, 0)
  const skippedSteps = agents.reduce((sum, agent) => sum + agent.skippedSteps, 0)

  const updateMutation = useMutation({
    mutationFn: (input: AgentFormState) => {
      if (!selectedAgent || !accessToken || !canEditAgents) {
        throw new Error('Agent editing is available only when the backend agent configs are loaded.')
      }

      return updateAdminAgent(selectedAgent.id, input, accessToken)
    },
    onSuccess: async (updatedAgent) => {
      setSavedMessage(`${updatedAgent.name} was updated.`)
      await queryClient.invalidateQueries({ queryKey: adminAgentsQueryKey })
    },
  })

  useEffect(() => {
    if (!selectedAgent) {
      return
    }

    const timeout = window.setTimeout(() => {
      setSelectedAgentId(selectedAgent.id)
      setForm(toFormState(selectedAgent))
      setSavedMessage(null)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [selectedAgent])

  function updateField<K extends keyof AgentFormState>(
    field: K,
    value: AgentFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setSavedMessage(null)
  }

  function handleReset() {
    if (!selectedAgent) {
      return
    }

    setForm(toFormState(selectedAgent))
    setSavedMessage(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateMutation.mutate(form)
  }

  return (
    <main className="min-h-svh overflow-x-hidden bg-orange-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <motion.section
        className="mx-auto grid w-full max-w-7xl gap-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <TopNavigation />
        <div className="grid gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Bot className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                CiviTm admin
              </p>
              <h1 className="text-2xl font-semibold leading-tight text-emerald-950 sm:text-3xl">
                Agent control
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Configureaza agentii demo si urmareste fallback-urile fara sa pierzi contextul operational.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <Link to="/admin/dashboard">
                <LayoutDashboard data-icon="inline-start" aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <Link to="/">
                <ArrowLeft data-icon="inline-start" aria-hidden="true" />
                Live map
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Agenti configurati" value={agents.length} />
          <SummaryCard label="Activi" value={enabledCount} />
          <SummaryCard label="Pasi rulati" value={totalSteps} />
          <SummaryCard
            label="Fallback / skipped / failed"
            value={fallbackSteps + skippedSteps + failedSteps}
          />
        </div>

        {shouldUseDemoAgents && (
          <DemoState
            icon={TriangleAlert}
            tone="amber"
            eyebrow="Demo fallback"
            title="Agent configs are shown from the MVP fallback"
            description={
              !isApiConfigured
                ? 'Set VITE_API_URL and sign in as an admin to edit live agent configuration.'
                : 'The backend returned no agent configs, so this page keeps the seeded MVP agents visible in read-only mode.'
            }
          />
        )}

        {agentsQuery.isLoading ? (
          <DemoSkeletonGrid items={6} className="md:grid-cols-2 xl:grid-cols-3" />
        ) : shouldShowAdminApiError ? (
          <DemoState
            icon={TriangleAlert}
            tone="rose"
            eyebrow="Admin API"
            title="Statisticile live ale agentilor nu au putut fi citite"
            description="Verifica daca esti logat cu rol admin si daca backendul raspunde pe VITE_API_URL. Misiunile si recompensele pot rula in fluxul de raportare, dar aceasta pagina nu afiseaza countere reale fara raspunsul /api/admin/agents."
          />
        ) : (
          <section className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.4fr)]">
            <div className="grid gap-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  className={`grid min-h-36 cursor-pointer gap-3 rounded-lg border p-4 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                    selectedAgent?.id === agent.id
                      ? 'border-emerald-400 bg-white ring-2 ring-emerald-100'
                      : 'border-emerald-200 bg-white hover:border-emerald-300'
                  }`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          {agent.key}
                        </span>
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${
                            agent.isEnabled
                              ? 'bg-lime-50 text-lime-700 ring-lime-200'
                              : 'bg-slate-50 text-slate-600 ring-slate-200'
                          }`}
                        >
                          {agent.isEnabled ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-emerald-950">
                        {agent.name}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                        {agent.role}
                      </p>
                    </div>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Sparkles className="size-4" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <MetricPill label="Steps" value={agent.totalSteps} />
                    <MetricPill label="Skipped" value={agent.skippedSteps} />
                    <MetricPill label="Failed" value={agent.failedSteps} />
                  </div>
                </button>
              ))}
            </div>

            <form
              className="grid gap-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-sm lg:sticky lg:top-5 lg:self-start"
              onSubmit={handleSubmit}
            >
              {selectedAgent ? (
                <>
                  <div className="flex flex-col gap-3 border-b border-emerald-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Edit agent
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-emerald-950">
                        {selectedAgent.name}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Last update: {formatDate(selectedAgent.updatedAt)}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800">
                      <input
                        type="checkbox"
                        className="size-4 accent-emerald-600"
                        checked={form.isEnabled}
                        onChange={(event) =>
                          updateField('isEnabled', event.target.checked)
                        }
                        disabled={!canEditAgents}
                      />
                      <Power className="size-4" aria-hidden="true" />
                      Enabled
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Name">
                      <input
                        className={inputClassName}
                        value={form.name}
                        onChange={(event) => updateField('name', event.target.value)}
                        readOnly={!canEditAgents}
                      />
                    </Field>
                    <Field label="Model">
                      <input
                        className={inputClassName}
                        value={form.model}
                        onChange={(event) => updateField('model', event.target.value)}
                        readOnly={!canEditAgents}
                      />
                    </Field>
                  </div>

                  <Field label="Role">
                    <input
                      className={inputClassName}
                      value={form.role}
                      onChange={(event) => updateField('role', event.target.value)}
                      readOnly={!canEditAgents}
                    />
                  </Field>

                  <Field label="Description">
                    <textarea
                      className={textareaClassName}
                      rows={3}
                      value={form.description}
                      onChange={(event) =>
                        updateField('description', event.target.value)
                      }
                      readOnly={!canEditAgents}
                    />
                  </Field>

                  <Field label="Instructions">
                    <textarea
                      className={textareaClassName}
                      rows={6}
                      value={form.instructions}
                      onChange={(event) =>
                        updateField('instructions', event.target.value)
                      }
                      readOnly={!canEditAgents}
                    />
                  </Field>

                  <Field label="Fallback mode">
                    <textarea
                      className={textareaClassName}
                      rows={3}
                      value={form.fallbackMode}
                      onChange={(event) =>
                        updateField('fallbackMode', event.target.value)
                      }
                      readOnly={!canEditAgents}
                    />
                  </Field>

                  {!canEditAgents && (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                      Read-only demo view. Live edits unlock after the admin API returns real agent configs.
                    </p>
                  )}

                  <div className="grid gap-2 rounded-lg border border-teal-100 bg-teal-50 p-3 text-sm text-teal-900 sm:grid-cols-2">
                    <span>Total steps: {selectedAgent.totalSteps}</span>
                    <span>Completed: {selectedAgent.completedSteps}</span>
                    <span>Fallback: {selectedAgent.fallbackSteps}</span>
                    <span>Skipped: {selectedAgent.skippedSteps}</span>
                    <span>Last run: {formatDate(selectedAgent.lastRunAt)}</span>
                  </div>

                  {updateMutation.isError && (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                      {updateMutation.error.message}
                    </p>
                  )}
                  {savedMessage && (
                    <p className="inline-flex items-center gap-2 rounded-lg border border-lime-200 bg-lime-50 px-3 py-2 text-sm font-semibold text-lime-700">
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      {savedMessage}
                    </p>
                  )}

                  <div className="flex flex-col-reverse gap-2 border-t border-emerald-100 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      onClick={handleReset}
                      disabled={!canEditAgents}
                    >
                      <RotateCcw data-icon="inline-start" aria-hidden="true" />
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      className="min-h-11"
                      disabled={updateMutation.isPending || !canEditAgents}
                    >
                      {updateMutation.isPending ? (
                        <Pencil data-icon="inline-start" aria-hidden="true" />
                      ) : (
                        <Save data-icon="inline-start" aria-hidden="true" />
                      )}
                      {updateMutation.isPending ? 'Saving' : 'Save agent'}
                    </Button>
                  </div>
                </>
              ) : (
                <DemoState
                  icon={ShieldCheck}
                  tone="slate"
                  eyebrow="No agents"
                  title="No agent configuration found"
                  description="Seed data will create the MVP agents when the backend starts."
                />
              )}
            </form>
          </section>
        )}
      </motion.section>
    </main>
  )
}

const inputClassName =
  'h-11 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'

const textareaClassName =
  'min-h-24 w-full resize-y rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'

function toFormState(agent: AdminAgentResponse): AgentFormState {
  return {
    name: agent.name,
    role: agent.role,
    description: agent.description,
    instructions: agent.instructions,
    model: agent.model,
    fallbackMode: agent.fallbackMode,
    isEnabled: agent.isEnabled,
  }
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
    </article>
  )
}

function MetricPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-emerald-100 bg-orange-50 px-2 py-2 text-slate-600">
      <span className="block font-semibold text-emerald-950">{value}</span>
      {label}
    </span>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-emerald-950">{label}</span>
      {children}
    </label>
  )
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No run yet'
  }

  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
