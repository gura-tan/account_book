import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthNavigatorProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

export function MonthNavigator({ year, month, onPrev, onNext }: MonthNavigatorProps) {
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className="flex items-center justify-between py-2">
      <button onClick={onPrev} className="btn btn-ghost btn-icon" aria-label="前月">
        <ChevronLeft size={20} />
      </button>
      <div className="text-center">
        <span className="text-lg font-semibold">
          {year}年 {month}月
        </span>
        {isCurrentMonth && (
          <span className="ml-2 badge bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
            今月
          </span>
        )}
      </div>
      <button onClick={onNext} className="btn btn-ghost btn-icon" aria-label="翌月">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
