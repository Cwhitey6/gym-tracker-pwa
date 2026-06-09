/**
 * OneRMChart.jsx
 * 
 * Shows your estimated one-rep max over time as an area chart
 * (basically a line chart with a shaded area underneath it).
 * 
 * The 1RM is calculated using the Epley formula: weight × (1 + reps/30)
 * so even if you never actually attempt a true 1 rep max, this estimates
 * it based on the sets you log. The green line going up means you're 
 * getting stronger.
 * 
 * Learn more about the Epley formula:
 * https://en.wikipedia.org/wiki/One-repetition_maximum#Epley_formula
 */

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

// This is the little popup box that appears when you hover over a data point
// "active" means your mouse is currently hovering, "payload" is the data at that point
// "label" is the date label on the x-axis
const CustomTooltip = ({ active, payload, label }) => {
  // if the user isn't hovering over anything then don't render anything
  if (!active || !payload?.length) return null

  return (
    <div className="bg-gym-surface border border-gym-border rounded-xl px-4 py-3 text-sm">
      {/* the date shown at the top of the tooltip */}
      <p className="text-gym-muted text-xs mb-1">{label}</p>
      {/* the actual estimated 1RM value at that date */}
      <p className="text-white font-semibold">
        {payload[0].value} lbs est. 1RM
      </p>
    </div>
  )
} // ← this closing bracket was missing

// the main chart component
// "data" comes from ProgressPage (the array of sessions for a given exercise)
// "color" defaults to green but the parent can pass in a different color if needed
export default function OneRMChart({ data, color = '#22c55e' }) {

  // displayed message for when there isnt data yet
  if (!data?.length) return (
    <div className="h-56 flex items-center justify-center">
      <p className="text-gym-muted text-sm">Log workouts to see 1RM trend</p>
    </div>
  )

  // reformat the raw data so recharts can read it properly
  // converts the date from "2024-05-14" to something readable like "May 14"
  // rounds the 1RM to a whole number so it doesn't show decimals on the chart
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    }),
    estimated1rm: Math.round(d.estimated1rm)
  }))

  // figure out the highest and lowest 1RM values in the data
  // sets the y-axis range to fit the data nicely
  const max = Math.max(...formatted.map(d => d.estimated1rm))
  const min = Math.min(...formatted.map(d => d.estimated1rm))

  return (
    // ResponsiveContainer makes the chart fill whatever width its given
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

        {/* defines the green gradient fill under the line fading from 15% opacity to 0 at the bottom */}
        <defs>
          <linearGradient id="oneRMGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.15}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>

        {/* subtle horizontal grid lines, vertical ones are turned off */}
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/>

        {/* x-axis shows the dates along the bottom */}
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        {/* y-axis shows the weight values on the left
            the domain adds 10lbs of padding above and below so the line
            doesn't sit right at the edge of the chart */}
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[Math.max(0, min - 10), max + 10]}
        />

        {/* the hover tooltip defined above */}
        <Tooltip content={<CustomTooltip/>}/>

        {/* the actual line + shaded area
            - stroke is the line color
            - fill references the gradient we defined above
            - dot is the small circle on each data point
            - activeDot is the bigger circle that appears on hover */}
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