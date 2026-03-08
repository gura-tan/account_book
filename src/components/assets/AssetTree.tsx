import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, Coins, Plus, Trash2, Edit3, Wallet } from 'lucide-react'
import type { AssetTreeNode  } from '../../types'
import { useAssetStore } from '../../stores/assetStore'

interface AssetNodeProps {
  node: AssetTreeNode
  depth: number
  onEdit: (asset: AssetTreeNode) => void
  onAddChild: (parentId: string) => void
}

function AssetNode({ node, depth, onEdit, onAddChild }: AssetNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const { deleteAsset } = useAssetStore()
  const isFolder = node.asset_type === 'folder'
  const hasChildren = node.children.length > 0

  const folderTotal = isFolder
    ? node.children.reduce((sum, child) => {
        if (child.asset_type === 'asset') return sum + child.balance
        // Recursive sum for nested folders
        const childSum = (n: AssetTreeNode): number => {
          if (n.asset_type === 'asset') return n.balance
          return n.children.reduce((s, c) => s + childSum(c), 0)
        }
        return sum + childSum(child)
      }, 0)
    : node.balance

  const handleDelete = async () => {
    if (confirm(`「${node.name}」を削除しますか？`)) {
      await deleteAsset(node.id)
    }
  }

  return (
    <div className="animate-fade-in">
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors group cursor-pointer"
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
        onClick={() => isFolder && setExpanded(!expanded)}
      >
        {/* Expand/collapse icon */}
        <span className="w-5 h-5 flex items-center justify-center shrink-0">
          {isFolder && hasChildren ? (
            expanded ? (
              <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
            ) : (
              <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
            )
          ) : null}
        </span>

        {/* Icon */}
        {isFolder ? (
          <Folder size={18} className="text-[var(--color-text-secondary)] shrink-0" />
        ) : (
          <Coins size={18} className="text-[var(--color-accent)] shrink-0" />
        )}

        {/* Name */}
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>

        {/* Balance / Total */}
        <span
          className={`text-sm font-semibold tabular-nums ${
            folderTotal < 0 ? 'text-[var(--color-expense)]' : 'text-[var(--color-text-primary)]'
          }`}
        >
          ¥{folderTotal.toLocaleString()}
        </span>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {isFolder && (
            <button
              className="btn btn-ghost btn-icon p-1"
              onClick={(e) => {
                e.stopPropagation()
                onAddChild(node.id)
              }}
              title="追加"
            >
              <Plus size={14} />
            </button>
          )}
          <button
            className="btn btn-ghost btn-icon p-1"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(node)
            }}
            title="編集"
          >
            <Edit3 size={14} />
          </button>
          <button
            className="btn btn-ghost btn-icon p-1 text-[var(--color-expense)]"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            title="削除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children */}
      {isFolder && expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <AssetNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface AssetTreeProps {
  onEdit: (asset: AssetTreeNode) => void
  onAddChild: (parentId: string | null) => void
  onNavigate?: (id: string) => void
}

export function AssetTree({ onEdit, onAddChild }: AssetTreeProps) {
  const { getTree } = useAssetStore()
  const tree = getTree()

  if (tree.length === 0) {
    return (
      <div className="empty-state">
        <Wallet size={40} className="text-[var(--color-text-muted)]" />
        <p>資産がまだありません</p>
        <button className="btn btn-primary mt-2" onClick={() => onAddChild(null)}>
          <Plus size={16} />
          資産を追加
        </button>
      </div>
    )
  }

  return (
    <div className="card p-2">
      {tree.map((node) => (
        <AssetNode
          key={node.id}
          node={node}
          depth={0}
          onEdit={onEdit}
          onAddChild={onAddChild}
        />
      ))}
    </div>
  )
}

