import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { isShowcaseMode } from '../config/showcase'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Use a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: isShowcaseMode ? 'demo@portfolio.local' : '',
      password: isShowcaseMode ? 'showcase-demo' : '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await login(values)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (error) {
      setError('root', {
        message: error.response?.data?.detail || 'Login failed. Check your credentials.',
      })
    }
  }

  return (
    <main className="page-shell grid min-h-screen place-items-center px-6">
      <section className="surface w-full max-w-md p-8">
        <p className="eyebrow">Sign in</p>
        <h1 className="mt-3 text-3xl font-normal text-ink">Agent Orchestrator</h1>
        <p className="mt-3 text-sm leading-6 text-steel">
          {isShowcaseMode
            ? 'Open the portfolio demo and explore the agent workflow without a backend server.'
            : 'Access the operations cockpit and continue building live agent workflows.'}
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="text-sm font-medium text-ink">Email</span>
            <input
              className="input-field mt-2"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <span className="mt-1 block text-sm text-ember">{errors.email.message}</span>}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">Password</span>
            <input
              className="input-field mt-2"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <span className="mt-1 block text-sm text-ember">{errors.password.message}</span>
            )}
          </label>

          {errors.root && (
            <div className="flex gap-2 rounded-lg border border-ember/30 bg-ember/10 p-3 text-sm text-ember">
              <AlertCircle size={17} />
              {errors.root.message}
            </div>
          )}

          <button
            className="action-primary w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Opening...' : isShowcaseMode ? 'Open showcase' : 'Sign in'} <ArrowRight size={16} />
          </button>
        </form>

        <p className="mt-6 text-sm text-steel">
          Need an account?{' '}
          <Link className="font-medium text-ink underline" to="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  )
}
