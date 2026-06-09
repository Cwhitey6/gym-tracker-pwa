/**
 * index.js
 * 
 * A single entry point for all database functions.
 * Instead of importing from the full path like '@/db/database.js',
 * every page in the app can just do:
 * 
 * import { getSessions, createSet } from '@/db'
 * 
 * The * re-exports everything from database.js so file doesn't
 * need to be updated with new functions
 */

export * from './database.js'