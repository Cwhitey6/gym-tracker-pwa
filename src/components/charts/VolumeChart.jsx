// src/components/charts/VolumeChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gym-surface border border-gym-border rounded-xl
                    px-4 py-3 text-sm">
      <p className="text-gym-muted text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">
        {Math.round(payload[0].value).toLocaleString()} lbs
      </p>
    </div>
  )
}

export default function VolumeChart({ data, color = '#6366f1' }) {
  if (!data?.length) return (
    <div className="h-56 flex items-center justify-center">
      <p className="text-gym-muted text-sm">Log workouts to see volume data</p>
    </div>
  )

  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    })
  }))

  const maxVolume = Math.max(...formatted.map(d => d.volume))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted}
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
          tickFormatter={v => `${Math.round(v / 1000)}k`}
        />
        <Tooltip content={<CustomTooltip/>}/>
        <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
          {formatted.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.volume === maxVolume ? color : color + '66'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}