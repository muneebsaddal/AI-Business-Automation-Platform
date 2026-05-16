import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, CheckCircle2, FileDown, RefreshCcw, Repeat2, ShieldCheck } from 'lucide-react'
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { exportTrace, getTask, rerunTask } from '../api/tasks'
import AgentGraph from '../components/AgentGraph/AgentGraph'
import ExecutionTrace from '../components/ExecutionTrace/ExecutionTrace'
import OutputPanel from '../components/OutputPanel/OutputPanel'
import ValidationErrors from '../components/ValidationErrors/ValidationErrors'
import { isShowcaseMode } from '../config/showcase'
import { useWebSocket } from '../hooks/useWebSocket'

const terminalStatuses = new Set(['success', 'failed', 'escalated'])

function statusClass(status) {
  if (status === 'success') return 'bg-signal/10 text-signal'
  if (status === 'failed') return 'bg-ember/10 text-ember'
  if (status === 'escalated') return 'bg-amber-100 text-amber-800'
  return 'bg-paper text-steel'
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const pipelineSteps = [
  'Classify request',
  'Structure details',
  'Plan work',
  'Execute tools',
  'Validate output',
]

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const taskQuery = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      terminalStatuses.has(query.state.data?.status) ? false : 3000,
  })

  const task = taskQuery.data
  const isTerminal = terminalStatuses.has(task?.status)
  const handleComplete = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['task', id] }),
    [id, queryClient],
  )
  const { events, connectionState } = useWebSocket(id, {
    enabled: Boolean(!isShowcaseMode && id && task && !isTerminal),
    onComplete: handleComplete,
  })

  const completeEvent = [...events].reverse().find((event) => event.event === 'complete')
  const output = completeEvent?.output || task?.final_output
  const validationErrors = task?.validation_errors || []
  const traceEvents = [...(task?.execution_trace || []), ...events]
  const status = completeEvent?.status || task?.status || 'pending'

  const rerunMutation = useMutation({
    mutationFn: rerunTask,
    onSuccess: (data) => {
      toast.success('Replay queued')
      navigate(`/tasks/${data.task_id}`)
    },
  })

  const handleExport = async () => {
    const data = await exportTrace(id)
    downloadJson(`${id}_trace.json`, data)
  }

  const handleReplay = () => {
    if (window.confirm(`Replay "${task.title}" as a new task?`)) {
      rerunMutation.mutate(task.id)
    }
  }

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
          <Link className="inline-flex items-center gap-2 text-sm font-medium text-steel" to="/tasks">
            <ArrowLeft size={15} />
            Back to history
          </Link>
          <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="min-w-0 max-w-full break-words text-3xl font-normal">{task.title}</h2>
            <span className={`status-pill ${statusClass(status)}`}>
              {status}
            </span>
          </div>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-steel">{task.description}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-steel">
            Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })} · Type{' '}
            {task.task_type || task.task_type_hint}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="action-secondary"
            type="button"
            onClick={() => taskQuery.refetch()}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
          <button
            className="action-secondary"
            type="button"
            onClick={handleExport}
          >
            <FileDown size={16} />
            Export
          </button>
          <button
            className="action-primary"
            type="button"
            disabled={rerunMutation.isPending}
            onClick={handleReplay}
          >
            <Repeat2 size={16} />
            Replay
          </button>
        </div>
      </div>

      {isShowcaseMode && (
        <section className="surface-soft p-5">
          <p className="eyebrow">Audit room</p>
          <h3 className="mt-2 text-xl font-normal">Business answer, technical evidence.</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {pipelineSteps.map((step) => (
              <span
                key={step}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink"
              >
                <CheckCircle2 className="text-signal" size={14} />
                {step}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-steel">Connection</p>
          <p className="metric-value mt-2 truncate text-lg capitalize">
            {isShowcaseMode ? 'showcase' : connectionState}
          </p>
        </div>
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-steel">Retries</p>
          <p className="metric-value mt-2 text-lg">{task.retry_count}</p>
        </div>
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-steel">Duration</p>
          <p className="metric-value mt-2 text-lg">{task.duration_ms || 0} ms</p>
        </div>
        <div className="surface p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-steel">Cost</p>
          <p className="metric-value mt-2 text-lg">${Number(task.cost_usd || 0).toFixed(4)}</p>
        </div>
      </div>

      <section className="surface grid gap-4 p-5 lg:grid-cols-[240px_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-signal" size={18} />
            <p className="eyebrow">Governance</p>
          </div>
          <h3 className="mt-2 text-lg font-medium">Human review checkpoints</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {['Trace captured', 'Validation schema applied', 'Replay/export available'].map((item) => (
            <div key={item} className="rounded-xl border border-line bg-panel/70 p-3 text-sm font-medium">
              <CheckCircle2 className="mb-3 text-signal" size={17} />
              {item}
            </div>
          ))}
        </div>
      </section>

      <AgentGraph events={traceEvents} taskStatus={status} />
      <ValidationErrors errors={validationErrors} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <ExecutionTrace events={traceEvents} />
        <OutputPanel output={output} />
      </div>
    </section>
  )
}
