# Gym Tracker PWA — Mobile 

**Last updated: May 2026**
**Stack: React + Vite + Tailwind CSS + Dexie.js (IndexedDB) + Vercel**

---

## What This App Is

This is the mobile version of your desktop gym tracker, built as a Progressive Web App (PWA). It runs in Safari on your iPhone, installs to your home screen like a real app, works offline at the gym, and stores all your data locally in your phone's browser storage. There is no server, no backend, no database to manage — everything lives on your device.

It is a separate project from the desktop Electron app but shares almost all the same React code, pages, and design.

---

## How It Differs From the Desktop App

| Feature | Desktop App | PWA (Mobile) |
|---|---|---|
| Platform | Windows .exe installer | iPhone Safari PWA |
| Database | SQLite file via sql.js | IndexedDB via Dexie.js |
| Data location | AppData\Roaming\gym-tracker\ | iPhone browser storage |
| Database calls | window.electronAPI (IPC bridge) | Direct function imports |
| Navigation | Left sidebar | Bottom tab bar |
| Deployment | Local installer | Vercel (free hosting) |
| Offline support | Always offline | Service worker cache |
| Login persistence | sessionStorage | localStorage |

---

## How to Access the App

**On your iPhone:**
1. Open Safari (must be Safari, not Chrome)
2. Go to your Vercel URL
3. Tap the Share button (box with arrow)
4. Tap "Add to Home Screen"
5. Tap Add

It now lives on your home screen and launches fullscreen like a native app.

**In a browser on your laptop:**
Just go to your Vercel URL in any browser.

---

## Full File Structure

```
gym-tracker-pwa/
│
├── src/
│   │
│   ├── main.jsx                       # React entry point
│   │                                  # Same as desktop except no Electron renderer import
│   │                                  # Uses HashRouter (same reason as desktop —
│   │                                  # file-based routing needs hash URLs)
│   │
│   ├── App.jsx                        # All routes — identical to desktop version
│   │
│   ├── index.css                      # All styles — identical to desktop
│   │                                  # Added: safe area insets for iPhone notch
│   │                                  # Added: overscroll-behavior for iOS rubber-band
│   │                                  # Added: min-height 44px tap targets
│   │
│   ├── db/                            # Database layer — replaces electron/database.js
│   │   ├── database.js                # All data functions using Dexie.js
│   │   │                              # Dexie wraps IndexedDB with a clean Promise API
│   │   │                              # Every function is async and returns
│   │   │                              # { success: true, data: ... } or
│   │   │                              # { success: false, error: ... }
│   │   │                              # to match the desktop app's return shape
│   │   │
│   │   └── index.js                   # Re-exports everything from database.js
│   │                                  # Pages import from '@/db' not '@/db/database'
│   │
│   ├── context/
│   │   └── AuthContext.jsx            # Identical to desktop except:
│   │                                  # Uses localStorage instead of sessionStorage
│   │                                  # so login persists when you close the app
│   │
│   ├── components/
│   │   ├── Layout.jsx                 # Modified from desktop:
│   │   │                              # Shows <Sidebar> on md+ screens (desktop)
│   │   │                              # Shows <BottomNav> on mobile screens
│   │   │                              # Adds env(safe-area-inset-top) padding
│   │   │                              # so content clears the iPhone status bar
│   │   │
│   │   ├── BottomNav.jsx              # NEW — mobile only
│   │   │                              # Fixed bottom bar with 5 nav icons
│   │   │                              # Respects safe-area-inset-bottom for
│   │   │                              # iPhone home indicator
│   │   │                              # Hidden on md+ screens
│   │   │
│   │   ├── Sidebar.jsx                # Same as desktop — visible on md+ only
│   │   ├── BodyDiagram.jsx            # Same as desktop
│   │   ├── ProtectedRoute.jsx         # Same as desktop
│   │   ├── SetRow.jsx                 # Same as desktop
│   │   ├── WorkoutHistory.jsx         # Same as desktop
│   │   └── charts/                    # Same as desktop
│   │       ├── WeightChart.jsx
│   │       ├── VolumeChart.jsx
│   │       └── OneRMChart.jsx
│   │
│   ├── hooks/
│   │   └── useDatabase.js             # Same as desktop
│   │
│   └── pages/                         # All pages same as desktop with mobile tweaks:
│       │                              # - p-4 sm:p-8 (smaller padding on mobile)
│       │                              # - grid-cols-1 lg:grid-cols-2 (stack on mobile)
│       │                              # - grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
│       │                              # - text-2xl sm:text-3xl (smaller headings)
│       │
│       ├── LoginPage.jsx              # Same + safe area top padding
│       ├── DashboardPage.jsx          # Stacks vertically on mobile
│       │                              # Stat cards centered with shorter labels
│       ├── MuscleGroupPage.jsx        # 2-col grid on mobile
│       ├── ExercisePage.jsx           # Single column on mobile
│       ├── LiveWorkoutPage.jsx        # Stacked header on mobile
│       ├── ProgressPage.jsx           # Exercise selector above charts on mobile
│       ├── HistoryPage.jsx            # Same layout works well on mobile
│       ├── ExercisesPage.jsx          # 2-col grid on mobile
│       └── SettingsPage.jsx           # Full width on mobile
│
├── public/                            # Static files served at root
│   ├── icon-192.png                   # PWA icon (192×192) for Android/Chrome
│   ├── icon-512.png                   # PWA icon (512×512) for splash screens
│   └── apple-touch-icon.png          # iPhone home screen icon (180×180)
│                                      # This is what appears on your iPhone home screen
│
├── dist/                              # Built app output (auto-generated)
│   ├── index.html
│   ├── sw.js                          # Service worker (auto-generated by vite-plugin-pwa)
│   ├── manifest.webmanifest           # PWA manifest (auto-generated)
│   └── assets/
│
├── index.html                         # Shell HTML file
│                                      # Key iPhone meta tags:
│                                      # apple-mobile-web-app-capable: yes
│                                      # apple-mobile-web-app-status-bar-style
│                                      # viewport-fit=cover (extends under notch)
│                                      # user-scalable=no (prevents zoom on inputs)
│
├── vite.config.js                     # Vite + VitePWA plugin config
│                                      # Defines PWA manifest (name, colors, icons)
│                                      # Configures service worker (workbox)
│                                      # Precaches all JS/CSS/HTML for offline use
│                                      # Caches Google Fonts for 1 year
│
├── tailwind.config.js                 # Identical to desktop app
├── postcss.config.js                  # Identical to desktop app
└── package.json                       # No Electron dependencies
                                       # Added: vite-plugin-pwa, dexie
```

---

## The Database — How Dexie.js Works

Instead of a SQLite file on disk, data is stored in **IndexedDB** — a database built into every browser including Safari on iPhone. Dexie.js is a wrapper that makes IndexedDB easy to use.

### Where data is stored on iPhone

```
Safari → Website Data → your Vercel URL → IndexedDB → GymTrackerDB
```

You can view it in Safari Settings → Advanced → Website Data.

### Schema definition

```js
db.version(1).stores({
  users:            '++id, &username',
  muscle_groups:    '++id, &name',
  exercises:        '++id, name, muscle_group_id, type',
  workout_sessions: '++id, user_id, exercise_id, date',
  sets:             '++id, session_id, set_number',
  personal_records: '++id, [user_id+exercise_id]',
})
```

The `++` means auto-increment primary key. The `&` means unique index. The `[a+b]` means compound index (used for personal records — one per user per exercise).

### How database calls work (vs desktop)

```
DESKTOP:
React component
  → window.electronAPI.getSessions(userId)
    → IPC bridge → Node.js → sql.js → SQLite file

PWA:
React component
  → getSessions(userId)           ← direct function call, no bridge needed
    → Dexie.js → IndexedDB → Safari storage
```

This is why the PWA code is simpler — no IPC, no preload scripts, no Electron at all. You just import the function and call it.

### Importing database functions in pages

```js
// Every page imports directly from @/db
import { getSessions, createSession, deleteSession } from '@/db'

// Then calls them directly — no window.electronAPI needed
const result = await getSessions(user.id)
```

---

## How PWA Installation Works on iPhone

When you add the app to your home screen via Safari, iOS creates a standalone web app container. This gives you:

- **Full screen** — no Safari address bar or tab bar
- **Home screen icon** — uses `apple-touch-icon.png` from your `public/` folder
- **Offline support** — the service worker caches all app files so it works with no internet
- **Persistent login** — localStorage keeps you logged in across sessions
- **Safe area respect** — `env(safe-area-inset-top/bottom)` prevents content going behind the notch and home indicator

### Why Safari specifically

Apple only allows PWA installation through Safari on iPhone. Chrome, Firefox, and other iOS browsers cannot trigger "Add to Home Screen" in a way that creates a proper standalone PWA. Always use Safari.

---

## Deployment — How Vercel Works

Your app is hosted on Vercel's free tier. Every time you run `vercel --prod` it:

1. Uploads your `dist/` folder to Vercel's CDN
2. Makes it available at your `.vercel.app` URL instantly
3. Serves it from edge servers worldwide (fast anywhere)
4. Handles HTTPS automatically (required for PWAs)

Vercel's free tier includes unlimited deployments, 100GB bandwidth per month, and no expiry. It is genuinely free forever for a personal app like this.

---

## How to Make Updates

### Make a change and redeploy

```powershell
cd C:\Users\colin\OneDrive\Desktop\gym-tracker-pwa

# Make your changes to any file in src/

# Build and deploy
npm run build
vercel --prod
```

The update is live in about 30 seconds. On your iPhone, pull down to refresh in Safari or close and reopen the app.

### Test locally before deploying

```powershell
npm run dev
```

Open `http://localhost:5173` in Chrome on your laptop. Test everything works, then deploy.

### Force the iPhone to get the latest version

PWAs cache aggressively. If your iPhone seems to be showing an old version after deploying:

1. On iPhone, go to Settings → Safari → Advanced → Website Data
2. Find your Vercel URL and tap "Edit" → delete it
3. Reopen the app in Safari — it will download fresh

Or just wait — the service worker checks for updates automatically every time the app opens and installs the new version in the background.

---

## Common Future Changes

### Change a color

Open `tailwind.config.js` — same as the desktop app. Change `gym.accent` from `#e85d04` to any hex color.

### Add a new exercise

Open `src/db/database.js` and find the `bulkAdd` call inside `seedIfEmpty()`. Add a new entry:

```js
{ name: 'Your Exercise', muscle_group_id: chest, type: 'weight' },
```

Note: This only runs on first install (when the database is empty). Existing users need to add it manually via the Exercises page, or you need to bump the database version (see below).

### Add a new database column or table (migrations)

Dexie handles schema migrations via version numbers. If you need to add a column to an existing table:

```js
// In src/db/database.js

// Keep the old version
db.version(1).stores({
  exercises: '++id, name, muscle_group_id, type',
  // ...
})

// Add a new version with the change
db.version(2).stores({
  exercises: '++id, name, muscle_group_id, type, notes',
  // ...
}).upgrade(tx => {
  // Optional: migrate existing data
  return tx.exercises.toCollection().modify(ex => {
    ex.notes = ''
  })
})
```

Dexie automatically runs the upgrade when a user opens the app and their local database is on version 1.

### Add a new page

1. Create `src/pages/YourPage.jsx`
2. Import it in `src/App.jsx` and add a route
3. Add a link in `src/components/BottomNav.jsx` (mobile) and `src/components/Sidebar.jsx` (desktop)

### Change the app name

Open `vite.config.js` and update the manifest section:

```js
manifest: {
  name: 'Your New Name',
  short_name: 'ShortName',  // appears under icon on home screen — keep under 12 chars
  // ...
}
```

Redeploy. Users who already installed it will need to re-add it to their home screen to see the new name.

### Change the app icon

Replace these three files in `public/`:
- `apple-touch-icon.png` — 180×180px — this is the iPhone home screen icon
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Use https://favicon.io/favicon-generator/ to generate them quickly. After deploying, users need to delete and re-add the app to their home screen for the new icon to appear.

---

## Important Things to Know

### Why does data not sync between desktop and iPhone?

The desktop app stores data in `C:\Users\colin\AppData\Roaming\gym-tracker\gymtracker.db`. The PWA stores data in Safari's IndexedDB on your iPhone. They are completely separate databases with no connection to each other. If you log a workout on your phone it will not appear on the desktop app and vice versa.

If you want to sync them in the future, you would need to add a backend (like Supabase or Firebase) and have both apps talk to it. That is a significant project but doable.

### What happens if I clear Safari data?

Your gym data will be deleted. IndexedDB is browser storage — if you go to Settings → Safari → Clear History and Website Data, it wipes everything including your workouts. To protect against this, avoid clearing Safari data or use Settings → Safari → Advanced → Website Data to selectively remove only specific sites without touching your gym tracker.

### Why localStorage for login?

`localStorage` persists until you explicitly clear it or sign out. `sessionStorage` (what the desktop app uses) clears when you close the browser tab. On a phone where you open and close apps constantly, sessionStorage would log you out every time — localStorage keeps you logged in permanently until you tap Sign Out.

### What is a service worker?

The service worker (`dist/sw.js`, auto-generated by vite-plugin-pwa) is a background script that intercepts network requests and serves cached files when you're offline. It runs separately from the app itself. When you open the gym tracker with no internet connection at the gym, the service worker serves the cached app files instead. Your data still works because IndexedDB is local — only the app files need the cache.

### Why HashRouter on a web app?

Normally web apps use BrowserRouter with clean URLs like `/dashboard`. But a PWA installed on iPhone sets its start URL as `https://yourapp.vercel.app/`. If you navigate to `/dashboard` and then refresh, the server would try to serve a file at that path and get a 404. HashRouter uses `#/dashboard` style URLs which always load `index.html` first and let React handle the routing client-side.

---

## Commands Reference

```powershell
# Start local development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel (production)
vercel --prod

# Deploy to Vercel (preview URL, for testing)
vercel

# Install all dependencies fresh
npm install

# Clean build and rebuild
Remove-Item -Recurse -Force dist
npm run build
```

---

## If Something Breaks

**App shows old version after deploying**
Pull to refresh in Safari, or delete website data for your Vercel URL in Safari settings.

**"Add to Home Screen" option missing in Safari**
You must be on the actual Vercel URL (https://), not localhost. Localhost cannot be installed as a PWA on iPhone.

**Data disappeared**
Safari website data was cleared. Data lives in IndexedDB — if Safari data is cleared, it is gone. This is a known limitation of browser storage.

**Build fails**
```powershell
Remove-Item -Recurse -Force dist node_modules
npm install
npm run build
```

**Login not persisting after update**
Check that all three `sessionStorage` references in `AuthContext.jsx` were changed to `localStorage`.

**Charts not showing on iPhone**
Recharts needs a defined container width. Make sure chart wrapper divs have explicit widths set via Tailwind classes.

**Styles look wrong after update**
Hard reload in Safari: hold the refresh button → tap "Reload Without Content Blockers" or delete website data and reopen.

---

## Vercel Project Management

Go to **vercel.com** → log in → find your project to:
- See deployment history
- Roll back to a previous deployment
- Add a custom domain
- View build logs
- See bandwidth usage (free tier: 100GB/month)

---
