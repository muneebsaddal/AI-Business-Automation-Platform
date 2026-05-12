import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Play, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { submitTask } from '../api/tasks'
import { isShowcaseMode } from '../config/showcase'
import { useSettingsStore } from '../store/settingsStore'

const demoLead =
  'Qualify this inbound lead: Acme Logistics, contact Sarah Khan, operations director. They need workflow automation for quote follow-ups and customer onboarding. Budget mentioned is around $8k, timeline is this quarter, and they asked for a technical demo next week.'

const taskSchema = z.object({
  title: z.string().min(3, 'Add a clear task title'),
  description: z.string().min(20, 'Describe the task in at least 20 characters'),
  task_type_hint: z.enum(['auto', 'lead', 'contract', 'onboard', 'custom']),
})

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function NewTask() {
  const navigate = useNavigate()
  const defaultTaskType = useSettingsStore((state) => state.defaultTaskType)
  const [fileName, setFileName] = useState('')
  const [fileBase64, setFileBase64] = useState(null)
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: 'Qualify Acme Logistics inbound lead',
      description: demoLead,
      task_type_hint: defaultTaskType,
    },
  })

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setFileName('')
      setFileBase64(null)
      return
    }
    if (file.type !== 'application/pdf') {
      setError('root', { message: 'Only PDF attachments are supported for now.' })
      event.target.value = ''
      return
    }
    setFileName(file.name)
    setFileBase64(await fileToBase64(file))
  }

  const useDemoLead = () => {
    setValue('title', 'Qualify Acme Logistics inbound lead')
    setValue('description', demoLead)
    setValue('task_type_hint', 'lead')
  }

  const onSubmit = async (values) => {
    try {
      const response = await submitTask({
        ...values,
        file_base64: fileBase64,
      })
      toast.success('Task queued')
      navigate(`/tasks/${response.task_id}`)
    } catch (error) {
      setError('root', {
        message: error.response?.data?.detail || 'Could not submit task.',
      })
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">New task</p>
          <h2 className="mt-2 text-3xl font-semibold">Lead qualification intake</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
            {isShowcaseMode
              ? 'Describe the business work in plain English. The showcase will generate a traceable agent run instantly.'
              : 'Describe the business work in plain English. The backend will classify, plan, execute, validate, and stream the trace.'}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
          type="button"
          onClick={useDemoLead}
        >
          <Sparkles size={16} />
          Load demo lead
        </button>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1fr_320px]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5 border border-line bg-white p-6 shadow-panel">
          <label className="block">
            <span className="text-sm font-medium">Title</span>
            <input
              className="mt-2 w-full rounded border border-line bg-paper px-3 py-2 outline-none focus:border-signal"
              {...register('title')}
            />
            {errors.title && <span className="mt-1 block text-sm text-ember">{errors.title.message}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Task type</span>
            <select
              className="mt-2 w-full rounded border border-line bg-paper px-3 py-2 outline-none focus:border-signal"
              {...register('task_type_hint')}
            >
              <option value="auto">Auto detect</option>
              <option value="lead">Lead qualifier</option>
              <option value="contract">Contract analyzer</option>
              <option value="onboard">Client onboarder</option>
              <option value="custom">Custom workflow</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <textarea
              className="mt-2 min-h-56 w-full resize-y rounded border border-line bg-paper px-3 py-2 leading-6 outline-none focus:border-signal"
              {...register('description')}
            />
            {errors.description && (
              <span className="mt-1 block text-sm text-ember">{errors.description.message}</span>
            )}
          </label>

          {errors.root && (
            <div className="rounded border border-ember/30 bg-ember/10 p-3 text-sm text-ember">
              {errors.root.message}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="border border-line bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <FileText className="text-signal" size={18} />
              <h3 className="font-semibold">Attachment</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-steel">
              Optional PDF upload. It is converted to base64 and sent with the task.
            </p>
            <input
              className="mt-4 block w-full text-sm text-steel file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-paper"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
            {fileName && <p className="mt-3 text-sm font-medium text-ink">{fileName}</p>}
          </div>

          <div className="border border-line bg-[#fbf8f0] p-5">
            <h3 className="font-semibold">What happens next</h3>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-steel">
              {isShowcaseMode ? (
                <>
                  <li>1. Demo mode creates a task record in this browser.</li>
                  <li>2. The agent graph is populated with realistic pipeline events.</li>
                  <li>3. The detail page shows validated output, export, and replay.</li>
                </>
              ) : (
                <>
                  <li>1. FastAPI creates a task record.</li>
                  <li>2. Celery runs the LangGraph pipeline.</li>
                  <li>3. Redis streams node events to the detail page.</li>
                </>
              )}
            </ol>
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-3 text-sm font-semibold text-paper disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Queueing task...' : 'Run automation'} <Play size={16} />
          </button>
        </aside>
      </form>
    </section>
  )
}
