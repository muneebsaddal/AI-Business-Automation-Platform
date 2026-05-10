import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="w-full max-w-md border border-line bg-white p-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Sign in</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">AI Automation Platform</h1>
        <p className="mt-3 text-sm leading-6 text-steel">
          Auth form wiring lands in Step 13. The route is ready for the real login flow.
        </p>
        <Link className="mt-6 inline-flex rounded bg-ink px-4 py-2 text-sm font-semibold text-paper" to="/">
          Continue to app shell
        </Link>
      </section>
    </main>
  )
}
