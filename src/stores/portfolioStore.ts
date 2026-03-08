import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { PortfolioSetting, MonthlyBudget, PortfolioAllocation, CalcType } from '../types'

interface PortfolioState {
  settings: PortfolioSetting[]
  monthlyBudget: MonthlyBudget | null
  loading: boolean
  
  // Actions
  fetchData: (yearMonth: string) => Promise<void>
  setExpectedIncome: (yearMonth: string, amount: number) => Promise<{ error: string | null }>
  updateSetting: (id: string, updates: Partial<PortfolioSetting>) => Promise<{ error: string | null }>
  addSetting: (setting: Omit<PortfolioSetting, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: string | null }>
  deleteSetting: (id: string) => Promise<{ error: string | null }>
  reorderSettings: (orderedIds: string[]) => Promise<{ error: string | null }>
  
  // Computed
  getAllocation: () => PortfolioAllocation[]
}

const defaultCategories = [
  { category: '固定費', sort_order: 1, calc_type: 'ratio' as CalcType, calc_value: 0.20, min_amount: null, max_amount: null },
  { category: '投資', sort_order: 2, calc_type: 'ratio' as CalcType, calc_value: 0.10, min_amount: null, max_amount: null },
  { category: '消費', sort_order: 3, calc_type: 'ratio' as CalcType, calc_value: 0.40, min_amount: 50000, max_amount: null },
  { category: '貯金', sort_order: 4, calc_type: 'ratio' as CalcType, calc_value: 0.15, min_amount: null, max_amount: null },
  { category: 'パーソナル', sort_order: 5, calc_type: 'ratio' as CalcType, calc_value: 0.15, min_amount: null, max_amount: null },
]

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  settings: [],
  monthlyBudget: null,
  loading: false,

  fetchData: async (yearMonth: string) => {
    set({ loading: true })
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      set({ loading: false })
      return
    }

    // Fetch Budget
    const { data: budgetData } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('year_month', yearMonth)
      .maybeSingle()
      
    // Fetch Settings
    const { data: settingsData } = await supabase
      .from('portfolio_settings')
      .select('*')
      .order('sort_order', { ascending: true })

    // If no settings exist for this user, initialize defaults (client-side initialization)
    if (!settingsData || settingsData.length === 0) {
      const inserts = defaultCategories.map(cat => ({ ...cat, user_id: user.id }))
      const { data: newSettings } = await supabase
        .from('portfolio_settings')
        .insert(inserts)
        .select()
        .order('sort_order', { ascending: true })
        
      set({ 
        monthlyBudget: budgetData as MonthlyBudget | null, 
        settings: (newSettings || []) as PortfolioSetting[], 
        loading: false 
      })
    } else {
      set({ 
        monthlyBudget: budgetData as MonthlyBudget | null, 
        settings: settingsData as PortfolioSetting[], 
        loading: false 
      })
    }
  },

  setExpectedIncome: async (yearMonth: string, amount: number) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: 'Not authenticated' }

    const existingId = get().monthlyBudget?.id

    let error;
    let newBudget;
    
    if (existingId) {
      const { data, error: updateError } = await supabase
        .from('monthly_budgets')
        .update({ expected_income: amount })
        .eq('id', existingId)
        .select()
        .single()
      error = updateError?.message
      newBudget = data
    } else {
      const { data, error: insertError } = await supabase
        .from('monthly_budgets')
        .insert({ user_id: user.id, year_month: yearMonth, expected_income: amount })
        .select()
        .single()
      error = insertError?.message
      newBudget = data
    }

    if (!error) {
      set({ monthlyBudget: newBudget as MonthlyBudget })
    }
    return { error: error || null }
  },

  updateSetting: async (id, updates) => {
    const { error } = await supabase
      .from('portfolio_settings')
      .update(updates)
      .eq('id', id)
      
    if (error) return { error: error.message }
    
    // Refresh local state to keep sync
    set((state) => ({
      settings: state.settings.map(s => s.id === id ? { ...s, ...updates } : s)
    }))
    return { error: null }
  },

  addSetting: async (setting) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: 'Not authenticated' }

    const { data, error } = await supabase
      .from('portfolio_settings')
      .insert({ ...setting, user_id: user.id })
      .select()
      .single()

    if (error) return { error: error.message }
    
    set((state) => ({
      settings: [...state.settings, data as PortfolioSetting].sort((a, b) => a.sort_order - b.sort_order)
    }))
    return { error: null }
  },

  deleteSetting: async (id) => {
    const { error } = await supabase
      .from('portfolio_settings')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }

    set((state) => ({
      settings: state.settings.filter((s) => s.id !== id)
    }))
    return { error: null }
  },
  
  reorderSettings: async (orderedIds) => {
    const { settings } = get()
    
    // Optimistic UI update
    const updatedSettings = orderedIds.map((id, index) => {
      const setting = settings.find(s => s.id === id)!
      return { ...setting, sort_order: index + 1 }
    })
    set({ settings: updatedSettings })

    // Bulk update in DB
    // Simple loop for now (Supabase JS doesn't have a single call bulk update yet without RPC, but this is fine for ~5 rows)
    for (const [index, id] of orderedIds.entries()) {
      await supabase.from('portfolio_settings').update({ sort_order: index + 1 }).eq('id', id)
    }
    
    return { error: null }
  },

  // Core Allocation Algorithm
  getAllocation: () => {
    const { settings, monthlyBudget } = get()
    const expectedIncome = monthlyBudget?.expected_income || 0
    let distribution = expectedIncome

    // Pre-calculate sum of all ratios
    let remainingRatioSum = settings
      .filter((s) => s.calc_type === 'ratio')
      .reduce((acc, s) => acc + s.calc_value, 0)

    const consequence: PortfolioAllocation[] = []

    // Process in order of sort_order
    const sortedSettings = [...settings].sort((a, b) => a.sort_order - b.sort_order)

    for (let i = 0; i < sortedSettings.length; i++) {
      const s = sortedSettings[i]
      let value = 0
      let isAdjustedMin = false
      let isAdjustedMax = false

      if (s.calc_type === 'sum') {
        // Fixed Amount
        value = s.calc_value
      } else {
        // Ratio Amount
        let effectiveRatio = remainingRatioSum > 0 ? s.calc_value / remainingRatioSum : 0
        value = distribution * effectiveRatio

        // Min/Max correction
        if (s.max_amount !== null && value > s.max_amount) {
          value = s.max_amount
          isAdjustedMax = true
        }
        if (s.min_amount !== null && value < s.min_amount) {
          value = s.min_amount
          isAdjustedMin = true
        }

        // Deduct ratio regardless of correction (automatic redistribution)
        remainingRatioSum -= s.calc_value
      }

      // Round to nearest 100 as per common japanese budget logic, or just floor
      value = Math.floor(value)

      consequence.push({
        category: s.category,
        value,
        isAdjustedMin,
        isAdjustedMax,
      })

      distribution -= value
      // Safety net: don't let distribution go negative if bad settings exist
      if (distribution < 0) distribution = 0
    }

    return consequence
  },
}))
