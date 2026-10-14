import { describe, expect, it } from 'vitest';
import { newEntryLink, periodInvalid, periodParams, periodTitle, shiftDay, weekStart } from './PeriodFilter';

describe('week period', () => {
  it('snaps any day to the Monday of its week', () => {
    expect(weekStart('2026-10-13')).toBe('2026-10-12'); // Tuesday -> Monday
    expect(weekStart('2026-10-12')).toBe('2026-10-12'); // Monday stays
    expect(weekStart('2026-10-18')).toBe('2026-10-12'); // Sunday -> previous Monday
    expect(weekStart('2027-01-01')).toBe('2026-12-28'); // across the year end
  });

  it('queries Monday to Sunday and labels it', () => {
    const p = { mode: 'week', week: '2026-10-26' };
    expect(periodParams(p)).toEqual({ from: '2026-10-26', to: '2026-11-01' });
    expect(periodTitle(p)).toBe('Week 26-10-2026 to 01-11-2026');
    expect(periodInvalid({ mode: 'week', week: '' })).toBe('Choose a date in the week.');
  });
});

describe('day period', () => {
  it('steps across month, year and leap-day boundaries', () => {
    expect(shiftDay('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDay('2027-01-01', -1)).toBe('2026-12-31');
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('queries a single date as from = to', () => {
    expect(periodParams({ mode: 'day', day: '2026-10-13' })).toEqual({ from: '2026-10-13', to: '2026-10-13' });
  });

  it('labels and validates', () => {
    expect(periodTitle({ mode: 'day', day: '2026-10-13' })).toBe('13-10-2026');
    expect(periodInvalid({ mode: 'day', day: '' })).toBe('Choose a date.');
    expect(periodInvalid({ mode: 'day', day: '2026-10-13' })).toBeNull();
  });

  it('carries the selected day into new-entry links only in day mode', () => {
    expect(newEntryLink('/orders/new', { mode: 'day', day: '2026-10-13' })).toBe('/orders/new?date=2026-10-13');
    expect(newEntryLink('/orders/new', { mode: 'month', day: '2026-10-13' })).toBe('/orders/new');
  });
});
