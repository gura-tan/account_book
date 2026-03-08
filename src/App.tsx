import { useState, useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { AuthPage } from './pages/AuthPage'
import { SharedBookPage } from './pages/SharedBookPage'
import { PersonalBookPage } from './pages/PersonalBookPage'
import { AssetsPage } from './pages/AssetsPage'
import { AssetStatsPage } from './pages/AssetStatsPage'
import { AppShell } from './components/layout/AppShell'

function App() {
  const { user, initialized, initialize } = useAuthStore()
  const [activeTab, setActiveTab] = useState('shared')

  useEffect(() => {
    initialize()
  }, [])

  // Handle keyboard shortcuts for month navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !e.target) {
        // Will be handled by the active page
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-text-muted)] animate-fade-in">
          読み込み中...
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  const renderPage = () => {
    if (activeTab.startsWith('assets/')) {
      const assetId = activeTab.split('/')[1]
      return <AssetStatsPage assetId={assetId} onBack={() => setActiveTab('assets')} />
    }

    switch (activeTab) {
      case 'shared':
        return <SharedBookPage />
      case 'personal':
        return <PersonalBookPage />
      case 'assets':
        return <AssetsPage onNavigate={(id: string) => setActiveTab(`assets/${id}`)} />
      default:
        return <SharedBookPage />
    }
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </AppShell>
  )
}

export default App
