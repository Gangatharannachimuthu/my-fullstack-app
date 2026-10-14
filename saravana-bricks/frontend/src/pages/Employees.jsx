import { useEffect, useState } from 'react';
import { Download, Plus, Save, UserPlus } from 'lucide-react';
import { api, downloadCsv } from '../api';
import PeriodFilter, { periodInvalid, periodParams, periodTitle, usePeriod } from '../components/PeriodFilter';
import { Empty, ErrorBox, Field, Loading, useFormState, useLoader } from '../components/ui';
import { formatDate, todayLocal } from '../utils/format';

const LABEL = { 1: 'Full day', 0.5: 'Half day', 0: 'Leave' };
const SHORT = { 1: '1', 0.5: '½', 0: '0' };
const NEXT = { 1: '0.5', 0.5: '0', 0: '1' }; // tap order in the month grid
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekday(iso) {
  return WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()];
}

/** Full / Half / Leave buttons for one member on one day. */
function MarkButtons({ value, disabled, onPick, name }) {
  return (
    <div className="seg" role="group" aria-label={`Attendance for ${name}`}>
      {['1', '0.5', '0'].map((v) => (
        <button key={v} type="button" disabled={disabled}
          className={`seg-btn seg-${v.replace('.', '')} ${value === v ? 'on' : ''}`}
          aria-pressed={value === v} onClick={() => onPick(v)}>
          {LABEL[v]}
        </button>
      ))}
    </div>
  );
}

function DayView({ day, employees, busy, onMark, onHoliday }) {
  const off = day.holiday;
  return (
    <section className="card">
      <div className="card-head">
        <h2>{formatDate(day.date)} <span className="muted">({weekday(day.date)})</span></h2>
        <label className="check">
          <input type="checkbox" checked={off} disabled={busy} onChange={(e) => onHoliday(day.date, e.target.checked)} />
          Holiday / no work for everyone
        </label>
      </div>
      {day.future && <p className="muted small">This date is in the future; it will be counted once the day arrives.</p>}
      <ul className="att-list">
        {employees.map((e) => {
          const mark = day.marks[String(e.id)];
          return (
            <li key={e.id}>
              <span className="att-name">{e.name}</span>
              {mark === null ? (
                <span className="muted small">Starts {formatDate(e.start_date)}</span>
              ) : (
                <MarkButtons name={e.name} value={mark.value} disabled={busy || off}
                  onPick={(v) => onMark(day.date, e.id, v)} />
              )}
            </li>
          );
        })}
      </ul>
      <p className="headline">
        {off ? 'Holiday — not counted' : `Day total: ${day.total ?? '—'} of ${employees.filter((e) => day.marks[String(e.id)] !== null).length}`}
      </p>
    </section>
  );
}

function MonthGrid({ data, busy, onMark, onHoliday }) {
  const today = todayLocal();
  return (
    <section className="card">
      <h2>Attendance grid</h2>
      <p className="muted small">
        Everyone is a full day (1) unless marked. Tap a cell to change it: 1 → ½ (half day) → 0 (leave) → 1.
        Tap a date to mark it as a holiday.
      </p>
      <div className="table-wrap">
        <table className="table att-grid">
          <thead>
            <tr>
              <th className="att-sticky">Member</th>
              {data.days.map((d) => (
                <th key={d.date} className={`att-day ${d.holiday ? 'is-holiday' : ''} ${d.date === today ? 'is-today' : ''}`}>
                  <button type="button" className="att-day-btn" disabled={busy}
                    title={d.holiday ? 'Holiday - tap to make it a working day' : 'Tap to mark as holiday'}
                    aria-label={`${formatDate(d.date)}${d.holiday ? ', holiday' : ''}. Toggle holiday`}
                    onClick={() => onHoliday(d.date, !d.holiday)}>
                    <span>{d.date.slice(8)}</span>
                    <small>{weekday(d.date).slice(0, 2)}</small>
                  </button>
                </th>
              ))}
              <th className="num">Worked</th><th className="num">½ days</th><th className="num">Leave</th>
            </tr>
          </thead>
          <tbody>
            {data.summary.map((e) => (
              <tr key={e.id}>
                <td className="att-sticky strong">{e.name}</td>
                {data.days.map((d) => {
                  const mark = d.marks[String(e.id)];
                  if (mark === null || d.holiday) {
                    return <td key={d.date} className={`att-cell ${d.holiday ? 'is-holiday' : 'is-none'}`}>{d.holiday ? 'H' : ''}</td>;
                  }
                  return (
                    <td key={d.date} className={`att-cell ${d.future ? 'is-future' : ''}`}>
                      <button type="button" disabled={busy || d.future}
                        className={`att-mark att-${mark.value.replace('.', '')}`}
                        aria-label={`${e.name}, ${formatDate(d.date)}: ${LABEL[mark.value]}. Change`}
                        onClick={() => onMark(d.date, e.id, NEXT[mark.value])}>
                        {d.future ? '' : SHORT[mark.value]}
                      </button>
                    </td>
                  );
                })}
                <td className="num strong">{e.days_worked}</td>
                <td className="num">{e.half_days}</td>
                <td className="num">{e.leave_days}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="att-sticky">Day total</th>
              {data.days.map((d) => <td key={d.date} className="att-cell num">{d.total ?? ''}</td>)}
              <td className="num strong">{data.totals.team_days_worked}</td>
              <td className="num">{data.totals.half_days}</td>
              <td className="num">{data.totals.leave_days}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function MemberRow({ employee, onSaved }) {
  const { form, set, errors, setErrors } = useFormState({
    name: employee.name, phone: employee.phone || '', start_date: employee.start_date, end_date: employee.end_date || '',
  });
  const [saving, setSaving] = useState(false);
  const dirty = form.name !== employee.name || form.phone !== (employee.phone || '')
    || form.start_date !== employee.start_date || form.end_date !== (employee.end_date || '');

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/employees/${employee.id}`, form);
      onSaved();
    } catch (err) {
      setErrors(err.fields || { name: err.message });
    } finally {
      setSaving(false);
    }
  };

  const f = { form, onChange: set, errors };
  return (
    <div className={`member-row ${employee.is_active ? '' : 'is-inactive'}`}>
      <Field label="Name" name="name" idPrefix={`m${employee.id}`} {...f} />
      <Field label="Phone" name="phone" type="tel" idPrefix={`m${employee.id}`} {...f} />
      <Field label="Counted from" name="start_date" type="date" idPrefix={`m${employee.id}`} {...f} />
      <Field label="Counted until" name="end_date" type="date" idPrefix={`m${employee.id}`} {...f}
        hint="Blank while still working" />
      <button type="button" className="btn btn-small btn-primary" disabled={!dirty || saving} onClick={save}>
        <Save size={15} aria-hidden="true" /> {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function Members({ employees, reload }) {
  const [adding, setAdding] = useState(false);
  const { form, setForm, set, errors, setErrors } = useFormState({ name: '', phone: '', start_date: todayLocal() });
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await api.post('/employees', form);
      setForm({ name: '', phone: '', start_date: todayLocal() });
      setAdding(false);
      reload();
    } catch (err) {
      setErrors(err.fields || {});
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Team members</h2>
        {!adding && (
          <button type="button" className="btn btn-small btn-secondary" onClick={() => setAdding(true)}>
            <UserPlus size={15} aria-hidden="true" /> Add member
          </button>
        )}
      </div>
      <p className="muted small">Rename the members to their real names. When someone leaves, set “Counted until” to their last day; they stay in the months they worked.</p>
      {employees.map((e) => (
        <MemberRow key={`${e.id}-${e.name}-${e.is_active}-${e.start_date}`} employee={e} onSaved={reload} />
      ))}
      {adding && (
        <form className="member-row member-new" onSubmit={add} noValidate>
          <Field label="Name" name="name" required form={form} onChange={set} errors={errors} autoFocus />
          <Field label="Phone" name="phone" type="tel" form={form} onChange={set} errors={errors} />
          <Field label="Counted from" name="start_date" type="date" required form={form} onChange={set} errors={errors} />
          <button type="button" className="btn btn-small btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          <button type="submit" className="btn btn-small btn-primary" disabled={saving}>
            <Plus size={15} aria-hidden="true" /> {saving ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}
    </section>
  );
}

export default function Employees() {
  const [period, setPeriod] = usePeriod('employees', 'day');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const invalid = periodInvalid(period);
  const params = periodParams(period);

  const att = useLoader(
    () => (invalid ? Promise.resolve(null) : api.get('/attendance', params)),
    [JSON.stringify(params)],
  );
  const staff = useLoader(() => api.get('/employees'), []);

  useEffect(() => {
    setData(att.data);
  }, [att.data]);

  // Each change saves straight away; the server returns the updated day, and the
  // whole period is reloaded so member totals stay exact.
  const run = async (fn) => {
    setBusy(true);
    setActionError(null);
    try {
      const day = await fn();
      setData((cur) => cur && { ...cur, days: cur.days.map((d) => (d.date === day.date ? day : d)) });
      att.reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };
  const onMark = (date, employeeId, value) => run(() => api.put(`/attendance/${date}`, { employee_id: employeeId, value }));
  const onHoliday = (date, holiday) => run(() => api.put(`/attendance/${date}/holiday`, { holiday }));

  const exportCsv = async () => {
    setActionError(null);
    try {
      await downloadCsv('/attendance/export.csv', params, 'attendance.csv');
    } catch (e) {
      setActionError(e);
    }
  };

  const reloadAll = () => {
    staff.reload();
    att.reload();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Employees</h1>
          <p className="muted">Daily attendance — mark only half days and leave; everyone else is a full day.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={exportCsv}><Download size={18} aria-hidden="true" /> Export CSV</button>
        </div>
      </div>

      <div className="toolbar">
        <PeriodFilter value={period} onChange={setPeriod} modes={['day', 'week', 'month']} idPrefix="ep" />
      </div>

      <ErrorBox error={actionError} />
      <ErrorBox error={att.error} onRetry={att.reload} />
      {att.loading && !data && <Loading />}

      {data && (
        <section className="totals-bar" aria-label={`Attendance totals for ${periodTitle(period)}`}>
          <div><span>Working days</span><strong>{data.totals.working_days}</strong></div>
          <div className="totals-main"><span>Team days worked</span><strong>{data.totals.team_days_worked}</strong></div>
          <div><span>Half days</span><strong>{data.totals.half_days}</strong></div>
          <div><span>Leave days</span><strong>{data.totals.leave_days}</strong></div>
          <div><span>Holidays</span><strong>{data.totals.holidays}</strong></div>
        </section>
      )}

      {data && data.employees.length === 0 && (
        <Empty title="No active team members">Add your team below to start tracking attendance.</Empty>
      )}
      {data && data.employees.length > 0 && (period.mode === 'day'
        ? <DayView day={data.days[0]} employees={data.employees} busy={busy} onMark={onMark} onHoliday={onHoliday} />
        : <MonthGrid data={data} busy={busy} onMark={onMark} onHoliday={onHoliday} />)}

      {staff.data && <Members employees={staff.data.employees} reload={reloadAll} />}
    </div>
  );
}
