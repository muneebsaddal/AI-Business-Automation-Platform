import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Eye, FileDown, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import { deleteTask, exportTrace, listTasks, rerunTask } from '../api/tasks'

const statusOptions = ['all', 'pending', 'running', 'success', 'failed', 'retried', 'escalated']
const typeOptions = ['all', 'lead', 'contract', 'onboard', 'custom']

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

export default function TaskHistory() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: 'all',
    task_type: 'all',
    search: '',
    page: 1,
    limit: 10,
  })

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      task_type: filters.task_type === 'all' ? undefined : filters.task_type,
    }),
    [filters],
  )

  const tasksQuery = useQuery({
    queryKey: ['tasks', queryParams],
    queryFn: () => listTasks(queryParams),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success('Task deleted')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const rerunMutation = useMutation({
    mutationFn: rerunTask,
    onSuccess: (data) => {
      toast.success('Rerun queued')
      navigate(`/tasks/${data.task_id}`)
    },
  })

  const totalPages = Math.max(1, Math.ceil((tasksQuery.data?.total || 0) / filters.limit))
  const tasks = tasksQuery.data?.items || []

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }))
  }

  const handleDelete = (task) => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      deleteMutation.mutate(task.id)
    }
  }

  const handleRerun = (task) => {
    if (window.confirm(`Rerun "${task.title}"?`)) {
      rerunMutation.mutate(task.id)
    }
  }

  const handleExport = async (task) => {
    const data = await exportTrace(task.id)
    downloadJson(`${task.id}_trace.json`, data)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">History</p>
          <h2 className="mt-2 text-3xl font-semibold">Task archive</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
            Review previous agent runs, inspect traces, rerun useful workflows, or clean up old
            records.
          </p>
        </div>
        <Link className="rounded bg-signal px-4 py-2 text-sm font-semibold text-white" to="/tasks/new">
          New task
        </Link>
      </div>

      <div className="grid gap-3 border border-line bg-white p-4 shadow-panel lg:grid-cols-[1fr_180px_180px]">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" size={16} />
          <input
            className="w-full rounded border border-line bg-paper py-2 pl-9 pr-3 outline-none focus:border-signal"
            placeholder="Search title or description"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </label>
        <select
          className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-signal"
          value={filters.status}
          onChange={(event) => updateFilter('status', event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-line bg-paper px-3 py-2 outline-none focus:border-signal"
          value={filters.task_type}
          onChange={(event) => updateFilter('task_type', event.target.value)}
        >
          {typeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden border border-line bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-panel text-xs uppercase tracking-[0.12em] text-steel">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasksQuery.isLoading && (
                <tr>
                  <td className="px-4 py-6 text-steel" colSpan="6">
                    Loading tasks...
                  </td>
                </tr>
              )}
              {!tasksQuery.isLoading && tasks.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-steel" colSpan="6">
                    No tasks found.
                  </td>
                </tr>
              )}
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-line">
                  <td className="max-w-md px-4 py-4">
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-xs text-steel">
                      {task.description}
                    </p>
                  </td>
                  <td className="px-4 py-4">{task.task_type || task.task_type_hint}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-steel">
                    {format(new Date(task.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-4 text-steel">{task.duration_ms || 0} ms</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link className="rounded border border-line p-2" title="View" to={`/tasks/${task.id}`}>
                        <Eye size={16} />
                      </Link>
                      <button
                        className="rounded border border-line p-2"
                        title="Rerun"
                        type="button"
                        onClick={() => handleRerun(task)}
                      >
                        <RefreshCcw size={16} />
                      </button>
                      <button
                        className="rounded border border-line p-2"
                        title="Export"
                        type="button"
                        onClick={() => handleExport(task)}
                      >
                        <FileDown size={16} />
                      </button>
                      <button
                        className="rounded border border-line p-2 text-ember"
                        title="Delete"
                        type="button"
                        onClick={() => handleDelete(task)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-steel">
          Page {filters.page} of {totalPages} · {tasksQuery.data?.total || 0} tasks
        </p>
        <div className="flex gap-2">
          <button
            className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
            type="button"
            disabled={filters.page <= 1}
            onClick={() => updateFilter('page', filters.page - 1)}
          >
            Previous
          </button>
          <button
            className="rounded border border-line bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => updateFilter('page', filters.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
