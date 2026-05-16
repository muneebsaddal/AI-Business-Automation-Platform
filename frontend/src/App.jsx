import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, ArrowRight, History, PlusCircle, Settings, ShieldCheck, Sparkles } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Activity },
  { to: '/tasks/new', label: 'New task', icon: PlusCircle },
  { to: '/tasks', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function App() {
  const location = useLocation()

  const isActiveRoute = (to, isActive) => {
    if (to === '/tasks') {
      return location.pathname === '/tasks' || /^\/tasks\/(?!new$)[^/]+$/.test(location.pathname)
    }
    return isActive
  }

  return (
    <div className="page-shell">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[17rem] border-r border-line bg-white/78 px-4 py-5 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-signal/10 text-signal ring-1 ring-signal/15">
            <ShieldCheck size={21} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-steel">Showcase</p>
            <h1 className="text-base font-medium tracking-tight">Agent Orchestrator</h1>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-panel/65 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-steel">
            <Sparkles size={14} className="text-signal" />
            What it does
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-ink">
            <span>Brief</span>
            <ArrowRight size={13} className="text-steel" />
            <span>Agents</span>
            <ArrowRight size={13} className="text-steel" />
            <span>Outcome</span>
          </div>
        </div>

        <nav className="mt-9 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActiveRoute(item.to, isActive)
                    ? 'bg-ink text-white shadow-sm'
                    : 'text-steel hover:bg-panel/80 hover:text-ink',
                ].join(' ')
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-2xl border border-line bg-white/82 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-steel">Runtime stack</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-full bg-panel px-2 py-1 font-mono text-ink">LangGraph</span>
            <span className="rounded-full bg-panel px-2 py-1 font-mono text-ink">FastAPI</span>
            <span className="rounded-full bg-panel px-2 py-1 font-mono text-ink">Redis WS</span>
            <span className="rounded-full bg-panel px-2 py-1 font-mono text-ink">Celery</span>
          </div>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 lg:pl-[17rem]">
        <div className="sticky top-0 z-10 border-b border-line bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-signal/10 text-signal ring-1 ring-signal/20">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="eyebrow">Ops Layer</p>
                <p className="text-sm font-medium">Agent Orchestrator</p>
              </div>
            </div>
            <NavLink className="action-primary px-3 py-2" to="/tasks/new">
              <PlusCircle size={16} />
            </NavLink>
          </div>
        </div>
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
