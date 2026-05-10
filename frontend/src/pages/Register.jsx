import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useAuth } from '../hooks/useAuth'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Use a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      await registerUser(values)
      navigate('/', { replace: true })
    } catch (error) {
      setError('root', {
        message: error.response?.data?.detail || 'Registration failed. Try another email.',
      })
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="w-full max-w-md border border-line bg-white p-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Register</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Create workspace access</h1>
        <p className="mt-3 text-sm leading-6 text-steel">
          Create your account and open the operations cockpit.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-sm font-medium text-ink">Name</span>
            <input
              className="mt-2 w-full rounded border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-signal"
              autoComplete="name"
              {...register('name')}
            />
            {errors.name && <span className="mt-1 block text-sm text-ember">{errors.name.message}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              className="mt-2 w-full rounded border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-signal"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <span className="mt-1 block text-sm text-ember">{errors.email.message}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              className="mt-2 w-full rounded border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-signal"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && (
              <span className="mt-1 block text-sm text-ember">{errors.password.message}</span>
            )}
          </label>

          {errors.root && (
            <div className="flex gap-2 rounded border border-ember/30 bg-ember/10 p-3 text-sm text-ember">
              <AlertCircle size={17} />
              {errors.root.message}
            </div>
          )}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create account'} <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-sm text-steel">
          Already have access?{' '}
          <Link className="font-semibold text-ink underline" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}
