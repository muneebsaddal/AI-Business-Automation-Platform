import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Clock3, DollarSign, Layers3 } from 'lucide-react'

const stats = [
  { label: 'Total tasks', value: '0', icon: Layers3 },
  { label: 'Success rate', value: '0%', icon: BadgeCheck },
  { label: 'Avg duration', value: '0 ms', icon: Clock3 },
  { label: 'Cost tracked', value: '$0.00', icon: DollarSign },
]

export default function Dashboard() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">
            Operations cockpit
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Live agent workbench</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
            Submit lead qualification work, watch the agent pipeline execute, and keep every
            decision traceable.
          </p>
        </div>
        <Link
          to="/tasks/new"
          className="inline-flex items-center gap-2 rounded bg-ink px-4 py-2 text-sm font-semibold text-paper"
        >
          New task <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-line bg-white p-5 shadow-panel">
            <stat.icon className="text-signal" size={20} />
            <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-steel">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
