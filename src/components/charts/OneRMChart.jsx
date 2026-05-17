// src/components/charts/OneRMChart.jsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gym-surface border border-gym-border rounded-xl
                    px-4 py-3 text-sm">
      <p className="text-gym-muted text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">
        {payload[0].value} lbs est. 1RM
      </p>
    </div>
  )
}

export default function OneRMChart({ data, color = '#22c55e' }) {
  if (!data?.length) return (
    <div className="h-56 flex items-center justify-center">
      <p className="text-gym-muted text-sm">Log workouts to see 1RM trend</p>
    </div>
  )

  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    }),
    estimated1rm: Math.round(d.estimated1rm)
  }))

  const max = Math.max(...formatted.map(d => d.estimated1rm))
  const min = Math.min(...formatted.map(d => d.estimated1rm))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted}
                 margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="oneRMGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.15}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/>
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[Math.max(0, min - 10), max + 10]}
        />
        <Tooltip content={<CustomTooltip/>}/>
        <Area
          type="monotone"
          dataKey="estimated1rm"
          stroke={color}
          strokeWidth={2.5}
          fill="url(#oneRMGrad)"
          dot={{ fill: color, r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: color, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}