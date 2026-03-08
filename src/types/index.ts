export interface Profile {
  id: string
  display_name: string
  created_at: string
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
