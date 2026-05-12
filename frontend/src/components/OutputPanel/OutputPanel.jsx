import { Clipboard, Code2, FileText } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { formatBusinessOutput } from './outputFormatters'

function ResultSection({ section }) {
  if (!section.items?.length) return null
  return (
    <div className="border border-line bg-white p-4">
      <h4 className="font-semibold">{section.title}</h4>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-steel">
        {section.items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function OutputPanel({ output }) {
  const [view, setView] = useState('summary')
  const text = JSON.stringify(output || {}, null, 2)
  const result = formatBusinessOutput(output || {})

  const copyOutput = async () => {
    await navigator.clipboard.writeText(text)
    toast.success('Output copied')
  }

  return (
    <section className="min-w-0 border border-line bg-white p-5 shadow-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Result</p>
          <h3 className="mt-1 text-xl font-semibold">Business-readable output</h3>
          <p className="mt-2 text-sm leading-6 text-steel">
            The raw JSON is still available, but the default view explains what the automation
            found and what to do next.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            className={[
              'inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold',
              view === 'summary' ? 'border-signal bg-panel text-signal' : 'border-line bg-white',
            ].join(' ')}
            type="button"
            onClick={() => setView('summary')}
          >
            <FileText size={15} />
            Summary
          </button>
          <button
            className={[
              'inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-semibold',
              view === 'json' ? 'border-signal bg-panel text-signal' : 'border-line bg-white',
            ].join(' ')}
            type="button"
            onClick={() => setView('json')}
          >
            <Code2 size={15} />
            JSON
          </button>
        </div>
      </div>

      {view === 'summary' ? (
        <div className="mt-5 space-y-5">
          <div className="border border-line bg-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">
              {result.eyebrow}
            </p>
            <h4 className="mt-2 text-2xl font-semibold leading-tight">{result.headline}</h4>
            <p className="mt-3 text-sm leading-7 text-steel">{result.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {result.metrics.map((metric) => (
              <div key={metric.label} className="border border-line bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">
                  {metric.label}
                </p>
                <p className="mt-2 text-xl font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>

          {result.details.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.details.map((detail) => (
                <div key={detail.label} className="border border-line bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-steel">
                    {detail.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{detail.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            {result.sections.map((section) => (
              <ResultSection key={section.title} section={section} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div className="mb-3 flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-semibold"
              type="button"
              onClick={copyOutput}
            >
              <Clipboard size={15} />
              Copy JSON
            </button>
          </div>
          <pre className="max-h-[420px] max-w-full overflow-auto whitespace-pre-wrap break-words border border-line bg-paper p-4 text-xs leading-5 text-ink">
            {text}
          </pre>
        </div>
      )}
    </section>
  )
}
