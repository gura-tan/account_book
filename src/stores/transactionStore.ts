import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Transaction, BookType, TxType } from '../types'

interface TransactionState {
  transactions: Transaction[]
  loading: boolean
  currentYear: number
  currentMonth: number
  fetchTransactions: (year: number, month: number, bookType: BookType) => Promise<void>
  createTransaction: (data: {
    tx_type: TxType
    amount: number
    asset_id?: string | null
    from_asset_id?: string | null
    to_asset_id?: string | null
    category: string
    description: string
    tx_date: string
    book_type: BookType
  }) => Promise<{ error: string | null }>
  deleteTransaction: (id: string) => Promise<{ error: string | null }>
  setMonth: (year: number, month: number) => void
  nextMonth: () => void
  prevMonth: () => void
  getMonthlyIncome: () => number
  getMonthlyExpense: () => number
}

export const useTransactionStore = create<TransactionState>((set, get) => {
  const now = new Date()
  return {
    transactions: [],
    loading: false,
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth() + 1,

    fetchTransactions: async (year, month, bookType) => {
      set({ loading: true, currentYear: year, currentMonth: month })
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate =
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${String(month + 1).padStart(2, '0')}-01`

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('book_type', bookType)
        .gte('tx_date', startDate)
        .lt('tx_date', endDate)
        .order('tx_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (!error && data) {
        set({ transactions: data as Transaction[] })
      }
      set({ loading: false })
    },

    createTransaction: async (data) => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return { error: '認証されていません' }
      
      let groupId = null
      if (data.book_type === 'shared') {
        const { useAuthStore } = await import('./authStore')
        groupId = useAuthStore.getState().activeGroupId
      }

      // Insert transaction
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        group_id: groupId,
        ...data,
      })
      if (txError) return { error: txError.message }

      // Update asset balances
      if (data.tx_type === 'income' && data.asset_id) {
        await supabase.rpc('increment_balance', {
          asset_id_input: data.asset_id,
          amount_input: data.amount,
        }).then(({ error }) => {
          // Fallback: direct update if RPC doesn't exist
          if (error) {
            return supabase
              .from('assets')
              .select('balance')
              .eq('id', data.asset_id!)
              .single()
              .then(({ data: asset }) => {
                if (asset) {
                  return supabase
                    .from('assets')
                    .update({ balance: asset.balance + data.amount })
                    .eq('id', data.asset_id!)
                }
              })
          }
        })
      } else if (data.tx_type === 'expense' && data.asset_id) {
        const { data: asset } = await supabase
          .from('assets')
          .select('balance')
          .eq('id', data.asset_id)
          .single()
        if (asset) {
          await supabase
            .from('assets')
            .update({ balance: asset.balance - data.amount })
            .eq('id', data.asset_id)
        }
      } else if (data.tx_type === 'transfer' && data.from_asset_id && data.to_asset_id) {
        // Deduct from source
        const { data: fromAsset } = await supabase
          .from('assets')
          .select('balance')
          .eq('id', data.from_asset_id)
          .single()
        if (fromAsset) {
          await supabase
            .from('assets')
            .update({ balance: fromAsset.balance - data.amount })
            .eq('id', data.from_asset_id)
        }
        // Add to destination
        const { data: toAsset } = await supabase
          .from('assets')
          .select('balance')
          .eq('id', data.to_asset_id)
          .single()
        if (toAsset) {
          await supabase
            .from('assets')
            .update({ balance: toAsset.balance + data.amount })
            .eq('id', data.to_asset_id)
        }
      }

      // Re-fetch transactions
      const { currentYear, currentMonth } = get()
      await get().fetchTransactions(currentYear, currentMonth, data.book_type)
      return { error: null }
    },

    deleteTransaction: async (id) => {
      const tx = get().transactions.find((t) => t.id === id)
      if (!tx) return { error: '取引が見つかりません' }

      // Reverse balance changes
      if (tx.tx_type === 'income' && tx.asset_id) {
        const { data: asset } = await supabase
          .from('assets')
          .select('balance')
          .eq('id', tx.asset_id)
          .single()
        if (asset) {
          await supabase
            .from('assets')
            .update({ balance: asset.balance - tx.amount })
            .eq('id', tx.asset_id)
        }
      } else if (tx.tx_type === 'expense' && tx.asset_id) {
        const { data: asset } = await supabase
          .from('assets')
          .select('balance')
          .eq('id', tx.asset_id)
          .single()
        if (asset) {
          await supabase
            .from('assets')
            .update({ balance: asset.balance + tx.amount })
            .eq('id', tx.asset_id)
        }
      } else if (tx.tx_type === 'transfer') {
        if (tx.from_asset_id) {
          const { data: fromAsset } = await supabase
            .from('assets')
            .select('balance')
            .eq('id', tx.from_asset_id)
            .single()
          if (fromAsset) {
            await supabase
              .from('assets')
              .update({ balance: fromAsset.balance + tx.amount })
              .eq('id', tx.from_asset_id)
          }
        }
        if (tx.to_asset_id) {
          const { data: toAsset } = await supabase
            .from('assets')
            .select('balance')
            .eq('id', tx.to_asset_id)
            .single()
          if (toAsset) {
            await supabase
              .from('assets')
              .update({ balance: toAsset.balance - tx.amount })
              .eq('id', tx.to_asset_id)
          }
        }
      }

      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) return { error: error.message }

      const { currentYear, currentMonth } = get()
      await get().fetchTransactions(currentYear, currentMonth, tx.book_type)
      return { error: null }
    },

    setMonth: (year, month) => set({ currentYear: year, currentMonth: month }),

    nextMonth: () => {
      const { currentYear, currentMonth } = get()
      if (currentMonth === 12) {
        set({ currentYear: currentYear + 1, currentMonth: 1 })
      } else {
        set({ currentMonth: currentMonth + 1 })
      }
    },

    prevMonth: () => {
      const { currentYear, currentMonth } = get()
      if (currentMonth === 1) {
        set({ currentYear: currentYear - 1, currentMonth: 12 })
      } else {
        set({ currentMonth: currentMonth - 1 })
      }
    },

    getMonthlyIncome: () =>
      get()
        .transactions.filter((t) => t.tx_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),

    getMonthlyExpense: () =>
      get()
        .transactions.filter((t) => t.tx_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
  }
})
