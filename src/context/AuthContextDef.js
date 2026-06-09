/**
 * AuthContextDef.js
 * 
 * Just creates and exports the AuthContext object.
 * Kept in its own file so AuthContext.jsx only exports a component
 * and useAuth.js only exports a hook - React's fast refresh
 * requires files to export only one type of thing.
 */

import { createContext } from 'react'

export const AuthContext = createContext(null)