import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, downloadCsv } from '../api';
import PeriodFilter, {
  newEntryLink, periodInvalid, periodParams, periodTitle, usePeriod } from '../components/PeriodFilter';
import { ConfirmDialog, Empty, ErrorBox, Loading, Pagination, useLoader } from '../components/ui';
import { formatCount, formatDate, formatINR, shortMonthLabel } from '../utils/format';

function headline(period, total) {
  return `${periodTitle(period)} — ${formatCount(total)} bricks`;
}

export default function Production() {
  const navigate = useNavigate();
  const [period, setPeriod] = usePeriod('production');
  const [brickType, setBrickType] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [exportError, setExportError] = useState(null);
  const invalid = periodInvalid(period);

  const params = { ...periodParams(period), brick_type: brickType };
  const list = useLoader(
    () => (invalid ? Promise.resolve(null) : api.get('/production', { ...params, page })),
    [JSON.stringify(params), page],
  );
  const monthly = useLoader(
    () => (period.mode === 'year' && !invalid ? api.get('/production/monthly', { year: period.year }) : Promise.resolve(null)),
    [period.mode, period.year],
  );
  const types = useLoader(() => api.get('/production/brick-types'), []);

  const change = (fn) => (v) => {
    setPage(1);
    fn(v);
  };

  const exportCsv = async () => {
    setExportError(null);
    try {
      await downloadCsv('/production/export.csv', params, 'daily-production.csv');
    } catch (e) {
      setExportError(e);
    }
  };

  const d = list.data;
  const s = d?.summary;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Manufacturing</h1>
          <p className="muted">Daily brick production.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={exportCsv}><Download size={18} aria-hidden="true" /> Export CSV</button>
          <Link to={newEntryLink('/manufacturing/new', period)} className="btn btn-primary"><Plus size={18} aria-hidden="true" /> Add Production</Link>
        </div>
      </div>

      <div className="toolbar">
        <PeriodFilter value={period} onChange={change(setPeriod)} modes={['day', 'week', 'month', 'year', 'range']} idPrefix="mp" />
        {(types.data?.brick_types || []).length > 0 && (
          <div className="field field-inline">
            <label htmlFor="m-type">Brick type</label>
            <select id="m-type" value={brickType} onChange={(e) => change(setBrickType)(e.target.value)}>
              <option value="">All types</option>
              {types.data.brick_types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      <ErrorBox error={exportError} />
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && !d && <Loading />}

      {s && (
        <>
          <p className="headline">{headline(period, s.total_bricks)}</p>
          <section className="stats" aria-label="Production summary">
            <div className="stat"><span className="stat-label">Total bricks produced</span><strong className="stat-value">{formatCount(s.total_bricks)}</strong></div>
            <div className="stat stat-team">
              <span className="stat-label">Team amount</span>
              <strong className="stat-value">{formatINR(s.labour_amount)}</strong>
              <span className="stat-sub">Labour pay for bricks produced</span>
            </div>
            {period.mode === 'day' ? (
              <div className="stat"><span className="stat-label">Entries on this day</span><strong className="stat-value">{d.total_rows}</strong></div>
            ) : (
              <>
                <div className="stat"><span className="stat-label">Production days</span><strong className="stat-value">{s.production_days}</strong></div>
                <div className="stat"><span className="stat-label">Average per production day</span><strong className="stat-value">{formatCount(s.average_per_day)}</strong></div>
              </>
            )}
          </section>
        </>
      )}

      {monthly.data && (
        <section className="card">
          <h2>Monthly totals — {monthly.data.year}</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Month</th><th className="num">Bricks</th><th className="num">Team amount</th><th className="num">Production days</th></tr></thead>
              <tbody>
                {monthly.data.months.map((m) => (
                  <tr key={m.month}>
                    <td>{shortMonthLabel(m.month)}</td>
                    <td className="num">{formatCount(m.total_bricks)}</td>
                    <td className="num">{formatINR(m.labour_amount)}</td>
                    <td className="num">{m.production_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {d && (
        <div className="grid-2 grid-wide-left">
          <section className="card">
            <h2>Production entries</h2>
            {d.items.length === 0 ? (
              <Empty title="No production recorded for this period">
                <Link to={newEntryLink('/manufacturing/new', period)} className="link">
                  {period.mode === 'day' ? `Add production for ${formatDate(period.day)}` : 'Add production'}
                </Link>
              </Empty>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Brick type</th><th className="num">Quantity</th><th className="num">Team amount</th><th>Shift / team</th><th><span className="sr-only">Actions</span></th></tr>
                  </thead>
                  <tbody>
                    {d.items.map((e) => (
                      <tr key={e.id}>
                        <td>{formatDate(e.production_date)}</td>
                        <td>{e.brick_type || '—'}</td>
                        <td className="num strong">{formatCount(e.quantity_produced)}</td>
                        <td className="num">
                          {formatINR(e.labour_amount)}
                          <div className="muted small">@ {formatINR(e.labour_rate)}/brick</div>
                        </td>
                        <td>{e.shift_note || '—'}{e.notes && <div className="muted small">{e.notes}</div>}</td>
                        <td className="row-actions">
                          <button type="button" className="btn btn-small btn-ghost" onClick={() => navigate(`/manufacturing/${e.id}/edit`)}
                            aria-label={`Edit production on ${formatDate(e.production_date)}`}>
                            <Pencil size={15} aria-hidden="true" /> Edit
                          </button>
                          <button type="button" className="btn btn-small btn-ghost danger-text" onClick={() => setDeleting(e)}
                            aria-label={`Delete production on ${formatDate(e.production_date)}`}>
                            <Trash2 size={15} aria-hidden="true" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={d.page} perPage={d.per_page} total={d.total_rows} onPage={setPage} />
          </section>

          <section className="card">
            <h2>Daily totals</h2>
            {s.daily.length === 0 ? <p className="muted">Nothing yet.</p> : (
              <div className="table-wrap">
                <table className="table table-compact">
                  <thead><tr><th>Date</th><th className="num">Bricks</th><th className="num">Team amount</th></tr></thead>
                  <tbody>
                    {s.daily.map((row) => (
                      <tr key={row.date}><td>{formatDate(row.date)}</td><td className="num">{formatCount(row.quantity)}</td><td className="num">{formatINR(row.labour_amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <p className="muted small">Available stock is not shown because sales deliveries, wastage and opening stock are not tracked yet.</p>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this production entry?"
        message={deleting ? `${formatCount(deleting.quantity_produced)} bricks on ${formatDate(deleting.production_date)} will be permanently removed from the totals.` : ''}
        confirmLabel="Delete entry"
        danger
        onConfirm={async () => {
          await api.del(`/production/${deleting.id}`);
          list.reload();
          monthly.reload();
        }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
