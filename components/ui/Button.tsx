import { forwardRef, type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'lg' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

// Saffron is a FILL with white text only — never saffron text on cream.
// --saffron-500/600 (the brand's decorative saffron, still used for tints
// like the notice boxes, which pair it with dark ink text) are both under
// the 4.5:1 AA text contrast floor with white (2.65:1 / 3.78:1). The
// button fill uses the darker --saffron-700/800 pair instead — 4.69:1 and
// 6.02:1 against white — computed via WCAG relative luminance; see the
// task report for the full calculation.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-saffron-700 text-white hover:bg-saffron-800 shadow-card hover:shadow-lift',
  secondary: 'bg-white text-green-700 border-2 border-green-700 hover:bg-green-50',
  ghost: 'bg-transparent text-green-700 hover:bg-green-50',
}

// min-h-[48px] enforces the tap-target floor.
const SIZES: Record<ButtonSize, string> = {
  lg: 'min-h-[56px] px-8 text-lg',
  md: 'min-h-[48px] px-6 text-base',
}

/**
 * Shared with anything that needs to look like a Button but can't be one —
 * chiefly a `next/link` or plain `<a>` that needs button styling. Interactive
 * content nested inside a link (`<a><button>...</button></a>`) is invalid
 * HTML with inconsistent assistive-tech exposure, so link-shaped actions
 * apply these classes directly to the `<a>`/`<Link>` instead of wrapping a
 * `<Button>` in one. Keep this the ONLY place that assembles the class
 * string, so `<button>` and link-styled-as-button never drift apart.
 */
export function buttonClasses({
  variant = 'primary', size = 'md', className = '',
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return `inline-flex items-center justify-center gap-2 rounded-btn font-semibold
        transition-all duration-150 ease-[var(--ease-enter)]
        hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0
        disabled:opacity-45 disabled:pointer-events-none
        motion-reduce:transform-none motion-reduce:transition-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className = '', ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    />
  )
})
