const STORAGE_KEY = 'ai_ops_showcase_tasks'
const STORAGE_VERSION = 4

export const showcaseTemplates = [
  {
    id: 'lead-qualification',
    title: 'Qualify Acme Logistics inbound lead',
    label: 'Lead Qualification',
    task_type_hint: 'lead',
    description:
      'Qualify this inbound lead: Acme Logistics, contact Sarah Khan, operations director. They need workflow automation for quote follow-ups and customer onboarding. Budget mentioned is around $8k, timeline is this quarter, and they asked for a technical demo next week.',
    customer_value:
      'Turns a messy inbound request into a scored opportunity, buying-signal summary, and next action.',
    expected_result_summary:
      'Lead score, fit, risks, recommended follow-up, confidence, and validated JSON.',
    recommended: true,
  },
  {
    id: 'contract-analyzer',
    title: 'Review renewal terms for Atlas Field Services',
    label: 'Contract Analyzer',
    task_type_hint: 'contract',
    description:
      'Review this service agreement renewal for Atlas Field Services. Pull out renewal dates, payment terms, operational obligations, missing details, and any clauses that should be reviewed before signature.',
    customer_value:
      'Finds contract risk and missing business details before a team signs or renews.',
    expected_result_summary:
      'Risk level, key clauses, missing fields, obligations, and review recommendations.',
    recommended: false,
  },
  {
    id: 'client-onboarding',
    title: 'Prepare onboarding runbook for Northstar Studio',
    label: 'Client Onboarding',
    task_type_hint: 'onboard',
    description:
      'Create an onboarding runbook for Northstar Studio. They need kickoff prep, workspace setup, stakeholder approvals, first-week milestones, and a client-facing welcome sequence.',
    customer_value:
      'Converts a client brief into a repeatable onboarding checklist and launch plan.',
    expected_result_summary:
      'Milestones, setup steps, owner handoffs, welcome actions, and launch confidence.',
    recommended: false,
  },
  {
    id: 'custom-ops',
    title: 'Turn support handoff notes into an action plan',
    label: 'Custom Operations Workflow',
    task_type_hint: 'custom',
    description:
      'Turn these support handoff notes into a clean action plan: customer is waiting on account access, billing needs to confirm invoice status, implementation needs a timeline update, and the account manager wants a concise customer reply.',
    customer_value:
      'Transforms loose operations notes into visible steps that can be assigned, reviewed, and replayed.',
    expected_result_summary:
      'Structured plan, step status, owner suggestions, customer reply draft, and validation trace.',
    recommended: false,
  },
]

const nodeSummaries = {
  lead: [
    ['IntentClassifier', 'Classified the request as lead qualification with high confidence.'],
    ['IRGenerator', 'Extracted company, contact, budget, timeline, pain points, and requested next step.'],
    ['IRValidator', 'Confirmed the intermediate representation has the required lead fields.'],
    ['SchemaResolver', 'Selected the lead qualification output schema.'],
    ['Planner', 'Built a scored qualification plan and follow-up sequence.'],
    ['Executor', 'Ran simulated CRM enrichment, scoring, and next-action tools.'],
    ['Validator', 'Validated the final lead result and confidence fields.'],
  ],
  contract: [
    ['IntentClassifier', 'Classified the request as contract analysis.'],
    ['IRGenerator', 'Extracted parties, renewal timing, obligations, terms, and risk signals.'],
    ['IRValidator', 'Checked that the contract review fields were complete enough to analyze.'],
    ['SchemaResolver', 'Selected the contract risk output schema.'],
    ['Planner', 'Planned clause extraction, obligation review, and risk scoring steps.'],
    ['Executor', 'Ran simulated clause, date, obligation, and missing-field tools.'],
    ['Validator', 'Validated the risk level, flags, and review recommendations.'],
  ],
  onboard: [
    ['IntentClassifier', 'Classified the request as client onboarding.'],
    ['IRGenerator', 'Extracted client goals, setup needs, stakeholders, and launch milestones.'],
    ['IRValidator', 'Confirmed the onboarding checklist has the required setup fields.'],
    ['SchemaResolver', 'Selected the onboarding runbook output schema.'],
    ['Planner', 'Planned kickoff, workspace setup, approvals, and first-week delivery steps.'],
    ['Executor', 'Ran simulated setup, welcome sequence, and milestone planning tools.'],
    ['Validator', 'Validated the onboarding plan and readiness confidence.'],
  ],
  custom: [
    ['IntentClassifier', 'Classified the request as a custom operations workflow.'],
    ['IRGenerator', 'Extracted stakeholders, constraints, requested outputs, and action items.'],
    ['IRValidator', 'Checked that the custom workflow can be planned and reviewed.'],
    ['SchemaResolver', 'Selected the generic operations plan output schema.'],
    ['Planner', 'Planned visible work steps with review points and handoffs.'],
    ['Executor', 'Ran simulated parsing, assignment, and customer-response tools.'],
    ['Validator', 'Validated the final action plan and review notes.'],
  ],
}

const seededTasks = [
  { ...showcaseTemplates[0], minutesAgo: 8 },
  {
    ...showcaseTemplates[1],
    title: 'Review renewal terms for Atlas Field Services',
    minutesAgo: 52,
  },
  {
    ...showcaseTemplates[2],
    title: 'Prepare onboarding runbook for Northstar Studio',
    minutesAgo: 184,
  },
  {
    ...showcaseTemplates[3],
    title: 'Resolve Priority Freight support handoff',
    description:
      'Turn these support handoff notes into an action plan: Priority Freight is waiting on account access, billing needs invoice confirmation, implementation owes a delivery date, and the account manager needs a concise customer update.',
    minutesAgo: 920,
  },
  {
    ...showcaseTemplates[0],
    title: 'Score inbound demo request from Meridian Clinics',
    description:
      'Qualify this inbound lead: Meridian Clinics, contact Elena Park, revenue operations lead. They want automation for referral intake, appointment follow-up, and weekly operations reporting. Budget is not confirmed, but they asked for integration details.',
    status: 'escalated',
    minutesAgo: 1260,
  },
  {
    ...showcaseTemplates[1],
    title: 'Extract risk flags from NovaBuild vendor MSA',
    description:
      'Review the NovaBuild vendor master services agreement. Identify renewal language, support obligations, payment terms, cancellation notice, missing attachments, and clauses that need legal review.',
    minutesAgo: 1640,
  },
  {
    ...showcaseTemplates[2],
    title: 'Launch onboarding checklist for BluePeak Finance',
    description:
      'Create an onboarding runbook for BluePeak Finance covering kickoff prep, sandbox access, stakeholder approvals, compliance review, data import, and first workflow acceptance criteria.',
    minutesAgo: 2540,
  },
  {
    ...showcaseTemplates[3],
    title: 'Convert warehouse exception notes into owner actions',
    description:
      'Turn warehouse exception notes into a structured operations plan: delayed pallet scan, inventory mismatch, carrier update needed, and finance wants the chargeback risk summarized before noon.',
    minutesAgo: 3110,
  },
  {
    ...showcaseTemplates[0],
    title: 'Qualify procurement automation lead at Harbor Retail',
    description:
      'Qualify this inbound lead: Harbor Retail, contact Jonah Miles, procurement director. They need purchase order exception handling, supplier follow-up, and audit-ready approval logs for a pilot next month.',
    minutesAgo: 3890,
  },
]

export function getRecommendedShowcaseTemplate() {
  return showcaseTemplates.find((template) => template.recommended) || showcaseTemplates[0]
}

function timestamp(minutesAgo = 0) {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
}

function taskTypeFromHint(hint) {
  if (hint === 'auto') return 'lead'
  return hint || 'custom'
}

function buildLeadOutput(data) {
  return {
    lead: {
      company: data.title.includes('Acme') ? 'Acme Logistics' : 'Enterprise prospect',
      contact: data.title.includes('Acme') ? 'Sarah Khan' : 'Unknown buyer',
      role: data.title.includes('Acme') ? 'Operations Director' : 'Operations stakeholder',
      budget_usd: data.title.includes('Acme') ? 8000 : null,
      timeline: data.title.includes('Acme') ? 'This quarter' : 'Needs confirmation',
      requested_next_step: 'Technical discovery follow-up',
    },
    qualification: {
      score: data.status === 'escalated' ? 68 : 91,
      fit: data.status === 'escalated' ? 'needs_review' : 'high',
      confidence: data.status === 'escalated' ? 0.72 : 0.94,
      reasons: [
        'Clear operational pain around follow-up work',
        'Specific automation need is visible in the request',
        'A human can review the trace before routing',
      ],
      risks:
        data.status === 'escalated'
          ? ['Decision maker and budget need human confirmation before routing']
          : ['Confirm CRM and email platform access before scoping integrations'],
    },
    recommended_actions:
      data.status === 'escalated'
        ? ['Ask for decision maker, budget, and integration stack before booking a demo']
        : [
            'Book a 45-minute technical discovery demo',
            'Prepare examples for quote follow-up automation and onboarding status tracking',
            'Send a one-page pilot proposal with success metrics',
          ],
  }
}

function buildContractOutput(data) {
  return {
    summary: `${data.title} is ready for business review with several terms highlighted.`,
    risk_level: data.title.toLowerCase().includes('cancellation') ? 'medium-high' : 'medium',
    confidence: 0.87,
    key_terms: ['Renewal timing', 'Payment obligations', 'Notice periods', 'Acceptance criteria'],
    flags: ['Confirm termination language', 'Clarify payment timing', 'Route ambiguous clauses to legal'],
    recommended_actions: ['Send flagged clauses to legal review', 'Ask the client to confirm operating dates'],
  }
}

function buildOnboardingOutput(data) {
  return {
    summary: `${data.title} has been converted into a launch-ready onboarding runbook.`,
    confidence: 0.9,
    milestones: ['Kickoff prep', 'Workspace setup', 'Stakeholder map', 'First workflow demo'],
    setup_steps: ['Confirm owners', 'Collect system access', 'Create shared launch tracker'],
    recommended_actions: ['Schedule kickoff', 'Assign internal owners', 'Send welcome sequence'],
  }
}

function buildCustomOutput(data) {
  return {
    summary: `${data.title} was converted into a traceable operations plan.`,
    confidence: data.status === 'failed' ? 0.42 : 0.82,
    workflow_steps: ['Extract request', 'Identify owners', 'Plan next actions', 'Prepare review summary'],
    review_notes:
      data.status === 'failed'
        ? ['Missing account ID and priority prevented safe automation after retry']
        : ['Ready for operator review before customer-facing follow-up'],
    recommended_actions:
      data.status === 'failed'
        ? ['Ask the requester for account ID, priority, and owner before rerunning']
        : ['Confirm inputs', 'Run the scoped workflow', 'Review output with an operator'],
  }
}

function buildOutput(taskType, data) {
  if (taskType === 'lead') return buildLeadOutput(data)
  if (taskType === 'contract') return buildContractOutput(data)
  if (taskType === 'onboard') return buildOnboardingOutput(data)
  return buildCustomOutput(data)
}

function buildTrace(taskType, finalOutput, status = 'success') {
  const events = (nodeSummaries[taskType] || nodeSummaries.custom).map(([node, summary], index) => ({
    event: 'node_start',
    node,
    action: summary,
    output: { summary, confidence: Number((0.86 + index * 0.015).toFixed(2)) },
  }))
  events.push({
    event: 'complete',
    status,
    output: finalOutput,
  })
  return events
}

export function createShowcaseTask(data, index = 0) {
  const taskType = taskTypeFromHint(data.task_type_hint)
  const status = data.status || 'success'
  const finalOutput = buildOutput(taskType, { ...data, status })
  const id = `demo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

  return {
    id,
    title: data.title,
    description: data.description,
    task_type_hint: data.task_type_hint || taskType,
    task_type: taskType,
    status,
    retry_count: data.retry_count || 0,
    duration_ms: 1840 + index * 260,
    cost_usd: 0.0042 + index * 0.0006,
    created_at: timestamp(data.minutesAgo ?? index * 42),
    execution_trace: buildTrace(taskType, finalOutput, status),
    final_output: finalOutput,
    validation_errors: data.validation_errors || [],
  }
}

export function seedShowcaseTasks() {
  return seededTasks.map((task, index) => createShowcaseTask(task, index))
}

function readStoredTasks() {
  if (typeof localStorage === 'undefined') return null
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  if (stored?.version === STORAGE_VERSION && Array.isArray(stored.tasks)) return stored.tasks
  return null
}

function readTasks() {
  const stored = readStoredTasks()
  if (stored) return stored
  const seeded = seedShowcaseTasks()
  writeTasks(seeded)
  return seeded
}

function writeTasks(tasks) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, tasks }))
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
    recent_tasks: tasks.slice(0, 9),
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
