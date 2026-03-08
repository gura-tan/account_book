import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { AssetTree } from '../components/assets/AssetTree'
import { AssetForm } from '../components/assets/AssetForm'
import { useAssetStore } from '../stores/assetStore'
import type { Asset, AssetTreeNode } from '../types'

export function AssetsPage() {
  const { assets, loading, fetchAssets } = useAssetStore()
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [addParentId, setAddParentId] = useState<string | null>(null)

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleEdit = (asset: AssetTreeNode) => {
    setEditingAsset(asset)
    setAddParentId(null)
    setShowForm(true)
  }

  const handleAddChild = (parentId: string | null) => {
    setEditingAsset(null)
    setAddParentId(parentId)
    setShowForm(true)
  }

  const handleClose = () => {
    setShowForm(false)
    setEditingAsset(null)
    setAddParentId(null)
  }

  // Calculate total
  const totalBalance = assets
    .filter((a) => a.asset_type === 'asset')
    .reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">資産</h2>
        <button
          className="btn btn-primary"
          onClick={() => handleAddChild(null)}
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {/* Total */}
      <div className="card text-center">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">総資産</p>
        <p
          className={`text-2xl font-bold ${
            totalBalance >= 0 ? 'text-[var(--color-text-primary)]' : 'amount-expense'
          }`}
        >
          ¥{totalBalance.toLocaleString()}
        </p>
      </div>

      {/* Tree */}
      {loading ? (
        <div className="empty-state">
          <p className="text-sm">読み込み中...</p>
        </div>
      ) : (
        <AssetTree onEdit={handleEdit} onAddChild={handleAddChild} />
      )}

      {/* Form Modal */}
      {showForm && (
        <AssetForm
          parentId={addParentId}
          editingAsset={editingAsset}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
