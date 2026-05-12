function percent(value) {
  if (typeof value !== 'number') return 'n/a'
  return `${Math.round(value * 100)}%`
}

function currency(value) {
  if (typeof value !== 'number') return 'Not specified'
  return `$${value.toLocaleString()}`
}

function titleCase(value) {
  return String(value || 'n/a')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function firstAction(output) {
  return output?.recommended_actions?.[0] || 'Review the validated result'
}

function listSection(title, items = []) {
  return { title, items: items.filter(Boolean) }
}

function formatLeadOutput(output) {
  const lead = output.lead || {}
  const qualification = output.qualification || {}
  const company = lead.company || 'This lead'

  return {
    kind: 'lead',
    eyebrow: 'Qualified lead result',
    headline: firstAction(output),
    summary: `${company} is a ${titleCase(qualification.fit)}-fit lead with a ${qualification.score || 'review'} score. The automation found clear buying context and produced a next action a sales team can review immediately.`,
    metrics: [
      { label: 'Lead score', value: `${qualification.score || 0} / 100` },
      { label: 'Fit', value: titleCase(qualification.fit) },
      { label: 'Confidence', value: percent(qualification.confidence) },
      { label: 'Budget', value: currency(lead.budget_usd) },
    ],
    details: [
      { label: 'Company', value: lead.company },
      { label: 'Contact', value: lead.contact },
      { label: 'Role', value: lead.role },
      { label: 'Timeline', value: lead.timeline },
      { label: 'Requested next step', value: lead.requested_next_step },
    ].filter((item) => item.value !== undefined && item.value !== null),
    sections: [
      listSection('Why this lead is qualified', qualification.reasons),
      listSection('Risks to confirm', qualification.risks),
      listSection('Recommended actions', output.recommended_actions),
    ],
  }
}

function formatContractOutput(output) {
  return {
    kind: 'contract',
    eyebrow: 'Contract review result',
    headline: firstAction(output),
    summary: output.summary || 'The contract was reviewed and converted into risk-focused next steps.',
    metrics: [
      { label: 'Risk level', value: output.risk_level || 'n/a' },
      { label: 'Confidence', value: percent(output.confidence) },
      { label: 'Flags found', value: String(output.flags?.length || 0) },
    ],
    details: [],
    sections: [
      listSection('Key terms checked', output.key_terms),
      listSection('Flags for review', output.flags),
      listSection('Recommended actions', output.recommended_actions),
    ],
  }
}

function formatOnboardingOutput(output) {
  return {
    kind: 'onboard',
    eyebrow: 'Onboarding runbook result',
    headline: firstAction(output),
    summary: output.summary || 'The client brief was converted into an onboarding plan.',
    metrics: [
      { label: 'Confidence', value: percent(output.confidence) },
      { label: 'Milestones', value: String(output.milestones?.length || 0) },
      { label: 'Setup steps', value: String(output.setup_steps?.length || 0) },
    ],
    details: [],
    sections: [
      listSection('Milestones', output.milestones),
      listSection('Setup steps', output.setup_steps),
      listSection('Recommended actions', output.recommended_actions),
    ],
  }
}

function formatCustomOutput(output) {
  return {
    kind: 'custom',
    eyebrow: 'Operations workflow result',
    headline: firstAction(output),
    summary: output.summary || 'The request was converted into a traceable operations plan.',
    metrics: [
      { label: 'Confidence', value: percent(output.confidence) },
      { label: 'Workflow steps', value: String(output.workflow_steps?.length || 0) },
      { label: 'Review notes', value: String(output.review_notes?.length || 0) },
    ],
    details: [],
    sections: [
      listSection('Workflow steps', output.workflow_steps),
      listSection('Review notes', output.review_notes),
      listSection('Recommended actions', output.recommended_actions),
    ],
  }
}

export function formatBusinessOutput(output = {}) {
  if (output.lead || output.qualification) return formatLeadOutput(output)
  if (output.risk_level || output.flags || output.key_terms) return formatContractOutput(output)
  if (output.milestones || output.setup_steps) return formatOnboardingOutput(output)
  return formatCustomOutput(output)
}
