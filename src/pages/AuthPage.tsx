import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { LogIn, UserPlus, Wallet } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, loading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = await signIn(email, password)
    if (result.error) setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">メールアドレス</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
        />
      </div>
      <div>
        <label className="label">パスワード</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>
      {error && (
        <p className="text-[var(--color-expense)] text-sm animate-slide-down">{error}</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        <LogIn size={16} />
        {loading ? 'ログイン中...' : 'ログイン'}
      </button>
    </form>
  )
}

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp, loading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const result = await signUp(email, password, displayName)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <div className="text-[var(--color-success)] text-4xl mb-3">✓</div>
        <p className="text-[var(--color-text-primary)] font-medium">アカウントを作成しました</p>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          確認メールをご確認ください
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label">表示名</label>
        <input
          type="text"
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="名前"
          required
        />
      </div>
      <div>
        <label className="label">メールアドレス</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
        />
      </div>
      <div>
        <label className="label">パスワード</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6文字以上"
          required
          minLength={6}
        />
      </div>
      {error && (
        <p className="text-[var(--color-expense)] text-sm animate-slide-down">{error}</p>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        <UserPlus size={16} />
        {loading ? '作成中...' : 'アカウント作成'}
      </button>
    </form>
  )
}

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] mb-4">
            <Wallet size={28} className="text-[var(--color-accent)]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">家計簿</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            暮らしを整える、おかねの記録
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="tab-bar mb-5">
            <button
              className={`tab-item ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
              type="button"
            >
              ログイン
            </button>
            <button
              className={`tab-item ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              新規登録
            </button>
          </div>

          {mode === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  )
}
