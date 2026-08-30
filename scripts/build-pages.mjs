// Driver for `npm run build:pages` (the GitHub Pages static-export build).
//
// `next.config.ts` branches on `process.env.EXPORT_MODE` fine, because it's
// plain JS evaluated once at config-load time. app/[lang]/[...catchAll] is
// a genuinely dynamic catch-all with no generateStaticParams (see that
// file's comment) — that's required so a normal server render always
// reaches it for any unmatched path. Static export can't tolerate that:
//
//   Error: Page "/[lang]/[...catchAll]" returned an empty array from
//   "generateStaticParams()". With "output: export", at least one route
//   must be generated.
//
// i.e. `output: 'export'` refuses a dynamic segment with zero static
// params outright — there's no "emit nothing for this route" option, only
// "emit at least one page" or "don't have the route at all". Since a
// catch-all can't usefully pre-enumerate every possible bad URL (that
// would defeat the point of a catch-all, and still wouldn't work as a
// generic fallback), this script removes the route from the build
// entirely: it renames the `[...catchAll]` folder to `_catchAll` for the
// duration of the export build. A leading underscore is a Next.js
// "private folder" (see node_modules/next/dist/docs/01-app/01-getting-
// started/02-project-structure.md, "Private folders") — it and everything
// under it are opted out of routing altogether, so `next build` never
// sees this as a route and never asks it for static params. The folder is
// renamed back immediately after the build finishes, success or failure.
//
// Effect on the export: an unmatched /<lang>/* path has no file on disk
// and falls through to the static host's 404.html — Next's built-in,
// unstyled, English-only 404, not the localized in-app one. See
// app/[lang]/not-found.tsx's comment for confirmation of what that default
// page looks like. Known, accepted limitation of the static-export demo.
import { renameSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const langDir = join(repoRoot, 'app', '[lang]')
const catchAllDir = join(langDir, '[...catchAll]')
const disabledDir = join(langDir, '_catchAll')

if (!existsSync(catchAllDir)) {
  console.error(`[build-pages] expected ${catchAllDir} to exist — nothing to disable, aborting.`)
  process.exit(1)
}

let buildResult
try {
  renameSync(catchAllDir, disabledDir)
  buildResult = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, EXPORT_MODE: '1' },
    cwd: repoRoot,
  })
} finally {
  renameSync(disabledDir, catchAllDir)
}

if (buildResult.error) {
  console.error('[build-pages] failed to run "next build":', buildResult.error)
  process.exit(1)
}
if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1)
}

const postexport = spawnSync(process.execPath, [join(__dirname, 'postexport.mjs')], {
  stdio: 'inherit',
  cwd: repoRoot,
})
process.exit(postexport.status ?? 0)
