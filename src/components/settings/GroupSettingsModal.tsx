import { useState } from 'react'
import { X, Copy, CheckCircle, Users } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { supabase } from '../../lib/supabase'

interface GroupSettingsModalProps {
  onClose: () => void
}

export function GroupSettingsModal({ onClose }: GroupSettingsModalProps) {
  const { activeGroupId } = useAuthStore()
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleCopy = async () => {
    if (activeGroupId) {
      await navigator.clipboard.writeText(activeGroupId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      setError('認証エラーです')
      setLoading(false)
      return
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(joinCode.trim())) {
      setError('無効なグループIDの形式です。正しいIDを入力してください。')
      setLoading(false)
      return
    }

    // Attempt to join group
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({
        group_id: joinCode.trim(),
        user_id: user.id,
        role: 'member',
      })

    if (joinError) {
      // Handle unique constraint or foreign key violations
      if (joinError.code === '23505') {
        setError('すでにこのグループに参加しています。')
      } else if (joinError.code === '23503') {
        setError('無効なグループIDです。')
      } else {
        setError(joinError.message)
      }
    } else {
      setSuccessMsg('グループに参加しました！アプリをリロードしてください。')
      setJoinCode('')
      // Ideally we would trigger a full re-initialization here,
      // but a reload request is simplest for a core identity change.
      setTimeout(() => window.location.reload(), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-xl w-full max-w-sm overflow-hidden animate-slide-up shadow-xl border border-[var(--color-border)]">
        <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold flex items-center gap-2">
            <Users size={18} />
            家族グループ設定
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-6">
          {/* Section: Your Group ID */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-[var(--color-text-muted)]">
              あなたの家族グループID (招待用)
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
              このIDをパートナーに教えることで、同じ家計簿を共有できます。
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={activeGroupId || 'グループ未所属'}
                className="input flex-1 text-sm font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-body)]"
              />
              <button
                className="btn btn-secondary flex items-center gap-1 min-w-[80px] justify-center"
                onClick={handleCopy}
                disabled={!activeGroupId}
              >
                {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? 'コピー済' : 'コピー'}
              </button>
            </div>
          </div>

          <hr className="border-t border-[var(--color-border)]" />

          {/* Section: Join a Group */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-[var(--color-text-muted)]">
              家族のグループに参加する
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
              パートナーから教えてもらったIDを入力して参加します。
            </p>
            <form onSubmit={handleJoin} className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="グループIDを入力"
                className="input text-sm font-mono"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn btn-primary w-full mt-2"
                disabled={loading || !joinCode.trim()}
              >
                {loading ? '参加中...' : '参加する'}
              </button>
            </form>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            {successMsg && <p className="text-green-400 text-xs mt-2">{successMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
