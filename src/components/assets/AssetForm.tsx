import { useState } from 'react'
import { X } from 'lucide-react'
import { useAssetStore } from '../../stores/assetStore'
import type { Asset, SharingType } from '../../types'

interface AssetFormProps {
  parentId: string | null
  editingAsset?: Asset | null
  onClose: () => void
}

export function AssetForm({ parentId, editingAsset, onClose }: AssetFormProps) {
  const { createAsset, updateAsset } = useAssetStore()
  const [name, setName] = useState(editingAsset?.name ?? '')
  const [assetType, setAssetType] = useState<'folder' | 'asset'>(
    editingAsset?.asset_type ?? 'asset'
  )
  const [balance, setBalance] = useState(editingAsset?.balance?.toString() ?? '0')
  const [sharing, setSharing] = useState<SharingType>(editingAsset?.sharing ?? 'default')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isEditing = !!editingAsset

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (isEditing) {
      const result = await updateAsset(editingAsset.id, {
        name,
        balance: parseInt(balance) || 0,
        sharing,
      })
      if (result.error) {
        setError(result.error)
        setSaving(false)
        return
      }
    } else {
      const result = await createAsset({
        name,
        parent_id: parentId,
        asset_type: assetType,
        balance: parseInt(balance) || 0,
        sharing,
      })
      if (result.error) {
        setError(result.error)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? '資産を編集' : '資産を追加'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="label">名前</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 三井住友銀行"
              required
              autoFocus
            />
          </div>

          {/* Type */}
          {!isEditing && (
            <div>
              <label className="label">タイプ</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn flex-1 ${
                    assetType === 'asset' ? 'btn-primary' : 'btn-secondary'
                  }`}
                  onClick={() => setAssetType('asset')}
                >
                  資産
                </button>
                <button
                  type="button"
                  className={`btn flex-1 ${
                    assetType === 'folder' ? 'btn-primary' : 'btn-secondary'
                  }`}
                  onClick={() => setAssetType('folder')}
                >
                  フォルダ
                </button>
              </div>
            </div>
          )}

          {/* Balance (only for asset type) */}
          {assetType === 'asset' && (
            <div>
              <label className="label">残高（円）</label>
              <input
                type="number"
                className="input"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {/* Sharing */}
          <div>
            <label className="label">共有設定</label>
            <select
              className="select"
              value={sharing}
              onChange={(e) => setSharing(e.target.value as SharingType)}
            >
              <option value="none">非共有</option>
              <option value="default">一方のみ共有</option>
              <option value="full">完全共有</option>
            </select>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {sharing === 'none' && '他のユーザーにはこの資産が表示されません'}
              {sharing === 'default' &&
                '他のユーザーは資産の存在のみ確認できますが、残高やログは見えません'}
              {sharing === 'full' &&
                '他のユーザーもすべてのログを確認・追加できます'}
            </p>
          </div>

          {error && (
            <p className="text-[var(--color-expense)] text-sm animate-slide-down">
              {error}
            </p>
          )}

          <div className="flex gap-2 mt-2">
            <button type="button" className="btn btn-secondary flex-1" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? '保存中...' : isEditing ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
