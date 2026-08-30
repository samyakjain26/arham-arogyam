/**
 * The clinic hands each patient a paper "parchi" (token) numbered 1-1500,
 * which they must quote when booking so the clinic can match the online
 * booking back to its paper register. A small pure predicate — rather than
 * validation buried inline inside DetailsForm — so the boundary cases are
 * unit-tested directly against the exact rule (integer, 1-1500 inclusive).
 */
export const PARCHI_MIN = 1
export const PARCHI_MAX = 1500

export function isValidParchiNumber(value: string): boolean {
  if (!/^\d+$/.test(value)) return false // empty, non-numeric, decimal, negative (leading '-') all fail this
  const n = Number(value)
  return Number.isInteger(n) && n >= PARCHI_MIN && n <= PARCHI_MAX
}
