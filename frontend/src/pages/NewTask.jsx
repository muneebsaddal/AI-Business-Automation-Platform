import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, FileJson, FileText, GitBranch, Play, Sparkles, Workflow } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { submitTask } from '../api/tasks'
import { getRecommendedShowcaseTemplate, showcaseTemplates } from '../api/showcaseApi'
import { isShowcaseMode } from '../config/showcase'
import { useSettingsStore } from '../store/settingsStore'

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
  const [searchParams] = useSearchParams()
  const defaultTaskType = useSettingsStore((state) => state.defaultTaskType)
  const initialTemplate = useMemo(() => {
    const queryTemplate = showcaseTemplates.find((template) => template.id === searchParams.get('template'))
    return queryTemplate || getRecommendedShowcaseTemplate()
  }, [searchParams])
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate.id)
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
      title: isShowcaseMode ? initialTemplate.title : getRecommendedShowcaseTemplate().title,
      description: isShowcaseMode ? initialTemplate.description : getRecommendedShowcaseTemplate().description,
      task_type_hint: isShowcaseMode ? initialTemplate.task_type_hint : defaultTaskType,
    },
  })

  const selectedTemplate =
    showcaseTemplates.find((template) => template.id === selectedTemplateId) || initialTemplate

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

  const selectTemplate = (template) => {
    setSelectedTemplateId(template.id)
    setValue('title', template.title)
    setValue('description', template.description)
    setValue('task_type_hint', template.task_type_hint)
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
          <p className="eyebrow">Workflow intake</p>
          <h2 className="mt-2 text-3xl font-normal">Design an agent run from a business request</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
            {isShowcaseMode
              ? 'Pick a scenario, edit the brief, run the workflow.'
              : 'Describe the business work in plain English. The backend will classify, plan, execute, validate, and stream the trace.'}
          </p>
        </div>
        <button
          className="action-secondary"
          type="button"
          onClick={() => selectTemplate(getRecommendedShowcaseTemplate())}
        >
          <Sparkles size={16} />
          Load recommended demo
        </button>
      </div>

      {isShowcaseMode && (
        <section className="surface p-5">
          <p className="eyebrow">Template first</p>
          <h3 className="mt-2 text-xl font-normal">Pick a business scenario</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            Prebuilt briefs for lead, contract, onboarding, and custom operations.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {showcaseTemplates.map((template) => {
              const selected = template.id === selectedTemplateId
              return (
                <button
                  key={template.id}
                  className={[
                    'min-h-48 rounded-xl border p-4 text-left transition hover:-translate-y-0.5',
                    selected ? 'border-signal/40 bg-signal/5 shadow-panel' : 'border-line bg-white/80',
                  ].join(' ')}
                  type="button"
                  onClick={() => selectTemplate(template)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full border border-line bg-white px-2 py-1 text-xs font-medium uppercase tracking-[0.12em] text-signal">
                      {template.task_type_hint}
                    </span>
                    {selected && <CheckCircle2 className="text-signal" size={18} />}
                  </div>
                  <h4 className="mt-4 font-medium">{template.label}</h4>
                  <p className="mt-2 text-sm leading-6 text-steel">{template.customer_value}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <form className="grid gap-6 lg:grid-cols-[1fr_360px]" onSubmit={handleSubmit(onSubmit)}>
        <div className="surface space-y-5 p-6">
          <div className="grid gap-3 border-b border-line pb-5 sm:grid-cols-3">
            {[
              [Workflow, 'Classify', 'Detect workflow type'],
              [GitBranch, 'Orchestrate', 'Route agent/tool steps'],
              [FileJson, 'Validate', 'Return typed output'],
            ].map(([Icon, title, body]) => (
              <div key={title} className="rounded-xl border border-line bg-panel/70 p-3">
                <Icon className="text-signal" size={17} />
                <p className="mt-3 text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-steel">{body}</p>
              </div>
            ))}
          </div>
          <label className="block">
            <span className="text-sm font-medium">Title</span>
            <input
              className="input-field mt-2"
              {...register('title')}
            />
            {errors.title && <span className="mt-1 block text-sm text-ember">{errors.title.message}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium">Task type</span>
            <select
              className="input-field mt-2"
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
              className="input-field mt-2 min-h-64 resize-y leading-6"
              {...register('description')}
            />
            {errors.description && (
              <span className="mt-1 block text-sm text-ember">{errors.description.message}</span>
            )}
          </label>

          {errors.root && (
            <div className="rounded-lg border border-ember/30 bg-ember/10 p-3 text-sm text-ember">
              {errors.root.message}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-signal" size={18} />
              <h3 className="font-medium">Expected output contract</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-steel">
              {selectedTemplate.expected_result_summary}
            </p>
          </div>

          {!isShowcaseMode && (
            <div className="surface p-5">
              <div className="flex items-center gap-2">
                <FileText className="text-signal" size={18} />
                <h3 className="font-medium">Attachment</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-steel">
                Optional PDF upload. It is converted to base64 and sent with the task.
              </p>
              <input
                className="mt-4 block w-full text-sm text-steel file:mr-3 file:rounded file:border-0 file:bg-signal file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              {fileName && <p className="mt-3 text-sm font-medium text-ink">{fileName}</p>}
            </div>
          )}

          <div className="surface-soft p-5">
            <h3 className="font-medium">Runtime sequence</h3>
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
            className="action-primary w-full py-3"
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
