// GitHub Pages serves this project under a sub-path (see next.config.ts),
// so every reference to a static file in `public/` needs that sub-path
// prepended or it 404s on the deployed site. `next/image` runs with
// `unoptimized: true` for the static export (see next.config.ts), which
// means it passes `src` straight through to `<img>` unchanged — it does
// NOT apply `basePath` the way it would for the optimizer route. Any
// `src`/`href` that points at a file under `public/` must go through this
// helper instead of being written as a bare `/…` string.
//
// NEXT_PUBLIC_BASE_PATH is set to the same value as `basePath`/`assetPrefix`
// only during `npm run build:pages` (see next.config.ts, which is the
// single source of truth for that string). It is unset for `next dev`,
// `npm run build`, and `npm start`, so BASE_PATH is '' there and asset()
// is a no-op — local development keeps working at the root.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function asset(path: string): string {
  return `${BASE_PATH}${path}`
}
