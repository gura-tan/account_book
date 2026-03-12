export interface Profile {
  id: string
  display_name: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  created_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export interface Asset {
  id: string
  user_id: string
  group_id: string | null
  parent_id: string | null
  name: string
  asset_type: 'folder' | 'asset'
  balance: number
  sharing: 'none' | 'default' | 'full'
  sort_order: number
  is_virtual: boolean
  created_at: string
}

export interface AssetTreeNode extends Asset {
  children: AssetTreeNode[]
}

export interface Transaction {
  id: string
  user_id: string
  group_id: string | null
  book_type: 'shared' | 'personal'
  tx_type: 'income' | 'expense' | 'transfer'
  amount: number
  asset_id: string | null
  from_asset_id: string | null
  to_asset_id: string | null
  category: string
  description: string
  tx_date: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  tx_type: 'income' | 'expense'
  sort_order: number
}

export type TxType = 'income' | 'expense' | 'transfer'
export type BookType = 'shared' | 'personal'
export type SharingType = 'none' | 'default' | 'full'
export type CalcType = 'sum' | 'ratio'

export interface MonthlyBudget {
  id: string
  user_id: string
  year_month: string
  expected_income: number
  created_at: string
}

export interface PortfolioSetting {
  id: string
  user_id: string
  category: string
  sort_order: number
  calc_type: CalcType
  calc_value: number
  min_amount: number | null
  max_amount: number | null
  is_deducted: boolean
  created_at: string
}

export interface PortfolioAllocation {
  category: string
  value: number
  isAdjustedMin?: boolean
  isAdjustedMax?: boolean
  isDeducted?: boolean
}
