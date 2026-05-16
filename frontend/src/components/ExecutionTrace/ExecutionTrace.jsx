import { CheckCircle2, ChevronDown, CircleDot, XCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'

const nodeLabels = {
  IntentClassifier: 'Understood the request type',
  IRGenerator: 'Pulled out the useful business details',
  IRValidator: 'Checked the extracted details',
  SchemaResolver: 'Chose the right output format',
  Planner: 'Planned the work steps',
  Executor: 'Ran the workflow tools',
  Validator: 'Checked the final answer',
  Output: 'Prepared the result',
}

function eventTitle(event) {
  if (event.event === 'node_start') return nodeLabels[event.node] || `${event.node} started`
  if (event.event === 'validation_error') return `Needs review: ${event.field}`
  if (event.event === 'complete') return `Completed with status ${event.status}`
  return event.action || event.event
}

function eventSummary(event) {
  if (event.action) return event.action
  if (event.output?.summary) return event.output.summary
  if (event.event === 'complete') return 'The final output was validated and saved for review.'
  return 'The automation recorded this step for auditability.'
}

function EventIcon({ event }) {
  if (event.error || event.status === 'failed') return <XCircle className="text-ember" size={18} />
  if (event.event === 'complete') return <CheckCircle2 className="text-signal" size={18} />
  return <CircleDot className="text-signal" size={18} />
}

export default function ExecutionTrace({ events = [] }) {
  const endRef = useRef(null)

  useEffect(() => {
    const container = endRef.current?.parentElement
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [events])

  return (
    <section className="surface min-w-0 p-5">
      <p className="eyebrow">Automation path</p>
      <h3 className="mt-1 text-xl font-normal">What happened step by step</h3>
      <p className="mt-2 text-sm leading-6 text-steel">
        This is the readable audit trail. Open technical event data only when you want to inspect
        the exact payload.
      </p>

      <div className="mt-5 max-h-[520px] space-y-3 overflow-auto pr-2">
        {events.length === 0 && (
          <p className="text-sm leading-6 text-steel">Waiting for live agent events...</p>
        )}
        {events.map((event, index) => (
          <article key={`${event.event}-${index}`} className="min-w-0 rounded-xl border border-line bg-panel/70 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <EventIcon event={event} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{eventTitle(event)}</p>
                    <p className="mt-1 text-sm leading-6 text-steel">{eventSummary(event)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 font-mono text-xs font-medium text-steel">
                    {index + 1}
                  </span>
                </div>

                <details className="mt-3 group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-signal">
                    <ChevronDown className="transition group-open:rotate-180" size={14} />
                    Technical event
                  </summary>
                  <pre className="mt-3 max-w-full overflow-auto whitespace-pre-wrap break-words border border-line bg-white p-3 text-xs leading-5 text-ink">
                    {JSON.stringify(event.output || event, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </article>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  )
}
