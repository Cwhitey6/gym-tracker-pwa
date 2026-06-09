/**
 * eslint.config.js
 * 
 * ESLint is the tool that shows the red and orange warnings in VS Code
 * when something is wrong with the code like unused variables or
 * React hooks being used incorrectly.
 * 
 * This config sets up three rule sets:
 * - js.configs.recommended: basic JavaScript best practices
 * - reactHooks: catches incorrect usage of useState useEffect etc
 * - reactRefresh: warns when a file exports both components and functions
 *   which breaks Vite's hot reload (the fast refresh you see during dev)
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // skip linting the built output folder
  globalIgnores(['dist']),
  {
    // lint all JS and JSX files in the project
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // tells ESLint that browser globals like window and document exist
      globals: globals.browser,
      // enables JSX syntax so ESLint can parse React component files
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])