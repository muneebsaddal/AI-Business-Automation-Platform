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

  assert.equal(analytics.total_tasks, 9)
  assert.equal(analytics.by_type.lead, 3)
  assert.equal(analytics.by_type.contract, 2)
  assert.equal(analytics.by_type.onboard, 2)
  assert.equal(analytics.by_type.custom, 2)
  assert.equal(analytics.success_rate, 8 / 9)
  assert.equal(analytics.recent_tasks.length, 9)
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
