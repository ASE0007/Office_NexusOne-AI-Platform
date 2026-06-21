import { describe, it, expect } from 'vitest';

/**
 * These mirror the pure helper logic embedded in the Calendar page
 * (date-cell matching and day-count math). Extracted here as standalone
 * functions so the underlying logic is verified by a real test rather
 * than only "looking right" in the browser.
 */

function getEventsForDay(events: { start_datetime: string }[], year: number, month: number, day: number) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return events.filter((e) => e.start_datetime.startsWith(dateStr));
}

function daysRequested(startDate: string, endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

describe('Calendar day-matching logic', () => {
  const events = [
    { start_datetime: '2025-12-05T10:00:00Z', title: 'Standup' },
    { start_datetime: '2025-12-05T14:00:00Z', title: 'Client Call' },
    { start_datetime: '2025-12-25T00:00:00Z', title: 'Holiday' },
  ];

  it('finds all events for a given day', () => {
    const result = getEventsForDay(events, 2025, 11, 5); // month is 0-indexed (11 = December)
    expect(result).toHaveLength(2);
  });

  it('returns empty array for a day with no events', () => {
    const result = getEventsForDay(events, 2025, 11, 10);
    expect(result).toHaveLength(0);
  });

  it('does not match a similar but different date', () => {
    const result = getEventsForDay(events, 2025, 11, 15);
    expect(result).toHaveLength(0);
  });

  it('pads single digit months and days correctly', () => {
    const janEvents = [{ start_datetime: '2025-01-05T09:00:00Z' }];
    const result = getEventsForDay(janEvents, 2025, 0, 5);
    expect(result).toHaveLength(1);
  });
});

describe('Leave request day counting', () => {
  it('counts a single day leave as 1 day', () => {
    expect(daysRequested('2025-12-10', '2025-12-10')).toBe(1);
  });

  it('counts a 3-day range inclusively', () => {
    expect(daysRequested('2025-12-10', '2025-12-12')).toBe(3);
  });

  it('counts a full week correctly', () => {
    expect(daysRequested('2025-12-01', '2025-12-07')).toBe(7);
  });
});
