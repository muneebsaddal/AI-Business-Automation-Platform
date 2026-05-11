import { Clipboard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OutputPanel({ output }) {
  const text = JSON.stringify(output || {}, null, 2)

  const copyOutput = async () => {
    await navigator.clipboard.writeText(text)
    toast.success('Output copied')
  }

  return (
    <section className="border border-line bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Output</p>
          <h3 className="mt-1 text-xl font-semibold">Validated result</h3>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded border border-line bg-paper px-3 py-2 text-sm font-semibold"
          type="button"
          onClick={copyOutput}
        >
          <Clipboard size={15} />
          Copy
        </button>
      </div>
      <pre className="mt-4 max-h-[420px] overflow-auto border border-line bg-paper p-4 text-xs leading-5 text-ink">
        {text}
      </pre>
    </section>
  )
}

