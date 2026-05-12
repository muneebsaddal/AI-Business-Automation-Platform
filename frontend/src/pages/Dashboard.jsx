import { useMutation, useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ArrowRight, BadgeCheck, Clock3, DollarSign, Layers3, Play, Sparkles } from 'lucide-react'
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
import { getRecommendedShowcaseTemplate, showcaseTemplates } from '../api/showcaseApi'
import { isShowcaseMode } from '../config/showcase'

const typeColors = ['#1f5cff', '#7aa7ff', '#17325f', '#5d6f8f', '#b45309']

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
    <div className="border border-line bg-white p-5 shadow-panel">
      <Icon className="text-signal" size={20} />
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      <p className="text-sm text-steel">{label}</p>
    </div>
  )
}

function TemplateCard({ template }) {
  return (
    <Link
      className="group flex min-h-44 flex-col justify-between border border-line bg-white p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-signal"
      to={`/tasks/new?template=${template.id}`}
    >
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-signal">
            {template.task_type_hint}
          </span>
          {template.recommended && <Sparkles className="text-signal" size={18} />}
        </div>
        <h3 className="text-lg font-semibold">{template.label}</h3>
        <p className="mt-2 text-sm leading-6 text-steel">{template.customer_value}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-signal">
        Use template <ArrowRight size={15} />
      </span>
    </Link>
  )
}

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
        <section className="overflow-hidden border border-line bg-white shadow-panel">
          <div className="border-t-4 border-signal p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-end">
              <div>
                <p className="w-fit rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-signal">
                  Public showcase
                </p>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight">
                  Turn messy business requests into traceable automation runs
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-steel">
                  Choose a real workflow, run it instantly, then inspect how each agent classified,
                  structured, planned, executed, and validated the result.
                </p>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded bg-signal px-5 py-3 text-sm font-semibold text-white shadow-panel disabled:opacity-60"
                type="button"
                disabled={recommendedMutation.isPending}
                onClick={() => recommendedMutation.mutate()}
              >
                {recommendedMutation.isPending ? 'Running demo...' : 'Run recommended demo'}
                <Play size={16} />
              </button>
            </div>

            <div className="mt-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">
                Start with a workflow
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {showcaseTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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
          className="inline-flex items-center gap-2 rounded bg-signal px-4 py-2 text-sm font-semibold text-white"
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
        <section className="border border-line bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">
                Volume
              </p>
              <h3 className="mt-1 text-xl font-semibold">Recent task submissions</h3>
            </div>
            {analyticsQuery.isFetching && <span className="text-xs text-steel">Refreshing</span>}
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid stroke="#bfd4ff" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1f5cff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="border border-line bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Types</p>
          <h3 className="mt-1 text-xl font-semibold">Task breakdown</h3>
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

      <section className="border border-line bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Recent</p>
            <h3 className="mt-1 text-xl font-semibold">Latest tasks</h3>
          </div>
          <Link className="text-sm font-semibold text-ink underline" to="/tasks">
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
                <p className="font-semibold">{task.title}</p>
                <p className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-steel">
                  {task.description}
                </p>
              </div>
              <span>{task.task_type || task.task_type_hint}</span>
              <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ${statusClass(task.status)}`}>
                {task.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}
