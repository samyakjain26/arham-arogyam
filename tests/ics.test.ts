import { describe, it, expect } from 'vitest'
import { buildIcs } from '@/lib/ics'

const ics = buildIcs({
  bookingCode: 'K7M2QP',
  slotStart: new Date('2026-09-01T11:30:00.000Z'),
  slotEnd: new Date('2026-09-01T11:45:00.000Z'),
  summary: 'Arham Arogyam — appointment',
  location: 'C-39, Jyoti Marg, Bapu Nagar, Jaipur',
})

describe('buildIcs', () => {
  it('is a well-formed VCALENDAR', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })

  it('uses UTC timestamps', () => {
    expect(ics).toContain('DTSTART:20260901T113000Z')
    expect(ics).toContain('DTEND:20260901T114500Z')
  })

  it('carries the booking code as the UID', () => {
    expect(ics).toContain('UID:K7M2QP@arhamarogyam')
  })

  it('sets a reminder the day before', () => {
    expect(ics).toContain('TRIGGER:-PT24H')
  })

  it('uses CRLF line endings as the spec requires', () => {
    expect(ics).toContain('\r\n')
  })
})
