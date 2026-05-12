import assert from 'node:assert/strict'
import test from 'node:test'

import { createShowcaseTask, getShowcaseAnalytics, seedShowcaseTasks } from './showcaseApi.js'

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

  assert.equal(analytics.total_tasks, 4)
  assert.equal(analytics.by_type.lead, 2)
  assert.ok(analytics.success_rate > 0.7)
  assert.equal(analytics.recent_tasks.length, 4)
})
