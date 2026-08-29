'use client'
import { Children, type ReactNode } from 'react'
import { Reveal } from './Reveal'

/** Children appear in sequence. Total is capped so a long list never crawls. */
export function Stagger({ children, step = 60, cap = 300 }: {
  children: ReactNode; step?: number; cap?: number
}) {
  return (
    <>
      {Children.map(children, (child, i) => (
        <Reveal delay={Math.min(i * step, cap)}>{child}</Reveal>
      ))}
    </>
  )
}
