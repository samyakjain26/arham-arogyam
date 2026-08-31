// Shared "get directions" glyph — signals that the adjacent label opens
// Google Maps. currentColor so it follows the button's text colour in every
// variant; sized to match the button's own text (h-5 w-5, same as
// components/home/Hero.tsx's ClockIcon) rather than a fixed pixel size.
export function MapPinIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <path
        d="M12 21s7-6.44 7-11.5A7 7 0 0 0 5 9.5C5 14.56 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}
