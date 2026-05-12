import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, History, PlusCircle, Settings, ShieldCheck } from 'lucide-react'

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
    <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded bg-signal text-white">
            <ShieldCheck size={21} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-steel">Ops Layer</p>
            <h1 className="text-lg font-semibold">AI Automation</h1>
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
                  'flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition',
                  isActiveRoute(item.to, isActive)
                    ? 'bg-signal text-white'
                    : 'text-steel hover:bg-panel hover:text-ink',
                ].join(' ')
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-h-screen min-w-0 lg:pl-64">
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
