/**
 * Layout.jsx
 * 
 * The main shell that wraps every page in the app.
 * It handles the two different navigation styles depending on screen size
 * - On desktop (md and above): shows the sidebar on the left
 * - On mobile (below md): shows the bottom tab bar
 * 
 * Every protected page gets wrapped in this component instead
 * of adding the nav manually to each page.
 */

import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

// "children" is whatever page content gets passed into this component
// example: <Layout><DashboardPage/></Layout>
export default function Layout({ children }) {
  return (
    <div className="flex bg-gym-bg min-h-screen">

      {/* sidebar - only visible on desktop (md and above) */}
      <div className="hidden md:block">
        <Sidebar/>
      </div>

      {/* main content area
          - ml-56 on desktop pushes it to the right of the sidebar (sidebar is 224px wide)
          - pb-20 on mobile adds padding at the bottom so content doesn't sit
            behind the bottom nav bar
          - env(safe-area-inset-top) pushes content down on iPhone so it
            clears the status bar and notch */}
      <main
        className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {children}
      </main>

      {/* bottom nav - only visible on mobile (below md) */}
      <div className="md:hidden">
        <BottomNav/>
      </div>

    </div>
  )
}