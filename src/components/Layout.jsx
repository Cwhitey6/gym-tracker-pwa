// src/components/Layout.jsx
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="flex bg-gym-bg min-h-screen">
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <Sidebar/>
      </div>

      {/* Main content — add safe area top padding on mobile */}
      <main
        className="flex-1 md:ml-56 min-h-screen pb-20 md:pb-0"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <div className="md:hidden">
        <BottomNav/>
      </div>
    </div>
  )
}