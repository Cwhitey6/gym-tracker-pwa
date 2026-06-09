/**
 * WeightChart.jsx
 * 
 * Shows your max weight lifted per session over time as a line chart.
 * Each dot on the line represents the heaviest set you logged on that day
 * for a given exercise. There's also a dashed reference line that marks
 * your all time PR so you can see how close you're getting to beating it.
 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

// the little popup that appears when you hover over a data point
// "active" means you're hovering, "payload" is the data at that point
// "label" is the date shown on the x-axis
const CustomTooltip = ({ active, payload, label }) => {
  // if the user isn't hovering over anything then don't render anything
  if (!active || !payload?.length) return null

  return (
    <div className="bg-gym-surface border border-gym-border rounded-xl px-4 py-3 text-sm shadow-lg">
      
      {/* the date shown at the top of the tooltip */}
      <p className="text-gym-muted text-xs mb-1">{label}</p>
      
      {/* the max weight lifted on that date */}
      <p className="text-white font-semibold">
        {payload[0].value} lbs
      </p>
    </div>
  )
}

// the main chart component
// "data" comes from ProgressPage (the array of sessions for a given exercise)
// "color" defaults to orange but the parent can pass in a different color if needed
export default function WeightChart({ data, color = '#e85d04' }) {

  // show message for when there isn't any data to display yet
  if (!data?.length) return <EmptyChart message="Log workouts to see weight progress"/>

  // reformat the raw data so recharts can read it properly
  // converts the date from "2024-05-14" to something readable like "May 14"
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    })
  }))

  // find the highest and lowest weights across all sessions
  // used to set the y-axis range so the line fits nicely in the chart
  const max = Math.max(...data.map(d => d.maxWeight))
  const min = Math.min(...data.map(d => d.maxWeight))

  return (
    // ResponsiveContainer makes the chart fill whatever width its given
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

        {/* subtle horizontal grid lines, vertical ones are turned off */}
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false}/>

        {/* x-axis shows the dates along the bottom */}
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        {/* y-axis shows the weight on the left
            the domain adds 10lbs of padding above and below so the
            line doesn't sit right at the edge of the chart */}
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[Math.max(0, min - 10), max + 10]}
        />

        {/* the hover tooltip defined above */}
        <Tooltip content={<CustomTooltip/>}/>

        {/* dashed reference line that marks PR
            only shows up if you actually have data (max > 0)
            sits at the top of the chart so you can see how close
            your recent sessions are getting to your all time best */}
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

        {/* the actual line connecting all the data points
            - dot is the small circle on each data point
            - activeDot is the bigger circle that appears on hover */}
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

// simple empty state component used when there's no data yet
// kept separate so the main component stays clean
function EmptyChart({ message }) {
  return (
    <div className="h-56 flex items-center justify-center">
      <p className="text-gym-muted text-sm">{message}</p>
    </div>
  )
}