import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Database,
  DollarSign,
  FileCheck2,
  GitBranch,
  Layers3,
  Play,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getAnalytics, submitTask } from '../api/tasks'
import { getRecommendedShowcaseTemplate } from '../api/showcaseApi'
import { isShowcaseMode } from '../config/showcase'

const typeColors = [
  'oklch(58% 0.18 255)',
  'oklch(64% 0.14 245)',
  'oklch(70% 0.11 235)',
  'oklch(52% 0.15 265)',
  'oklch(78% 0.08 225)',
]

function buildVolumeData(tasks = []) {
  const grouped = {}
  tasks.forEach((task) => {
    const day = format(new Date(task.created_at), 'MMM d')
    grouped[day] = (grouped[day] || 0) + 1
  })
  return Object.entries(grouped).map(([date, count]) => ({ date, count }))
}

function buildTypeData(byType = {}) {
  return Object.entries(byType).map(([name, value]) => ({ name, value }))
}

function statusClass(status) {
  if (status === 'success') return 'bg-signal/10 text-signal'
  if (status === 'failed') return 'bg-ember/10 text-ember'
  if (status === 'escalated') return 'bg-amber-100 text-amber-800'
  return 'bg-paper text-steel'
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <Icon className="text-signal" size={20} />
        <span className="h-2 w-2 rounded-full bg-mint" />
      </div>
      <p className="metric-value mt-4 text-2xl">{value}</p>
      <p className="text-sm text-steel">{label}</p>
    </div>
  )
}

const contractSteps = [
  ['Intake', 'Business request', Workflow],
  ['Plan', 'Agent graph', GitBranch],
  ['Execute', 'Tool events', Database],
  ['Validate', 'Checked output', FileCheck2],
  ['Deliver', 'Replay + export', ShieldCheck],
]

const emptyAnalytics = {
  total_tasks: 0,
  success_rate: 0,
  avg_duration_ms: 0,
  total_cost_usd: 0,
  by_status: {},
  by_type: {},
  recent_tasks: [],
}

const statConfig = [
  ['Total tasks', 'total_tasks', Layers3],
  ['Success rate', 'success_rate', BadgeCheck],
  ['Avg duration', 'avg_duration_ms', Clock3],
  ['Cost tracked', 'total_cost_usd', DollarSign],
]

export default function Dashboard() {
  const navigate = useNavigate()
  const analyticsQuery = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
    staleTime: 60_000,
  })
  const analytics = analyticsQuery.data || emptyAnalytics
  const volumeData = buildVolumeData(analytics.recent_tasks)
  const typeData = buildTypeData(analytics.by_type)
  const statValues = {
    total_tasks: analytics.total_tasks,
    success_rate: `${Math.round((analytics.success_rate || 0) * 100)}%`,
    avg_duration_ms: `${Math.round(analytics.avg_duration_ms || 0)} ms`,
    total_cost_usd: `$${Number(analytics.total_cost_usd || 0).toFixed(4)}`,
  }
  const recommendedTemplate = getRecommendedShowcaseTemplate()
  const recommendedMutation = useMutation({
    mutationFn: () => submitTask(recommendedTemplate),
    onSuccess: (data) => navigate(`/tasks/${data.task_id}`),
  })

  return (
    <section className="space-y-6">
      {isShowcaseMode && (
        <section className="surface overflow-hidden border-line/80 bg-white/95">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_470px]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div>
                <p className="w-fit rounded-full border border-line bg-panel/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-steel">
                  Agent orchestration platform
                </p>
                <h2 className="mt-5 max-w-4xl text-4xl font-light leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
                  Enterprise control for multi-agent AI systems
                </h2>
                <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
                  {[
                    ['Brief', 'plain-language intake'],
                    ['Graph', 'agent + tool path'],
                    ['Replay', 'auditable reruns'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-xl border border-line bg-panel/55 p-3">
                      <p className="text-lg font-normal text-ink">{value}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-steel">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="action-primary mt-7 px-5 py-3"
                type="button"
                disabled={recommendedMutation.isPending}
                onClick={() => recommendedMutation.mutate()}
              >
                {recommendedMutation.isPending ? 'Running demo...' : 'Run recommended demo'}
                <Play size={16} />
              </button>
            </div>

            <div className="border-t border-line bg-panel/60 p-6 xl:border-l xl:border-t-0 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-steel">Execution contract</p>
                <span className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-steel">observable</span>
              </div>
              <div className="mt-6 rounded-2xl border border-line bg-white p-4">
                <div className="space-y-3">
                  {contractSteps.map(([step, detail, Icon], index) => (
                    <div key={step} className="contract-step">
                      <div className="grid h-9 w-9 place-items-center rounded-full border border-line bg-panel text-signal">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{step}</p>
                        <p className="text-xs leading-5 text-steel">{detail}</p>
                      </div>
                      <span className="ml-auto font-mono text-[11px] text-steel">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-signal/25 bg-signal/5 p-3">
                  <p className="text-sm font-medium text-ink">Customer sees the outcome.</p>
                  <p className="mt-1 text-xs leading-5 text-steel">Your team can open the graph, payload, validation log, and replay controls.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Operations cockpit</p>
          <h2 className="mt-2 text-3xl font-normal">Live orchestration command center</h2>
          <p className="mt-2 max-w-2xl text-sm text-steel">Throughput, cost, workflow mix, and latest agent decisions.</p>
        </div>
        <Link
          to="/tasks/new"
          className="action-primary"
        >
          New task <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {statConfig.map(([label, key, Icon]) => (
          <StatCard key={key} label={label} value={statValues[key]} icon={Icon} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Volume</p>
              <h3 className="mt-1 text-xl font-normal">Recent task submissions</h3>
            </div>
            {analyticsQuery.isFetching && <span className="text-xs text-steel">Refreshing</span>}
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid stroke="oklch(92% 0.005 250)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="oklch(58% 0.18 255)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface p-5">
          <p className="eyebrow">Types</p>
          <h3 className="mt-1 text-xl font-normal">Task breakdown</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={96} label>
                  {typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={typeColors[index % typeColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Recent</p>
            <h3 className="mt-1 text-xl font-normal">Latest orchestration runs</h3>
          </div>
          <Link className="text-sm font-medium text-ink underline" to="/tasks">
            View all
          </Link>
        </div>
        <div className="mt-4 divide-y divide-line">
          {analytics.recent_tasks.length === 0 && (
            <p className="py-4 text-sm text-steel">No tasks yet. Queue the demo lead to populate this view.</p>
          )}
          {analytics.recent_tasks.map((task) => (
            <Link
              key={task.id}
              className="grid min-w-0 gap-3 py-4 text-sm hover:bg-paper md:grid-cols-[minmax(0,1fr)_120px_120px]"
              to={`/tasks/${task.id}`}
            >
              <div className="min-w-0">
                <p className="font-medium">{task.title}</p>
                <p className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-steel">
                  {task.description}
                </p>
              </div>
              <span className="text-xs uppercase text-steel">{task.task_type || task.task_type_hint}</span>
              <span className={`status-pill ${statusClass(task.status)}`}>
                {task.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}
