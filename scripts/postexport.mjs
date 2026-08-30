// Post-processing for `npm run build:pages` (see package.json), run after
// `next build` has produced the static export in `out/`. Handles the two
// things a plain `next build --output export` cannot do on its own for a
// GitHub Pages deploy:
//
// 1. `.nojekyll` — without it, GitHub Pages runs the output through
//    Jekyll, which silently drops any path segment starting with `_`
//    (like `_next/`), producing a completely unstyled site.
// 2. `out/index.html` — there is no `app/page.tsx` at the true root (only
//    `app/[lang]/...`), and proxy.ts (which normally sends `/` -> `/hi`)
//    does not run under static export. So `next build` emits nothing at
//    all for `/`. This writes a tiny static redirect in its place.
//
// Both `<meta http-equiv="refresh">` and a JS fallback are included, plus
// a visible link, so the redirect still works with JavaScript disabled
// (meta refresh) or, in the worst case (extremely old/locked-down clients
// with meta refresh disabled), by hand.
//
// The link target is the *relative* path `hi/`, not an absolute
// `/arham-arogyam/hi/` — index.html is always served from the export
// root, whatever base path that root is mounted at, so a relative link
// resolves correctly without this script needing to know EXPORT_BASE_PATH
// from next.config.ts at all.

import { writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const outDir = join(process.cwd(), 'out')

if (!existsSync(outDir)) {
  console.error(`[postexport] "${outDir}" does not exist — did "next build" (EXPORT_MODE=1) run first?`)
  process.exit(1)
}

writeFileSync(join(outDir, '.nojekyll'), '')
console.log('[postexport] wrote out/.nojekyll')

const redirectHtml = `<!doctype html>
<html lang="hi">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=hi/" />
    <title>अर्हम् आरोग्यम्</title>
    <script>location.replace('hi/');</script>
  </head>
  <body>
    <p>
      <a href="hi/">अर्हम् आरोग्यम् पर जाएँ</a>
    </p>
  </body>
</html>
`

writeFileSync(join(outDir, 'index.html'), redirectHtml)
console.log('[postexport] wrote out/index.html (redirect -> hi/)')

const notFoundPath = join(outDir, '404.html')
if (!existsSync(notFoundPath)) {
  console.warn(`[postexport] WARNING: ${notFoundPath} was not produced by "next build" — GitHub Pages will have no 404 page.`)
} else {
  console.log('[postexport] confirmed out/404.html exists')
}
