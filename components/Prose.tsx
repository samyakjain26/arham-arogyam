import type { ReactNode } from 'react'

/**
 * Long-form copy container for the content pages (about/services/ayurveda/
 * contact/privacy/terms): caps line length at 68ch and sets an 18px/1.7
 * rhythm that holds regardless of the active locale's own line-height.
 */
export function Prose({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`max-w-prose text-lg leading-[1.7] text-ink [&>p+p]:mt-4 ${className}`}>
      {children}
    </div>
  )
}
