import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { PortfolioAllocation } from '../../types'

interface PortfolioChartProps {
  data: PortfolioAllocation[]
}

const COLORS = [
  'var(--color-accent)',
  'var(--color-income)',
  'var(--color-transfer)',
  'var(--color-expense)',
  '#a855f7', // purple
  '#10b981', // emerald
  '#f43f5e', // rose
  '#0ea5e9', // sky
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PortfolioAllocation
    return (
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-3 rounded-xl shadow-lg animate-fade-in text-sm">
        <p className="font-bold mb-1">{data.category}</p>
        <p className="tabular-nums">
          ¥{data.value.toLocaleString()}
        </p>
        {(data.isAdjustedMin || data.isAdjustedMax) && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {data.isAdjustedMin ? '※最低額補正あり' : '※最高額補正あり'}
          </p>
        )}
      </div>
    )
  }
  return null
}

export function PortfolioChart({ data }: PortfolioChartProps) {
  // Filter out zero values for the pie chart
  const chartData = data.filter((d) => d.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        グラフを描画するデータがありません
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="category"
            stroke="none"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
