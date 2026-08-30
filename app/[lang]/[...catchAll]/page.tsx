import { notFound } from 'next/navigation'

// app/[lang]/not-found.tsx only catches an explicit notFound() thrown from
// WITHIN this segment's tree — it does not act as a fallback for a URL that
// matches no route at all. A request like /hi/nonexistent-page never
// matches any page.tsx, so without this file Next never reaches
// app/[lang]/not-found.tsx and instead serves its own built-in, unstyled,
// English-only 404 (confirmed live: `curl /hi/nonexistent-page` returned
// "404: This page could not be found." with no lang attribute, no
// header/footer). That default root boundary can't be replaced by a normal
// app/not-found.tsx here, because this app's root layout is itself the
// dynamic app/[lang]/layout.tsx (see node_modules/next/dist/docs/.../
// file-conventions/not-found.md's global-not-found section, which names
// "root layout defined using a top-level dynamic segment" as exactly the
// case a plain not-found.js can't cover).
//
// This catch-all converts any such URL into an explicit, in-tree
// notFound() call, which IS caught by the sibling not-found.tsx — with the
// correct lang, Header, and Footer, since all of those come from this same
// already-matched [lang] layout. Static and literal segments (book,
// ayurveda, about, ...) always take precedence over a catch-all in Next's
// router, so this can never shadow a real page.
export default function CatchAll() {
  notFound()
}
