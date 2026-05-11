import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { getTask } from '../api/tasks'
import AgentGraph from '../components/AgentGraph/AgentGraph'
import ExecutionTrace from '../components/ExecutionTrace/ExecutionTrace'
import OutputPanel from '../components/OutputPanel/OutputPanel'
import ValidationErrors from '../components/ValidationErrors/ValidationErrors'
import { useWebSocket } from '../hooks/useWebSocket'

const terminalStatuses = new Set(['success', 'failed', 'escalated'])

function statusClass(status) {
  if (status === 'success') return 'bg-signal/10 text-signal'
  if (status === 'failed') return 'bg-ember/10 text-ember'
  if (status === 'escalated') return 'bg-amber-100 text-amber-800'
  return 'bg-paper text-steel'
}

export default function TaskDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const taskQuery = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id),
    enabled: Boolean(id),
  })

  const task = taskQuery.data
  const isTerminal = terminalStatuses.has(task?.status)
  const { events, connectionState } = useWebSocket(id, {
    enabled: Boolean(id && task && !isTerminal),
    onComplete: () => queryClient.invalidateQueries({ queryKey: ['task', id] }),
  })

  const completeEvent = [...events].reverse().find((event) => event.event === 'complete')
  const output = completeEvent?.output || task?.final_output
  const validationErrors = task?.validation_errors || []
  const traceEvents = [...(task?.execution_trace || []), ...events]
  const status = completeEvent?.status || task?.status || 'pending'

  if (taskQuery.isLoading) {
    return <p className="text-sm text-steel">Loading task...</p>
  }

  if (taskQuery.isError) {
    return (
      <section className="border border-ember/30 bg-ember/10 p-5 text-ember">
        Could not load this task.
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-steel" to="/tasks">
            <ArrowLeft size={15} />
            Back to history
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold">{task.title}</h2>
            <span className={`rounded px-3 py-1 text-xs font-semibold uppercase ${statusClass(status)}`}>
              {status}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">{task.description}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-steel">
            Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })} · Type{' '}
            {task.task_type || task.task_type_hint}
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
          type="button"
          onClick={() => taskQuery.refetch()}
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">Connection</p>
          <p className="mt-2 text-lg font-semibold">{connectionState}</p>
        </div>
        <div className="border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">Retries</p>
          <p className="mt-2 text-lg font-semibold">{task.retry_count}</p>
        </div>
        <div className="border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">Duration</p>
          <p className="mt-2 text-lg font-semibold">{task.duration_ms || 0} ms</p>
        </div>
        <div className="border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">Cost</p>
          <p className="mt-2 text-lg font-semibold">${Number(task.cost_usd || 0).toFixed(4)}</p>
        </div>
      </div>

      <AgentGraph events={traceEvents} taskStatus={status} />
      <ValidationErrors errors={validationErrors} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <ExecutionTrace events={traceEvents} />
        <OutputPanel output={output} />
      </div>
    </section>
  )
}
