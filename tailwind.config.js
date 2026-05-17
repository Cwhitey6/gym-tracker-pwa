// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Our custom gym-app color palette
        gym: {
          bg:        '#0f0f0f',   // main background — near black
          surface:   '#1a1a1a',   // cards and panels
          border:    '#2a2a2a',   // subtle borders
          accent:    '#e85d04',   // primary orange — gym energy
          'accent-hover': '#f48c06',
          muted:     '#6b7280',   // secondary text
          success:   '#22c55e',   // PRs and gains
          danger:    '#ef4444',   // delete actions
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}