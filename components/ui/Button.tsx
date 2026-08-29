import { forwardRef, type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'lg' | 'md'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

// Saffron is a FILL with white text only — never saffron text on cream.
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-saffron-500 text-white hover:bg-saffron-600 shadow-card hover:shadow-lift',
  secondary: 'bg-white text-green-700 border-2 border-green-700 hover:bg-green-50',
  ghost: 'bg-transparent text-green-700 hover:bg-green-50',
}

// min-h-[48px] enforces the tap-target floor.
const SIZES: Record<Size, string> = {
  lg: 'min-h-[56px] px-8 text-lg',
  md: 'min-h-[48px] px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', className = '', ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-btn font-semibold
        transition-all duration-150 ease-[var(--ease-enter)]
        hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0
        disabled:opacity-45 disabled:pointer-events-none
        motion-reduce:transform-none motion-reduce:transition-none
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  )
})
