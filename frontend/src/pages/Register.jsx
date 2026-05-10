import { Link } from 'react-router-dom'

export default function Register() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6">
      <section className="w-full max-w-md border border-line bg-white p-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal">Register</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Create workspace access</h1>
        <p className="mt-3 text-sm leading-6 text-steel">
          Registration form wiring lands in Step 13. This placeholder keeps routing complete.
        </p>
        <Link className="mt-6 inline-flex rounded bg-ink px-4 py-2 text-sm font-semibold text-paper" to="/login">
          Back to login
        </Link>
      </section>
    </main>
  )
}
