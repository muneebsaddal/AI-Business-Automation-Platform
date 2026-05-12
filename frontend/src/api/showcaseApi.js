const STORAGE_KEY = 'ai_ops_showcase_tasks'

const demoLead =
  'Qualify this inbound lead: Acme Logistics, contact Sarah Khan, operations director. They need workflow automation for quote follow-ups and customer onboarding. Budget mentioned is around $8k, timeline is this quarter, and they asked for a technical demo next week.'

const nodeSummaries = [
  ['IntentClassifier', 'Classified the request as lead qualification with high confidence.'],
  ['IRGenerator', 'Extracted company, contact, budget, timeline, pain points, and requested next step.'],
  ['IRValidator', 'Confirmed the intermediate representation has the required lead fields.'],
  ['SchemaResolver', 'Selected the lead qualification output schema.'],
  ['Planner', 'Built a scored qualification plan and follow-up sequence.'],
  ['Executor', 'Ran simulated CRM enrichment, scoring, and next-action tools.'],
  ['Validator', 'Validated the final JSON against the lead qualification schema.'],
]

const seededTasks = [
  {
    title: 'Qualify Acme Logistics inbound lead',
    description: demoLead,
    task_type_hint: 'lead',
  },
  {
    title: 'Review Master Services Agreement',
    description:
      'Analyze a draft MSA for renewal risk, termination terms, payment exposure, and operational handoff requirements.',
    task_type_hint: 'contract',
  },
  {
    title: 'Prepare onboarding runbook for Northstar Studio',
    description:
      'Create a client onboarding checklist for kickoff, workspace setup, stakeholder approvals, and first-week automation milestones.',
    task_type_hint: 'onboard',
  },
  {
    title: 'Score two agency operations leads',
    description:
      'Compare two inbound agency leads and recommend which should get a technical demo this week based on urgency and fit.',
    task_type_hint: 'lead',
  },
]

function timestamp(minutesAgo = 0) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
}

function taskTypeFromHint(hint) {
  if (hint === 'auto') return 'lead'
  return hint || 'custom'
}

function buildLeadOutput() {
  return {
    lead: {
      company: 'Acme Logistics',
      contact: 'Sarah Khan',
      role: 'Operations Director',
      budget_usd: 8000,
      timeline: 'This quarter',
      requested_next_step: 'Technical demo next week',
    },
    qualification: {
      score: 91,
      fit: 'high',
      confidence: 0.94,
      reasons: [
        'Clear operational pain around quote follow-ups and onboarding',
        'Budget is realistic for an automation pilot',
        'Timeline is near-term and tied to a requested demo',
      ],
      risks: ['Confirm CRM and email platform access before scoping integrations'],
    },
    recommended_actions: [
      'Book a 45-minute technical discovery demo',
      'Prepare examples for quote follow-up automation and onboarding status tracking',
      'Send a one-page pilot proposal with success metrics',
    ],
  }
}

function buildGenericOutput(taskType) {
  const outputs = {
    contract: {
      summary: 'The contract is demo-scored as moderate risk with review required before signature.',
      risk_level: 'medium',
      confidence: 0.87,
      flags: ['Termination language needs confirmation', 'Payment timing should be clarified'],
      recommended_actions: ['Route to legal review', 'Ask client to confirm renewal and SLA terms'],
    },
    onboard: {
      summary: 'The onboarding workflow is ready for a structured kickoff sequence.',
      confidence: 0.9,
      milestones: ['Workspace setup', 'Stakeholder map', 'Automation inventory', 'First workflow demo'],
      recommended_actions: ['Schedule kickoff', 'Collect system access', 'Create shared launch tracker'],
    },
    custom: {
      summary: 'The request was converted into a traceable automation plan.',
      confidence: 0.82,
      recommended_actions: ['Confirm inputs', 'Run a scoped pilot', 'Review output with an operator'],
    },
  }
  return outputs[taskType] || outputs.custom
}

function buildTrace(finalOutput) {
  const events = nodeSummaries.map(([node, summary], index) => ({
    event: 'node_start',
    node,
    action: summary,
    output: { summary, confidence: Number((0.86 + index * 0.015).toFixed(2)) },
  }))
  events.push({
    event: 'complete',
    status: 'success',
    output: finalOutput,
  })
  return events
}

export function createShowcaseTask(data, index = 0) {
  const taskType = taskTypeFromHint(data.task_type_hint)
  const finalOutput = taskType === 'lead' ? buildLeadOutput() : buildGenericOutput(taskType)
  const id = `demo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

  return {
    id,
    title: data.title,
    description: data.description,
    task_type_hint: data.task_type_hint || taskType,
    task_type: taskType,
    status: 'success',
    retry_count: 0,
    duration_ms: 1840 + index * 310,
    cost_usd: 0.0042 + index * 0.0007,
    created_at: timestamp(index * 42),
    execution_trace: buildTrace(finalOutput),
    final_output: finalOutput,
    validation_errors: [],
  }
}

export function seedShowcaseTasks() {
  return seededTasks.map((task, index) => createShowcaseTask(task, index))
}

function readTasks() {
  if (typeof localStorage === 'undefined') return seedShowcaseTasks()
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  if (Array.isArray(stored) && stored.length > 0) return stored
  const seeded = seedShowcaseTasks()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

function writeTasks(tasks) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }
}

export function getShowcaseAnalytics(tasks = readTasks()) {
  const byStatus = {}
  const byType = {}
  let totalDuration = 0
  let totalCost = 0
  let successes = 0

  tasks.forEach((task) => {
    byStatus[task.status] = (byStatus[task.status] || 0) + 1
    byType[task.task_type] = (byType[task.task_type] || 0) + 1
    totalDuration += task.duration_ms || 0
    totalCost += task.cost_usd || 0
    if (task.status === 'success') successes += 1
  })

  return {
    total_tasks: tasks.length,
    success_rate: tasks.length ? successes / tasks.length : 0,
    avg_duration_ms: tasks.length ? totalDuration / tasks.length : 0,
    total_cost_usd: totalCost,
    by_status: byStatus,
    by_type: byType,
    recent_tasks: tasks.slice(0, 6),
  }
}

export async function submitShowcaseTask(data) {
  const tasks = readTasks()
  const task = createShowcaseTask(data)
  writeTasks([task, ...tasks])
  return { task_id: task.id, status: task.status }
}

export async function getShowcaseTask(id) {
  const task = readTasks().find((item) => item.id === id)
  if (!task) throw new Error('Task not found')
  return task
}

export async function listShowcaseTasks(filters = {}) {
  let tasks = readTasks()
  if (filters.status) tasks = tasks.filter((task) => task.status === filters.status)
  if (filters.task_type) tasks = tasks.filter((task) => task.task_type === filters.task_type)
  if (filters.search) {
    const search = filters.search.toLowerCase()
    tasks = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search),
    )
  }

  const page = Number(filters.page || 1)
  const limit = Number(filters.limit || 10)
  const start = (page - 1) * limit

  return {
    total: tasks.length,
    page,
    limit,
    items: tasks.slice(start, start + limit),
  }
}

export async function deleteShowcaseTask(id) {
  writeTasks(readTasks().filter((task) => task.id !== id))
}

export async function rerunShowcaseTask(id) {
  const source = await getShowcaseTask(id)
  return submitShowcaseTask({
    title: `${source.title} replay`,
    description: source.description,
    task_type_hint: source.task_type_hint,
  })
}

export async function exportShowcaseTrace(id) {
  const task = await getShowcaseTask(id)
  return {
    task_id: task.id,
    title: task.title,
    exported_at: new Date().toISOString(),
    execution_trace: task.execution_trace,
    final_output: task.final_output,
    validation_errors: task.validation_errors,
  }
}

export async function getShowcaseDashboardAnalytics() {
  return getShowcaseAnalytics()
}
