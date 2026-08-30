import type { NextConfig } from "next";

// Set by `npm run build:pages` (see package.json) for the GitHub Pages
// static-export build. Left unset for `next dev` / `next build` / `next
// start`, which keep running exactly as before, unchanged, at the domain
// root — this flag is the only thing that switches the config below on.
const isExport = process.env.EXPORT_MODE === "1";

// GitHub Pages serves this project at
// https://samyakjain26.github.io/arham-arogyam/ — a sub-path, not the
// domain root. Every stylesheet/script/image URL needs this prefix or the
// exported site loads completely unstyled (bare /_next/... 404s under
// Pages). Only meaningful in export mode: local dev/start still run at "/".
const EXPORT_BASE_PATH = "/arham-arogyam";

// Single source of truth for the sub-path string above: also expose it as
// NEXT_PUBLIC_BASE_PATH so lib/asset.ts (used for every static-asset src/
// href, since next/image's `unoptimized: true` mode does not apply
// basePath itself) can prefix asset URLs with the exact same value used
// for basePath/assetPrefix below. Must be set before Next builds its
// NEXT_PUBLIC_* inlining map, so it's assigned here at config-load time
// rather than duplicated in scripts/build-pages.mjs or an env file.
if (isExport) {
  process.env.NEXT_PUBLIC_BASE_PATH = EXPORT_BASE_PATH;
}

const nextConfig: NextConfig = {
  // Static export (`output: 'export'`) has no server to run next/image
  // optimisation, proxy.ts, or headers()/redirects()/rewrites() against —
  // see node_modules/next/dist/docs/01-app/02-guides/static-exports.md,
  // "Unsupported Features". If any of those are added later for the real
  // (non-static) deployment, gate them the same way (`!isExport && ...`)
  // so they keep working there without breaking this export build.
  ...(isExport && {
    output: "export",
    // Emit `/me/index.html` instead of `/me.html` so Pages' directory-URL
    // resolution (`/me/` -> `/me/index.html`) works without a rewrite rule.
    trailingSlash: true,
    images: { unoptimized: true },
    basePath: EXPORT_BASE_PATH,
    assetPrefix: EXPORT_BASE_PATH,
  }),
};

export default nextConfig;
