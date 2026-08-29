'use client'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Fade + rise on scroll, once. Uses the .reveal class from globals.css,
 * which starts at opacity 0.001 rather than display:none — so if JS never
 * runs, the noscript rule reveals everything and no content is lost.
 */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setTimeout(() => el.classList.add('is-visible'), delay)
        io.disconnect()
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return <div ref={ref} className="reveal">{children}</div>
}
