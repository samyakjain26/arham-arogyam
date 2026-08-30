interface IcsInput {
  bookingCode: string
  slotStart: Date
  slotEnd: Date
  summary: string
  location: string
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * The calendar invite is the strongest free reminder we have: the patient's
 * own phone fires it 24h ahead with no service, no quota, and no cost.
 */
export function buildIcs(a: IcsInput): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arham Arogyam//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${a.bookingCode}@arhamarogyam`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(a.slotStart)}`,
    `DTEND:${stamp(a.slotEnd)}`,
    `SUMMARY:${a.summary}`,
    `LOCATION:${a.location.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Booking code ${a.bookingCode}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${a.summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
