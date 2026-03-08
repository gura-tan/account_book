import { useState } from 'react'
import { Plus, Trash2, Settings2 } from 'lucide-react'
import { usePortfolioStore } from '../../stores/portfolioStore'
import type { PortfolioSetting } from '../../types'

export function PortfolioSettings() {
  const { settings, monthlyBudget, setExpectedIncome, addSetting, loading } = usePortfolioStore()
  const [expectedIncome, setIncomeInput] = useState(monthlyBudget?.expected_income.toString() || '0')
  const [savingIncome, setSavingIncome] = useState(false)

  // New item state
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState('')

  const handleIncomeSave = async () => {
    setSavingIncome(true)
    const yyyymm = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    await setExpectedIncome(yyyymm, parseInt(expectedIncome) || 0)
    setSavingIncome(false)
  }

  const handleAdd = async () => {
    if (!newCat.trim()) return
    const newOrder = settings.length > 0 ? Math.max(...settings.map(s => s.sort_order)) + 1 : 1
    await addSetting({
      category: newCat.trim(),
      sort_order: newOrder,
      calc_type: 'ratio',
      calc_value: 0.1,
      min_amount: null,
      max_amount: null,
      is_deducted: false
    })
    setNewCat('')
    setShowAdd(false)
  }

  if (loading) {
    return <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">読み込み中...</div>
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Expected Income */}
      <div className="card">
        <h3 className="text-sm font-bold mb-3">今月の予想収入</h3>
        <div className="flex gap-2">
          <input
            type="number"
            className="input text-lg font-bold"
            value={expectedIncome}
            onChange={(e) => setIncomeInput(e.target.value)}
            placeholder="0"
          />
          <button 
            className="btn btn-primary whitespace-nowrap"
            onClick={handleIncomeSave}
            disabled={savingIncome || expectedIncome === monthlyBudget?.expected_income.toString()}
          >
            {savingIncome ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* Settings List */}
      <div className="card p-0 overflow-hidden">
        <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="text-sm font-bold">配分ルール (優先度順)</h3>
          <button className="btn btn-ghost btn-icon p-1" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={16} />
          </button>
        </div>

        {showAdd && (
          <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-hover)] flex gap-2">
            <input 
              type="text" 
              className="input py-1.5 px-3" 
              placeholder="新しいカテゴリ名" 
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              autoFocus
            />
            <button className="btn btn-primary py-1.5 px-3" onClick={handleAdd}>追加</button>
          </div>
        )}

        <div className="flex flex-col">
          {settings.map((s, index) => (
            <SettingItem key={s.id} setting={s} index={index + 1} />
          ))}
          {settings.length === 0 && (
            <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
              配分ルールがありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingItem({ setting, index }: { setting: PortfolioSetting, index: number }) {
  const { updateSetting, deleteSetting } = usePortfolioStore()
  const [expanded, setExpanded] = useState(false)

  const isRatio = setting.calc_type === 'ratio'
  
  // Format for display (ratio is stored as 0.2, displayed as 20)
  const displayValue = isRatio ? Math.round(setting.calc_value * 100) : setting.calc_value

  const handleUpdate = (field: keyof PortfolioSetting, val: any) => {
    if (field === 'calc_value' && isRatio) {
      val = val / 100 // Convert percentage back to decimal
    }
    updateSetting(setting.id, { [field]: val })
  }

  const handleTypeChange = () => {
    const newType = isRatio ? 'sum' : 'ratio'
    const newVal = newType === 'ratio' ? 0.1 : 10000
    updateSetting(setting.id, { calc_type: newType, calc_value: newVal, min_amount: null, max_amount: null })
  }

  return (
    <div className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors">
      <div className="flex items-center gap-2 p-3">
        <span className="text-xs font-bold text-[var(--color-text-muted)] w-4 text-right">{index}</span>
        
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span className="font-medium text-sm truncate pr-2">{setting.category}</span>
          
          <div className="flex items-center gap-2">
            <span className="badge bg-[var(--color-bg-input)] text-[var(--color-text-primary)] border border-[var(--color-border)]">
              {isRatio ? '割合' : '固定額'}
            </span>
            <span className="text-sm font-bold tabular-nums w-16 text-right cursor-pointer underline decoration-[var(--color-border)] underline-offset-4" onClick={() => setExpanded(!expanded)}>
              {displayValue}{isRatio ? '%' : '円'}
            </span>
          </div>
        </div>

        <button className="btn btn-ghost btn-icon p-1" onClick={() => setExpanded(!expanded)}>
          <Settings2 size={16} className={expanded ? 'text-[var(--color-accent)]' : ''} />
        </button>
      </div>

      {/* Expanded Edit Form */}
      {expanded && (
        <div className="p-3 pt-0 pl-9 pb-4 animate-slide-down">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">計算方法</label>
              <select className="select py-1.5 px-2" value={setting.calc_type} onChange={handleTypeChange}>
                <option value="ratio">残り割合 (%)</option>
                <option value="sum">固定額 (円)</option>
              </select>
            </div>
            <div>
              <label className="label">{isRatio ? '割合 (%)' : '金額 (円)'}</label>
              <input 
                type="number" 
                className="input py-1.5 px-2 font-bold" 
                value={displayValue} 
                onChange={(e) => handleUpdate('calc_value', parseFloat(e.target.value) || 0)}
              />
            </div>
            {isRatio && (
              <>
                <div>
                  <label className="label">最低額 (円)</label>
                  <input 
                    type="number" 
                    className="input py-1.5 px-2" 
                    placeholder="なし"
                    value={setting.min_amount || ''} 
                    onChange={(e) => handleUpdate('min_amount', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
                <div>
                  <label className="label">最高額 (円)</label>
                  <input 
                    type="number" 
                    className="input py-1.5 px-2" 
                    placeholder="なし"
                    value={setting.max_amount || ''} 
                    onChange={(e) => handleUpdate('max_amount', e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>
              </>
            )}
            <div className="col-span-2 mt-1">
              <label className="flex items-center gap-2 cursor-pointer w-fit pl-1">
                <input 
                  type="checkbox" 
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] bg-[var(--color-bg-input)] h-4 w-4"
                  checked={setting.is_deducted}
                  onChange={(e) => handleUpdate('is_deducted', e.target.checked)}
                />
                <span className="text-sm font-medium">予想収入から天引き</span>
              </label>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 pl-6">
                ※チェックを入れると、この額が毎月自動記録される予想収入額から差し引かれます
              </p>
            </div>
          </div>
          
          <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
            <button 
              className="btn btn-ghost text-[var(--color-expense)] py-1.5 px-3 text-xs"
              onClick={() => {
                if (confirm(`「${setting.category}」を削除しますか？`)) {
                  deleteSetting(setting.id)
                }
              }}
            >
              <Trash2 size={14} className="mr-1 inline" /> 削除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
