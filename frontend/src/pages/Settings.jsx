import { Bell, KeyRound, LogOut, Settings2, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { useSettingsStore } from '../store/settingsStore'

export default function Settings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { openAiKey, defaultTaskType, notifyOnComplete, notifyOnEscalation, updateSettings } =
    useSettingsStore()

  const saveSettings = (event) => {
    event.preventDefault()
    toast.success('Settings saved locally')
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-line pb-6">
        <p className="eyebrow">Control plane</p>
        <h2 className="mt-2 text-3xl font-normal">Workspace governance settings</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-steel">
          Configure local demo preferences. Backend account-management endpoints can be added after
          deployment plumbing is stable.
        </p>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={saveSettings}>
        <div className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <KeyRound className="text-signal" size={18} />
              <h3 className="font-medium">Runtime credential</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-steel">
              Optional user-provided key. Requests include it as `X-OpenAI-Key` for future backend
              support.
            </p>
            <input
              className="input-field mt-4"
              type="password"
              value={openAiKey}
              onChange={(event) => updateSettings({ openAiKey: event.target.value })}
              placeholder="sk-..."
            />
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <Settings2 className="text-signal" size={18} />
              <h3 className="font-medium">Defaults</h3>
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-medium">Default task type</span>
              <select
                className="input-field mt-2"
                value={defaultTaskType}
                onChange={(event) => updateSettings({ defaultTaskType: event.target.value })}
              >
                <option value="auto">Auto detect</option>
                <option value="lead">Lead qualifier</option>
                <option value="contract">Contract analyzer</option>
                <option value="onboard">Client onboarder</option>
                <option value="custom">Custom workflow</option>
              </select>
            </label>
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <Bell className="text-signal" size={18} />
              <h3 className="font-medium">Notifications</h3>
            </div>
            <label className="mt-4 flex items-center justify-between gap-4 text-sm">
              <span>Task complete alerts</span>
              <input
                type="checkbox"
                checked={notifyOnComplete}
                onChange={(event) => updateSettings({ notifyOnComplete: event.target.checked })}
              />
            </label>
            <label className="mt-4 flex items-center justify-between gap-4 text-sm">
              <span>Escalation alerts</span>
              <input
                type="checkbox"
                checked={notifyOnEscalation}
                onChange={(event) => updateSettings({ notifyOnEscalation: event.target.checked })}
              />
            </label>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <UserRound className="text-signal" size={18} />
              <h3 className="font-medium">Account</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-steel">{user?.name || 'Current user'}</p>
            <p className="text-sm text-steel">{user?.email}</p>
            <button
              className="action-secondary mt-5 w-full"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Log out
            </button>
          </section>

          <section className="surface-soft p-5">
            <h3 className="font-medium">Audit posture</h3>
            <p className="mt-2 text-sm leading-6 text-steel">
              Task export, replay, validation issues, and event payloads remain available on each run.
            </p>
          </section>

          <button className="action-primary w-full py-3" type="submit">
            Save settings
          </button>
        </aside>
      </form>
    </section>
  )
}
