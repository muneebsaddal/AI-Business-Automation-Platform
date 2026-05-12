import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createShowcaseTask,
  getRecommendedShowcaseTemplate,
  getShowcaseAnalytics,
  showcaseTemplates,
  seedShowcaseTasks,
} from './showcaseApi.js'

test('creates a completed lead qualification task with traceable output', () => {
  const task = createShowcaseTask({
    title: 'Qualify Acme Logistics inbound lead',
    description:
      'Qualify this inbound lead: Acme Logistics, contact Sarah Khan, operations director.',
    task_type_hint: 'lead',
  })

  assert.equal(task.status, 'success')
  assert.equal(task.task_type, 'lead')
  assert.ok(task.execution_trace.length >= 7)
  assert.equal(task.final_output.lead.company, 'Acme Logistics')
  assert.equal(task.validation_errors.length, 0)
})

test('summarizes seeded tasks for the dashboard', () => {
  const analytics = getShowcaseAnalytics(seedShowcaseTasks())

  assert.ok(analytics.total_tasks >= 10)
  assert.ok(analytics.by_type.lead >= 1)
  assert.ok(analytics.by_type.contract >= 1)
  assert.ok(analytics.by_type.onboard >= 1)
  assert.ok(analytics.by_type.custom >= 1)
  assert.ok((analytics.by_status.escalated || 0) >= 1)
  assert.ok((analytics.by_status.failed || 0) >= 1)
  assert.ok(analytics.success_rate > 0.7)
  assert.equal(analytics.recent_tasks.length, 6)
})

test('exposes a recommended template that creates a traceable task', () => {
  const recommended = getRecommendedShowcaseTemplate()
  const task = createShowcaseTask(recommended)

  assert.equal(recommended.recommended, true)
  assert.equal(task.task_type, recommended.task_type_hint)
  assert.ok(task.execution_trace.length >= 7)
  assert.ok(task.final_output)
  assert.ok(showcaseTemplates.length >= 4)
})
