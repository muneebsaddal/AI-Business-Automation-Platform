import assert from 'node:assert/strict'
import test from 'node:test'

import { formatBusinessOutput } from './outputFormatters.js'

test('formats lead output as a client-readable business result', () => {
  const result = formatBusinessOutput({
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
      reasons: ['Clear operations pain', 'Budget is realistic'],
      risks: ['Confirm CRM access'],
    },
    recommended_actions: ['Book a 45-minute technical discovery demo'],
  })

  assert.equal(result.kind, 'lead')
  assert.equal(result.headline, 'Book a 45-minute technical discovery demo')
  assert.equal(result.metrics[0].label, 'Lead score')
  assert.equal(result.metrics[0].value, '91 / 100')
  assert.ok(result.summary.includes('Acme Logistics'))
  assert.ok(result.sections.some((section) => section.title === 'Why this lead is qualified'))
})

test('formats contract output without exposing raw JSON first', () => {
  const result = formatBusinessOutput({
    summary: 'Renewal is ready for review.',
    risk_level: 'medium',
    confidence: 0.87,
    flags: ['Confirm termination language'],
    recommended_actions: ['Send flagged clauses to legal review'],
  })

  assert.equal(result.kind, 'contract')
  assert.equal(result.headline, 'Send flagged clauses to legal review')
  assert.equal(result.metrics[0].label, 'Risk level')
  assert.equal(result.metrics[0].value, 'medium')
})
