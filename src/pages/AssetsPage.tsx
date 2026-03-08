import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { AssetTree } from '../components/assets/AssetTree'
import { AssetForm } from '../components/assets/AssetForm'
import { PortfolioChart } from '../components/portfolio/PortfolioChart'
import { PortfolioSettings } from '../components/portfolio/PortfolioSettings'
import { useAssetStore } from '../stores/assetStore'
import { usePortfolioStore } from '../stores/portfolioStore'
import type { Asset, AssetTreeNode } from '../types'

interface AssetsPageProps {
  onNavigate?: (id: string) => void
}

export function AssetsPage({ onNavigate }: AssetsPageProps) {
  const [activeTab, setActiveTab] = useState<'assets' | 'portfolio'>('assets')
  const { assets, loading: assetsLoading, fetchAssets } = useAssetStore()
  const { fetchData: fetchPortfolio, getAllocation } = usePortfolioStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [addParentId, setAddParentId] = useState<string | null>(null)

  useEffect(() => {
    fetchAssets()
    const yyyymm = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    fetchPortfolio(yyyymm)
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

  const allocations = getAllocation()

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
      {/* Header Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
          type="button"
        >
          資産リスト
        </button>
        <button
          className={`tab-item ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
          type="button"
        >
          ポートフォリオ
        </button>
      </div>

      {activeTab === 'assets' ? (
        <>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-lg font-semibold">現在の資産</h2>
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
          {assetsLoading ? (
            <div className="empty-state">
              <p className="text-sm">読み込み中...</p>
            </div>
          ) : (
            <AssetTree onEdit={handleEdit} onAddChild={handleAddChild} onNavigate={onNavigate} />
          )}

          {/* Form Modal */}
          {showForm && (
            <AssetForm
              parentId={addParentId}
              editingAsset={editingAsset}
              onClose={handleClose}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col gap-6 mt-2 animate-fade-in">
          <h2 className="text-lg font-semibold">今月のポートフォリオ</h2>
          <div className="card flex items-center justify-center p-2">
            <PortfolioChart data={allocations} />
          </div>
          <PortfolioSettings />
        </div>
      )}
    </div>
  )
}
