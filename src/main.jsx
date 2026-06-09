/**
 * main.jsx
 * 
 * The entry point of the app. This is the first file that runs.
 * It mounts the entire React app into the <div id="root"> in index.html.
 * 
 * HashRouter is used instead of BrowserRouter because the app is hosted
 * as a static site on Vercel. Without a server to handle URL routing
 * refreshing on a path like /dashboard would return a 404. HashRouter
 * uses #/dashboard style URLs that always load index.html first and let
 * React handle the routing on the client side.
 * 
 * StrictMode runs extra checks during development to catch common mistakes
 * like impure renders and deprecated APIs. It has no effect in production.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// mount the app into the root div in index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App/>
    </HashRouter>
  </React.StrictMode>
)