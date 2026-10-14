import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { currentMonth, formatDate, monthLabel, todayLocal } from '../utils/format';

const LABELS = { day: 'Day', week: 'Week', month: 'Month', range: 'Date range', year: 'Year', all: 'All time' };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function defaultPeriod() {
  return { mode: 'month', day: todayLocal(), week: weekStart(todayLocal()), month: currentMonth(), from: '', to: '', year: todayLocal().slice(0, 4) };
}

/** "2026-10-13" ± n days, as a calendar date (UTC arithmetic, so no timezone drift). */
export function shiftDay(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso` (weeks run Monday to Sunday). */
export function weekStart(iso) {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return shiftDay(iso, dow === 0 ? -6 : 1 - dow);
}

/** Converts the filter state into the query params the API understands. */
export function periodParams(p) {
  if (p.mode === 'day') return { from: p.day, to: p.day };
  if (p.mode === 'week') return { from: p.week, to: shiftDay(p.week, 6) };
  if (p.mode === 'month') return { month: p.month };
  if (p.mode === 'year') return { year: p.year };
  if (p.mode === 'range') return { from: p.from, to: p.to };
  return {};
}

export function periodInvalid(p) {
  if (p.mode === 'day' && !ISO_DATE.test(p.day || '')) return 'Choose a date.';
  if (p.mode === 'week' && !ISO_DATE.test(p.week || '')) return 'Choose a date in the week.';
  if (p.mode === 'range' && p.from && p.to && p.from > p.to) return 'End date must be on or after the start date.';
  if (p.mode === 'year' && !/^\d{4}$/.test(p.year)) return 'Enter a four-digit year.';
  if (p.mode === 'month' && !p.month) return 'Choose a month.';
  return null;
}

/** Human label for the selected period, e.g. "13-10-2026" or "October 2026". */
export function periodTitle(p) {
  if (p.mode === 'day') return formatDate(p.day);
  if (p.mode === 'week') return `Week ${formatDate(p.week)} to ${formatDate(shiftDay(p.week, 6))}`;
  if (p.mode === 'month') return monthLabel(p.month);
  if (p.mode === 'year') return p.year;
  if (p.mode === 'range') return `${p.from ? formatDate(p.from) : 'Start'} to ${p.to ? formatDate(p.to) : 'today'}`;
  return 'All time';
}

/** "Add" links carry the selected day so the new entry is dated for it. */
export function newEntryLink(path, p) {
  return p.mode === 'day' && ISO_DATE.test(p.day || '') ? `${path}?date=${p.day}` : path;
}

/**
 * Period state that survives leaving the page (e.g. to add an entry and come
 * back), kept per page in sessionStorage. Purely a convenience - if storage is
 * unavailable it just starts from the default.
 */
export function usePeriod(key, initialMode = 'month') {
  const storageKey = `ssb-period-${key}`;
  const [period, setPeriodState] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (saved && LABELS[saved.mode]) return { ...defaultPeriod(), ...saved };
    } catch {
      // ignore unreadable storage
    }
    return { ...defaultPeriod(), mode: initialMode };
  });
  const setPeriod = (next) => {
    setPeriodState(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore - private mode or storage disabled
    }
  };
  return [period, setPeriod];
}

/** Default date for a new-entry form: ?date=YYYY-MM-DD if given, otherwise today (IST). */
export function useInitialDate() {
  const [params] = useSearchParams();
  const date = params.get('date');
  return date && ISO_DATE.test(date) ? date : todayLocal();
}

export default function PeriodFilter({ value, onChange, modes = ['day', 'month', 'range'], idPrefix = 'period' }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const error = periodInvalid(value);
  const today = todayLocal();
  return (
    <div className="period-filter">
      <div className="field field-inline">
        <label htmlFor={`${idPrefix}-mode`}>Period</label>
        <select id={`${idPrefix}-mode`} value={value.mode} onChange={(e) => set({ mode: e.target.value })}>
          {modes.map((m) => <option key={m} value={m}>{LABELS[m]}</option>)}
        </select>
      </div>
      {value.mode === 'day' && (
        <div className="field field-inline">
          <label htmlFor={`${idPrefix}-day`}>Date</label>
          <div className="day-picker">
            <button type="button" className="btn btn-ghost btn-small" aria-label="Previous day"
              disabled={!ISO_DATE.test(value.day || '')} onClick={() => set({ day: shiftDay(value.day, -1) })}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <input id={`${idPrefix}-day`} type="date" value={value.day} onChange={(e) => set({ day: e.target.value })} />
            <button type="button" className="btn btn-ghost btn-small" aria-label="Next day"
              disabled={!ISO_DATE.test(value.day || '')} onClick={() => set({ day: shiftDay(value.day, 1) })}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            {value.day !== today && (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => set({ day: today })}>Today</button>
            )}
          </div>
        </div>
      )}
      {value.mode === 'week' && (
        <div className="field field-inline">
          <label htmlFor={`${idPrefix}-week`}>Week (Mon–Sun) — pick any day</label>
          <div className="day-picker">
            <button type="button" className="btn btn-ghost btn-small" aria-label="Previous week"
              disabled={!ISO_DATE.test(value.week || '')} onClick={() => set({ week: shiftDay(value.week, -7) })}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <input id={`${idPrefix}-week`} type="date" value={value.week}
              onChange={(e) => set({ week: ISO_DATE.test(e.target.value) ? weekStart(e.target.value) : e.target.value })} />
            <button type="button" className="btn btn-ghost btn-small" aria-label="Next week"
              disabled={!ISO_DATE.test(value.week || '')} onClick={() => set({ week: shiftDay(value.week, 7) })}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            {value.week !== weekStart(today) && (
              <button type="button" className="btn btn-ghost btn-small" onClick={() => set({ week: weekStart(today) })}>This week</button>
            )}
          </div>
          {ISO_DATE.test(value.week || '') && (
            <small className="hint">{formatDate(value.week)} to {formatDate(shiftDay(value.week, 6))}</small>
          )}
        </div>
      )}
      {value.mode === 'month' && (
        <div className="field field-inline">
          <label htmlFor={`${idPrefix}-month`}>Month</label>
          <input id={`${idPrefix}-month`} type="month" value={value.month} onChange={(e) => set({ month: e.target.value })} />
        </div>
      )}
      {value.mode === 'year' && (
        <div className="field field-inline">
          <label htmlFor={`${idPrefix}-year`}>Year</label>
          <input id={`${idPrefix}-year`} type="number" min="2000" max="2100" value={value.year}
            onChange={(e) => set({ year: e.target.value })} />
        </div>
      )}
      {value.mode === 'range' && (
        <>
          <div className="field field-inline">
            <label htmlFor={`${idPrefix}-from`}>From</label>
            <input id={`${idPrefix}-from`} type="date" value={value.from} onChange={(e) => set({ from: e.target.value })} />
          </div>
          <div className="field field-inline">
            <label htmlFor={`${idPrefix}-to`}>To</label>
            <input id={`${idPrefix}-to`} type="date" value={value.to} onChange={(e) => set({ to: e.target.value })} />
          </div>
        </>
      )}
      {error && <small className="field-error" role="alert">{error}</small>}
    </div>
  );
}
