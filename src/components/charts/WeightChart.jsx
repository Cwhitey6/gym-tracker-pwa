// src/components/charts/WeightChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gym-surface border border-gym-border rounded-xl
                    px-4 py-3 text-sm shadow-lg">
      <p className="text-gym-muted text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">
        {payload[0].value} lbs
      </p>
    </div>
  )
}

export default function WeightChart({ data, color = '#e85d04' }) {
  if (!data?.length) return <EmptyChart message="Log workouts to see weight progress"/>

  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    })
  }))

  const max = Math.max(...data.map(d => d.maxWeight))
  const min = Math.min(...data.map(d => d.maxWeight))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted}
                 margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        {max > 0 && (
          <ReferenceLine
            y={max}
            stroke={color}
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{
              value: `PR: ${max} lbs`,
              fill: color,
              fontSize: 10,
              position: 'insideTopRight'
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="maxWeight"
          stroke={color}
          strokeWidth={2.5}
          dot={{ fill: color, r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: color, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="h-56 flex items-center justify-center">
      <p className="text-gym-muted text-sm">{message}</p>
    </div>
  )
}