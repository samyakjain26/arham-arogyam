import type { Config } from 'tailwindcss'

// NOTE: create-next-app@latest scaffolded Tailwind v4, which uses CSS-first
// configuration (see app/globals.css: `@import "tailwindcss"` + `@theme`)
// and does not load this file automatically. This file is created to satisfy
// Task 1's file list and to give Task 2 a place to land its `theme.extend`
// block, but it is currently inert under Tailwind v4 unless wired up via an
// `@config` directive in the CSS entry file. See task-1-report.md for detail.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
