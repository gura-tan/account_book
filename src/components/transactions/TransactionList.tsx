import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Trash2, FileText } from 'lucide-react'
import type { Transaction } from '../../types'
import { useAssetStore } from '../../stores/assetStore'
import { useTransactionStore } from '../../stores/transactionStore'

interface TransactionListProps {
  transactions: Transaction[]
  bookType: 'shared' | 'personal'
}

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

function TransactionItem({ tx }: { tx: Transaction }) {
  const { getAssetById } = useAssetStore()
  const { deleteTransaction, currentYear, currentMonth, fetchTransactions } = useTransactionStore()

  const txTypeConfig = {
    income: {
      icon: ArrowDownCircle,
      colorClass: 'amount-income',
      prefix: '+',
      label: '収入',
    },
    expense: {
      icon: ArrowUpCircle,
      colorClass: 'amount-expense',
      prefix: '-',
      label: '支出',
    },
    transfer: {
      icon: ArrowLeftRight,
      colorClass: 'amount-transfer',
      prefix: '',
      label: '移動',
    },
  }

  const config = txTypeConfig[tx.tx_type]
  const Icon = config.icon

  const assetName =
    tx.tx_type === 'transfer'
      ? `${getAssetById(tx.from_asset_id!)?.name ?? '?'} → ${getAssetById(tx.to_asset_id!)?.name ?? '?'}`
      : getAssetById(tx.asset_id!)?.name ?? ''

  const handleDelete = async () => {
    if (confirm('この記録を削除しますか？')) {
      await deleteTransaction(tx.id)
      await fetchTransactions(currentYear, currentMonth, tx.book_type)
    }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors group">
      {/* Icon */}
      <div
        className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0
          ${tx.tx_type === 'income' ? 'bg-[var(--color-income)]/10' : ''}
          ${tx.tx_type === 'expense' ? 'bg-[var(--color-expense)]/10' : ''}
          ${tx.tx_type === 'transfer' ? 'bg-[var(--color-transfer)]/10' : ''}
        `}
      >
        <Icon
          size={16}
          className={
            tx.tx_type === 'income'
              ? 'text-[var(--color-income)]'
              : tx.tx_type === 'expense'
              ? 'text-[var(--color-expense)]'
              : 'text-[var(--color-transfer)]'
          }
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`badge badge-${tx.tx_type}`}>{config.label}</span>
          <span className="text-sm font-medium truncate">{tx.category}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {tx.description && (
            <span className="text-xs text-[var(--color-text-muted)] truncate">
              {tx.description}
            </span>
          )}
          {assetName && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              {assetName}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <span className={`text-sm font-bold tabular-nums ${config.colorClass}`}>
        {config.prefix}¥{tx.amount.toLocaleString()}
      </span>

      {/* Delete */}
      <button
        className="btn btn-ghost btn-icon p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-[var(--color-expense)]"
        onClick={handleDelete}
        title="削除"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export function TransactionList({ transactions, bookType: _bookType }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <FileText size={40} />
        <p>この月の記録はありません</p>
      </div>
    )
  }

  const groups = groupByDate(transactions)

  return (
    <div className="flex flex-col gap-2">
      {groups.map(([date, txs]) => {
        const { month, day, dow } = formatDate(date)
        return (
          <div key={date} className="animate-fade-in">
            {/* Date header */}
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {month}/{day}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">({dow})</span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>
            {/* Transactions */}
            <div className="card p-1">
              {txs.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
