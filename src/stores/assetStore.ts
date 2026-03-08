import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Asset, AssetTreeNode, SharingType } from '../types'

interface AssetState {
  assets: Asset[]
  loading: boolean
  fetchAssets: () => Promise<void>
  createAsset: (data: {
    name: string
    parent_id: string | null
    asset_type: 'folder' | 'asset'
    balance?: number
    sharing?: SharingType
  }) => Promise<{ error: string | null }>
  updateAsset: (
    id: string,
    updates: Partial<Pick<Asset, 'name' | 'balance' | 'sharing' | 'sort_order'>>
  ) => Promise<{ error: string | null }>
  deleteAsset: (id: string) => Promise<{ error: string | null }>
  getTree: () => AssetTreeNode[]
  getAssetById: (id: string) => Asset | undefined
  getLeafAssets: () => Asset[]
}

function buildTree(assets: Asset[]): AssetTreeNode[] {
  const map = new Map<string, AssetTreeNode>()
  const roots: AssetTreeNode[] = []

  // Create nodes
  for (const asset of assets) {
    map.set(asset.id, { ...asset, children: [] })
  }

  // Build hierarchy
  for (const asset of assets) {
    const node = map.get(asset.id)!
    if (asset.parent_id && map.has(asset.parent_id)) {
      map.get(asset.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children
  const sortNodes = (nodes: AssetTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    for (const node of nodes) {
      sortNodes(node.children)
    }
  }
  sortNodes(roots)

  return roots
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  loading: false,

  fetchAssets: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('sort_order', { ascending: true })
    if (!error && data) {
      set({ assets: data as Asset[] })
    }
    set({ loading: false })
  },

  createAsset: async ({ name, parent_id, asset_type, balance = 0, sharing = 'default' }) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return { error: '認証されていません' }

    const { error } = await supabase.from('assets').insert({
      user_id: user.id,
      name,
      parent_id,
      asset_type,
      balance: asset_type === 'folder' ? 0 : balance,
      sharing,
    })

    if (error) return { error: error.message }
    await get().fetchAssets()
    return { error: null }
  },

  updateAsset: async (id, updates) => {
    const { error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)

    if (error) return { error: error.message }
    await get().fetchAssets()
    return { error: null }
  },

  deleteAsset: async (id) => {
    const { error } = await supabase.from('assets').delete().eq('id', id)
    if (error) return { error: error.message }
    await get().fetchAssets()
    return { error: null }
  },

  getTree: () => buildTree(get().assets),

  getAssetById: (id: string) => get().assets.find((a) => a.id === id),

  getLeafAssets: () => get().assets.filter((a) => a.asset_type === 'asset'),
}))
