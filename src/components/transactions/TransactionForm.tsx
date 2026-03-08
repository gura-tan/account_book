import { useState, useEffect } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from 'lucide-react'
import { useTransactionStore } from '../../stores/transactionStore'
import { useAssetStore } from '../../stores/assetStore'
import type { TxType, BookType } from '../../types'

interface TransactionFormProps {
  bookType: BookType
  onClose: () => void
}

const incomeCategories = ['給与', '賞与', '副収入', 'その他収入']
const expenseCategories = [
  '食費', '日用品', '交通費', '通信費', '住居費', '水道光熱費',
  '医療費', '保険', '教育費', '娯楽', '衣服', '美容', '交際費', 'その他支出',
]

export function TransactionForm({ bookType, onClose }: TransactionFormProps) {
  const { createTransaction } = useTransactionStore()
  const { getLeafAssets, fetchAssets } = useAssetStore()

  const [txType, setTxType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [assetId, setAssetId] = useState('')
  const [fromAssetId, setFromAssetId] = useState('')
  const [toAssetId, setToAssetId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const leafAssets = getLeafAssets()

  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    // Set default category when changing tx type
    if (txType === 'income') setCategory(incomeCategories[0])
    else if (txType === 'expense') setCategory(expenseCategories[0])
    else setCategory('')
  }, [txType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const amountNum = parseInt(amount)
    if (!amountNum || amountNum <= 0) {
      setError('金額を正しく入力してください')
      setSaving(false)
      return
    }

    const result = await createTransaction({
      tx_type: txType,
      amount: amountNum,
      asset_id: txType !== 'transfer' ? assetId || null : null,
      from_asset_id: txType === 'transfer' ? fromAssetId || null : null,
      to_asset_id: txType === 'transfer' ? toAssetId || null : null,
      category,
      description,
      tx_date: txDate,
      book_type: bookType,
    })

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    // Refresh assets for updated balances
    await fetchAssets()
    setSaving(false)
    onClose()
  }

  const categories = txType === 'income' ? incomeCategories : expenseCategories

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">記録する</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Transaction type tabs */}
        <div className="tx-type-tabs mb-5">
          <button
            type="button"
            className={`tx-type-tab ${txType === 'income' ? 'income' : ''}`}
            onClick={() => setTxType('income')}
          >
            <ArrowDownCircle size={16} className="inline mr-1" style={{ verticalAlign: '-3px' }} />
            収入
          </button>
          <button
            type="button"
            className={`tx-type-tab ${txType === 'expense' ? 'expense' : ''}`}
            onClick={() => setTxType('expense')}
          >
            <ArrowUpCircle size={16} className="inline mr-1" style={{ verticalAlign: '-3px' }} />
            支出
          </button>
          <button
            type="button"
            className={`tx-type-tab ${txType === 'transfer' ? 'transfer' : ''}`}
            onClick={() => setTxType('transfer')}
          >
            <ArrowLeftRight size={16} className="inline mr-1" style={{ verticalAlign: '-3px' }} />
            移動
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Amount */}
          <div>
            <label className="label">金額（円）</label>
            <input
              type="number"
              className="input text-xl font-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              autoFocus
              min="1"
            />
          </div>

          {/* Date */}
          <div>
            <label className="label">日付</label>
            <input
              type="date"
              className="input"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              required
            />
          </div>

          {/* Category (for income/expense) */}
          {txType !== 'transfer' && (
            <div>
              <label className="label">カテゴリ</label>
              <select
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Asset (for income/expense) */}
          {txType !== 'transfer' && (
            <div>
              <label className="label">
                {txType === 'income' ? '入金先' : '出金元'}
              </label>
              <select
                className="select"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
              >
                <option value="">選択してください</option>
                {leafAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}（¥{asset.balance.toLocaleString()}）
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Transfer: from/to */}
          {txType === 'transfer' && (
            <>
              <div>
                <label className="label">出金元</label>
                <select
                  className="select"
                  value={fromAssetId}
                  onChange={(e) => setFromAssetId(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {leafAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}（¥{asset.balance.toLocaleString()}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">入金先</label>
                <select
                  className="select"
                  value={toAssetId}
                  onChange={(e) => setToAssetId(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {leafAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}（¥{asset.balance.toLocaleString()}）
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="label">内容</label>
            <input
              type="text"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="メモ（任意）"
            />
          </div>

          {error && (
            <p className="text-[var(--color-expense)] text-sm animate-slide-down">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary mt-2" disabled={saving}>
            {saving ? '記録中...' : '記録する'}
          </button>
        </form>
      </div>
    </div>
  )
}
