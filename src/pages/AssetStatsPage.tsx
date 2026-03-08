import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, FileText } from 'lucide-react'
import { useAssetStore } from '../stores/assetStore'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types'

// Reusing some format logic from TransactionList
function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土']
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    dow: dayOfWeek[date.getDay()],
  }
}

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  for (const tx of transactions) {
    if (!groups[tx.tx_date]) groups[tx.tx_date] = []
    groups[tx.tx_date].push(tx)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

interface AssetStatsPageProps {
  assetId: string
  onBack: () => void
}

export function AssetStatsPage({ assetId, onBack }: AssetStatsPageProps) {
  const { getAssetById, fetchAssets } = useAssetStore()
  
  const [assetTxs, setAssetTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const asset = assetId ? getAssetById(assetId) : null

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    async function loadAssetTransactions() {
      if (!assetId) return
      setLoading(true)
      
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Fetch all transactions involving this asset
      // EITHER it's a normal income/expense for this asset OR it's a transfer from/to this asset
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.user.id)
        .or(`asset_id.eq.${assetId},from_asset_id.eq.${assetId},to_asset_id.eq.${assetId}`)
        .order('tx_date', { ascending: false })
        .order('created_at', { ascending: false })

      setAssetTxs((data || []) as Transaction[])
      setLoading(false)
    }
    loadAssetTransactions()
  }, [assetId])

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-[var(--color-text-muted)] animate-fade-in">
        {loading ? '読み込み中...' : '資産が見つかりません'}
        <button className="btn btn-ghost mt-4" onClick={onBack}>
          <ArrowLeft size={16} /> 戻る
        </button>
      </div>
    )
  }

  const groups = groupByDate(assetTxs)

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-1 py-2 mb-2">
        <button 
          className="btn btn-ghost btn-icon p-2 hover:bg-[var(--color-bg-card)]" 
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{asset.name}</h1>
      </div>

      {/* Asset Summary */}
      <div className="card text-center mb-6">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">現在の残高</p>
        <p className={`text-3xl font-bold ${asset.balance >= 0 ? 'text-[var(--color-text-primary)]' : 'amount-expense'}`}>
          ¥{asset.balance.toLocaleString()}
        </p>
      </div>

      {/* Transaction History specific to this asset */}
      <h2 className="text-sm font-bold text-[var(--color-text-secondary)] px-2 mb-3">取引履歴</h2>
      
      {loading ? (
        <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">
          読み込み中...
        </div>
      ) : assetTxs.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} />
          <p>この資産の取引記録はありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-24">
          {groups.map(([date, txs]) => {
            const { month, day, dow } = formatDate(date)
            return (
              <div key={date} className="animate-fade-in">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {month}/{day}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">({dow})</span>
                  <div className="flex-1 h-px bg-[var(--color-border)]" />
                </div>
                
                <div className="card p-1">
                  {txs.map((tx) => (
                    <AssetTransactionItem key={tx.id} tx={tx} currentAssetId={asset.id} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AssetTransactionItem({ tx, currentAssetId }: { tx: Transaction, currentAssetId: string }) {
  const { getAssetById } = useAssetStore()

  // Determine how this transaction affects the CURRENT asset viewing right now
  let isPositive = false
  let label = ''
  let Icon = ArrowLeftRight
  let colorClass = ''
  let otherAssetName = ''

  if (tx.tx_type === 'income') {
    isPositive = true
    label = '収入'
    Icon = ArrowDownCircle
    colorClass = 'amount-income'
  } else if (tx.tx_type === 'expense') {
    isPositive = false
    label = '支出'
    Icon = ArrowUpCircle
    colorClass = 'amount-expense'
  } else if (tx.tx_type === 'transfer') {
    if (tx.from_asset_id === currentAssetId) {
      // Money left this asset
      isPositive = false
      label = '振出'
      Icon = ArrowUpCircle
      colorClass = 'amount-expense'
      otherAssetName = `→ ${getAssetById(tx.to_asset_id!)?.name ?? '?'}`
    } else {
      // Money entered this asset
      isPositive = true
      label = '振入'
      Icon = ArrowDownCircle
      colorClass = 'amount-income'
      otherAssetName = `← ${getAssetById(tx.from_asset_id!)?.name ?? '?'}`
    }
  }

  const prefix = isPositive ? '+' : '-'

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors">
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 
          bg-[color-mix(in_srgb,var(--color-border)_40%,transparent)]
        `}
      >
        <Icon size={16} className={colorClass} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{tx.category}</span>
          <span className="text-[10px] font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)] px-1.5 rounded">{label}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.description && (
            <span className="text-xs text-[var(--color-text-muted)] truncate">
              {tx.description}
            </span>
          )}
          {otherAssetName && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              {otherAssetName}
            </span>
          )}
        </div>
      </div>

      <span className={`text-sm font-bold tabular-nums ${colorClass}`}>
        {prefix}¥{tx.amount.toLocaleString()}
      </span>
    </div>
  )
}
