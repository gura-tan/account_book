import { useState, type ReactNode } from 'react'
import { BookOpen, Wallet, PiggyBank, LogOut, HelpCircle, Settings } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { GroupSettingsModal } from '../settings/GroupSettingsModal'

interface AppShellProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'shared', label: '家計簿', icon: BookOpen },
  { id: 'personal', label: 'おこづかい', icon: PiggyBank },
  { id: 'assets', label: '資産', icon: Wallet },
]

export function AppShell({ children, activeTab, onTabChange }: AppShellProps) {
  const { signOut } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-[var(--color-accent)]" />
          <span className="font-semibold text-sm">家計簿</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-icon"
            title="家族設定"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={18} />
          </button>
          <button className="btn btn-ghost btn-icon" title="チュートリアル">
            <HelpCircle size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={signOut}
            title="ログアウト"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="px-4 pt-3">
        <div className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 animate-fade-in">{children}</main>

      {/* Settings Modal */}
      {showSettings && <GroupSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
