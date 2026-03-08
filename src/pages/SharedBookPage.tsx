import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { MonthNavigator } from '../components/layout/MonthNavigator'
import { TransactionList } from '../components/transactions/TransactionList'
import { TransactionForm } from '../components/transactions/TransactionForm'
import { useTransactionStore } from '../stores/transactionStore'
import { useAssetStore } from '../stores/assetStore'

export function SharedBookPage() {
  const {
    transactions,
    loading,
    currentYear,
    currentMonth,
    fetchTransactions,
    nextMonth,
    prevMonth,
    getMonthlyIncome,
    getMonthlyExpense,
  } = useTransactionStore()
  const { fetchAssets } = useAssetStore()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchTransactions(currentYear, currentMonth, 'shared')
    fetchAssets()
  }, [currentYear, currentMonth])

  const handlePrev = () => {
    prevMonth()
    const { currentYear: y, currentMonth: m } = useTransactionStore.getState()
    fetchTransactions(y, m, 'shared')
  }

  const handleNext = () => {
    nextMonth()
    const { currentYear: y, currentMonth: m } = useTransactionStore.getState()
    fetchTransactions(y, m, 'shared')
  }

  const income = getMonthlyIncome()
  const expense = getMonthlyExpense()
  const balance = income - expense

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {/* Month Navigator */}
      <MonthNavigator
        year={currentYear}
        month={currentMonth}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Summary Card */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">収入</p>
            <p className="text-lg font-bold amount-income">
              ¥{income.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">支出</p>
            <p className="text-lg font-bold amount-expense">
              ¥{expense.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1">収支</p>
            <p
              className={`text-lg font-bold ${
                balance >= 0 ? 'amount-income' : 'amount-expense'
              }`}
            >
              {balance >= 0 ? '+' : ''}¥{balance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="empty-state">
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : (
        <TransactionList transactions={transactions} bookType="shared" />
      )}

      {/* Add Button */}
      <button
        className="btn btn-primary fixed bottom-6 right-6 shadow-xl rounded-full px-5 py-3 text-base z-40"
        onClick={() => setShowForm(true)}
      >
        <Plus size={20} />
        記録する
      </button>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          bookType="shared"
          onClose={() => {
            setShowForm(false)
            fetchTransactions(currentYear, currentMonth, 'shared')
          }}
        />
      )}
    </div>
  )
}
