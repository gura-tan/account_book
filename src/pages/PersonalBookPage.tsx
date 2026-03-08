import { PiggyBank } from 'lucide-react'

export function PersonalBookPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 max-w-2xl mx-auto w-full">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center">
        <PiggyBank size={28} className="text-[var(--color-accent)]" />
      </div>
      <h2 className="text-lg font-semibold">おこづかい帳</h2>
      <p className="text-[var(--color-text-muted)] text-sm text-center max-w-xs">
        おこづかいの記録は、フェーズ3で実装されます。<br />
        ポートフォリオで割り当てた自由資金を個別に管理できるようになります。
      </p>
      <div className="badge bg-[var(--color-accent)]/15 text-[var(--color-accent)] mt-2">
        フェーズ3で実装予定
      </div>
    </div>
  )
}
