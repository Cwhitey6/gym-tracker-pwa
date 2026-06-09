/**
 * tailwind.config.js
 * 
 * This is where the entire visual design system lives.
 * Every color font animation and border radius used across the app
 * is defined here. Can be used to rebrand the app or change
 * the color scheme.
 * 
 * The "content" array tells Tailwind which files to scan for class names
 * so it only generates CSS for classes that are actually used keeping
 * the final bundle size small.
 */

import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  // scan these files for Tailwind class names
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      // custom color palette used throughout the app as bg-gym-bg
      // text-gym-accent border-gym-border etc
      colors: {
        gym: {
          bg:             '#0f0f0f',  // main page background near black
          surface:        '#1a1a1a',  // cards and side panels
          border:         '#2a2a2a',  // subtle borders between elements
          accent:         '#e85d04',  // primary orange the main brand color
          'accent-hover': '#f48c06',  // slightly lighter orange for hover states
          muted:          '#6b7280',  // secondary text and placeholders
          success:        '#22c55e',  // PRs personal records and success states
          danger:         '#ef4444',  // delete buttons and destructive actions
        }
      },

      // Inter is loaded from Google Fonts in index.css
      // system-ui and sans-serif are fallbacks if it hasnt loaded yet
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // slightly larger border radius values than Tailwinds defaults
      // gives the cards and buttons rounded modern feel
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
      },

      // two animations used throughout the app
      // fade-in: elements appearing (error messages modals etc)
      // slide-up: page transitions and expanding sections
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

    },
  },

  plugins: [
    // adds better default styles for form elements like inputs and selects
    // so they look consistent across browsers without extra CSS
    forms,
  ],
}