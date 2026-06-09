/**
 * VolumeChart.jsx
 * 
 * Shows your total volume per session as a bar chart.
 * Volume is calculated as weight × reps across all sets in a session.
 * The brightest bar is always your highest volume session.
 */

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

// the little popup that appears when you hover over a bar
// "active" means you're hovering, "payload" is the data at that bar
// "label" is the date shown on the x-axis
const CustomTooltip = ({ active, payload, label }) => {
  // if the user isn't hovering over anything then don't render anything
  if (!active || !payload?.length) return null

  return (
    <div className="bg-gym-surface border border-gym-border rounded-xl px-4 py-3 text-sm">
      
      {/* the date shown at the top of the tooltip */}
      <p className="text-gym-muted text-xs mb-1">{label}</p>
      
      {/* the total volume for that session, formatted with commas */}
      <p className="text-white font-semibold">
        {Math.round(payload[0].value).toLocaleString()} lbs
      </p>
    </div>
  )
}

// the main chart component
// "data" comes from ProgressPage (the array of sessions for a given exercise)
// "color" defaults to purple but the parent can pass in a different color if needed
export default function VolumeChart({ data, color = '#6366f1' }) {

  // default message when there isn't any data to show yet
  if (!data?.length) return (
    <div className="h-56 flex items-center justify-center">
      <p className="text-gym-muted text-sm">Log workouts to see volume data</p>
    </div>
  )

  // reformat the raw data so recharts can read it properly
  // converts the date from "2024-05-14" to something readable like "May 14"
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    })
  }))

  // find the highest volume session so we can highlight that bar
  const maxVolume = Math.max(...formatted.map(d => d.volume))

  return (
    // ResponsiveContainer makes the chart fill whatever width its given
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

        {/* subtle horizontal grid lines, vertical ones are turned off */}
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/>

        {/* x-axis shows the dates along the bottom */}
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        {/* y-axis shows the volume on the left
            formatted as "3k" instead of "3000" to save space */}
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${Math.round(v / 1000)}k`}
        />

        {/* the hover tooltip defined above */}
        <Tooltip content={<CustomTooltip/>}/>

        {/* the bars (radius gives them rounded top corners)
            each bar gets its own color via the Cell component:
            - full color for the highest volume session
            - faded color (66 = 40% opacity) for everything else */}
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