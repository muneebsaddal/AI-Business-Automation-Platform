import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react'

const nodes = [
  'IntentClassifier',
  'IRGenerator',
  'IRValidator',
  'SchemaResolver',
  'Planner',
  'Executor',
  'Validator',
  'Output',
]

const terminalStatuses = new Set(['success', 'failed', 'escalated'])

function eventNode(event) {
  return event.node || event.agent || null
}

function nodeState(node, activeNode, completedNodes, failedNode, isComplete) {
  if (isComplete && completedNodes.has(node)) return 'done'
  if (failedNode && node === failedNode) return 'failed'
  if (node === activeNode) return 'active'
  if (completedNodes.has(node)) return 'done'
  return 'pending'
}

function StatusIcon({ state }) {
  if (state === 'active') return <Loader2 className="animate-spin text-signal" size={16} />
  if (state === 'done') return <CheckCircle2 className="text-signal" size={16} />
  if (state === 'failed') return <XCircle className="text-ember" size={16} />
  return <Circle className="text-steel" size={16} />
}

export default function AgentGraph({ events = [], taskStatus }) {
  const normalizedStatus = String(taskStatus || '').trim().toLowerCase()
  const completeEventStatus = String(
    [...events].reverse().find((event) => event.event === 'complete')?.status || '',
  )
    .trim()
    .toLowerCase()
  const effectiveStatus = completeEventStatus || normalizedStatus
  const nodeEvents = events.filter((event) => event.event === 'node_start' && event.node)
  const loggedNodes = events.map(eventNode).filter(Boolean)
  const activeNode = nodeEvents.at(-1)?.node || null
  const completedNodes = new Set(loggedNodes.filter((node) => nodes.includes(node)))
  const isTerminal = terminalStatuses.has(effectiveStatus)
  const isComplete = effectiveStatus === 'success' || effectiveStatus === 'escalated'
  const failedEvent = [...events].reverse().find((event) => event.error)
  const failedNode = effectiveStatus === 'failed' ? eventNode(failedEvent) || activeNode : null

  if (isTerminal) {
    completedNodes.add('IntentClassifier')
    nodeEvents.forEach((event) => completedNodes.add(event.node))
  }
  if (isComplete) {
    nodes.forEach((node) => completedNodes.add(node))
    completedNodes.add('Output')
  }

  return (
    <section className="min-w-0 border border-line bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Agent graph</p>
          <h3 className="mt-1 text-xl font-semibold">Execution path</h3>
        </div>
        <span className="rounded bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-steel">
          {taskStatus || 'pending'}
        </span>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {nodes.map((node, index) => {
          const state = nodeState(node, activeNode, completedNodes, failedNode, isComplete)
          return (
            <div
              key={node}
              className={[
                'min-h-20 min-w-0 border p-3 transition',
                state === 'active' ? 'border-signal bg-signal/10' : 'border-line bg-paper',
                state === 'failed' ? 'border-ember bg-ember/10' : '',
                state === 'done' ? 'border-signal/40 bg-white' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-steel">{String(index + 1).padStart(2, '0')}</span>
                <StatusIcon state={state} />
              </div>
              <p className="mt-3 text-sm font-semibold">{node}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
