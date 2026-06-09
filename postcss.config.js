/**
 * postcss.config.js
 * 
 * PostCSS transforms the CSS files in the project and adds vendor prefixes for browser compatibility.
 * It runs automatically as part of the Vite build process.
 * 
 * Two plugins are configured here:
 * - tailwindcss: processes all the @tailwind and @apply directives
 *   in index.css and generates the actual CSS classes
 * - autoprefixer: automatically adds vendor prefixes like -webkit-
 *   to CSS properties that need them for browser compatibility
 */

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}