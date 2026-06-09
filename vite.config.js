/**
 * vite.config.js
 * 
 * Vite is the build tool that powers the development server and bundles
 * the app for production. This config sets up three things:
 * 
 * 1. React plugin - enables JSX and React fast refresh during development
 * 2. PWA plugin - generates the service worker and manifest that make the
 *    app installable on iPhone and work offline at the gym
 * 3. Path alias - allows for @/components/X instead of ../../components/X
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname doesnt exist in ES modules so its recreated from import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    // enables React JSX transformation and fast refresh in development
    react(),

    // generates everything needed to make this a installable PWA
    VitePWA({
      // automatically update the service worker for deploying a new version
      registerType: 'autoUpdate',

      // static assets to include in the PWA cache
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],

      // the web app manifest - this is what tells the browser and iPhone
      // how to display the app when installed to the home screen
      manifest: {
        name:             'Gym Tracker',
        short_name:       'GymTracker',  // shown under the icon on iPhone
        description:      'Personal gym progress tracker',
        theme_color:      '#0f0f0f',     // browser toolbar color
        background_color: '#0f0f0f',     // splash screen background
        display:          'standalone',  // hides the browser UI when installed
        orientation:      'portrait',
        scope:            '/',
        start_url:        '/',
        icons: [
          { src: 'icon-192.png',        sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png',        sizes: '512x512', type: 'image/png' },
          {
            src:     'apple-touch-icon.png',
            sizes:   '180x180',
            type:    'image/png',
            purpose: 'apple touch icon',  // specifically for iPhone home screen
          },
        ],
      },

      // workbox handles the service worker and offline caching strategy
      workbox: {
        // precache all these file types so the app works with no internet
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

        // runtime caching for external requests that cant be precached
        runtimeCaching: [
          {
            // cache the Inter font from Google Fonts for up to a year
            // so the font loads instantly even offline after the first visit
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName:  'google-fonts-cache',
              expiration: {
                maxEntries:    10,
                maxAgeSeconds: 60 * 60 * 24 * 365,  // 1 year
              },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      // Allows import from @/components/X instead of ../../components/X
      // the @ symbol maps to the src/ folder
      '@': path.resolve(__dirname, './src'),
    },
  },
})