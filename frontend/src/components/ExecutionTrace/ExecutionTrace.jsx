import { useEffect, useRef } from 'react'

function eventTitle(event) {
  if (event.event === 'node_start') return `${event.node} started`
  if (event.event === 'validation_error') return `Validation error: ${event.field}`
  if (event.event === 'complete') return `Completed with status ${event.status}`
  return `${event.agent || 'Agent'}: ${event.action || event.event}`
}

export default function ExecutionTrace({ events = [] }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [events])

  return (
    <section className="min-w-0 border border-line bg-ink p-5 text-paper shadow-panel">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8bd8cf]">Trace</p>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-auto pr-2">
        {events.length === 0 && (
          <p className="text-sm leading-6 text-paper/70">Waiting for live agent events...</p>
        )}
        {events.map((event, index) => (
          <article key={`${event.event}-${index}`} className="min-w-0 border border-white/10 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{eventTitle(event)}</p>
              <span className="shrink-0 text-xs text-paper/50">{index + 1}</span>
            </div>
            <pre className="mt-2 max-w-full overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-paper/65">
              {JSON.stringify(event.output || event, null, 2)}
            </pre>
          </article>
        ))}
        <div ref={endRef} />
      </div>
    </section>
  )
}
