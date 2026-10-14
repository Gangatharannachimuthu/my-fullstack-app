import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Pencil, Plus, Search, Ban } from 'lucide-react';
import { api, downloadCsv } from '../api';
import PeriodFilter, { newEntryLink, periodInvalid, periodParams, usePeriod } from '../components/PeriodFilter';
import {
  ConfirmDialog, Empty, ErrorBox, Loading, Pagination, StatusBadge, useDebounced, useLoader,
} from '../components/ui';
import { formatDate, formatINR } from '../utils/format';

export default function Purchases() {
  const navigate = useNavigate();
  const [period, setPeriod] = usePeriod('purchases');
  const [search, setSearch] = useState('');
  const [material, setMaterial] = useState('');
  const [showVoided, setShowVoided] = useState(false);
  const [page, setPage] = useState(1);
  const [voiding, setVoiding] = useState(null);
  const [exportError, setExportError] = useState(null);
  const q = useDebounced(search);
  const invalid = periodInvalid(period);

  const params = {
    ...periodParams(period), q, material, include_voided: showVoided ? 'true' : '',
  };
  const list = useLoader(
    () => (invalid ? Promise.resolve(null) : api.get('/purchases', { ...params, page })),
    [JSON.stringify(params), page],
  );
  const materials = useLoader(() => api.get('/purchases/materials'), []);

  const resetPage = (fn) => (v) => {
    setPage(1);
    fn(v);
  };

  const exportCsv = async () => {
    setExportError(null);
    try {
      await downloadCsv('/purchases/export.csv', params, 'raw-material-purchases.csv');
    } catch (e) {
      setExportError(e);
    }
  };

  const d = list.data;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Raw Materials &amp; Purchases</h1>
          <p className="muted">Every outside purchase, newest first.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={exportCsv}><Download size={18} aria-hidden="true" /> Export CSV</button>
          <Link to={newEntryLink('/raw-materials/new', period)} className="btn btn-primary"><Plus size={18} aria-hidden="true" /> Add Purchase</Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="field field-inline search">
          <label htmlFor="p-search">Search</label>
          <div className="input-icon">
            <Search size={16} aria-hidden="true" />
            <input id="p-search" type="search" placeholder="Material, supplier, place or invoice no."
              value={search} onChange={(e) => resetPage(setSearch)(e.target.value)} />
          </div>
        </div>
        <PeriodFilter value={period} onChange={resetPage(setPeriod)} modes={['day', 'week', 'month', 'range', 'all']} idPrefix="pp" />
        <div className="field field-inline">
          <label htmlFor="p-material">Material</label>
          <select id="p-material" value={material} onChange={(e) => resetPage(setMaterial)(e.target.value)}>
            <option value="">All materials</option>
            {(materials.data?.materials || []).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={showVoided} onChange={(e) => resetPage(setShowVoided)(e.target.checked)} />
          Show voided
        </label>
      </div>

      <ErrorBox error={exportError} />
      <ErrorBox error={list.error} onRetry={list.reload} />

      {d && (
        <section className="totals-bar" aria-label="Totals for the selected filter">
          <div><span>Purchases</span><strong>{d.totals.count}</strong></div>
          <div><span>Taxable</span><strong>{formatINR(d.totals.taxable_amount)}</strong></div>
          <div><span>CGST</span><strong>{formatINR(d.totals.cgst_amount)}</strong></div>
          <div><span>SGST</span><strong>{formatINR(d.totals.sgst_amount)}</strong></div>
          <div><span>IGST</span><strong>{formatINR(d.totals.igst_amount)}</strong></div>
          <div className="totals-main"><span>Grand total</span><strong>{formatINR(d.totals.total_amount)}</strong></div>
        </section>
      )}

      <section className="card">
        {list.loading && !d && <Loading />}
        {d && d.items.length === 0 && (
          <Empty title="No purchases found">Try another period or search, or add a new purchase.</Empty>
        )}
        {d && d.items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Purchase Date</th><th>Material</th><th>Supplier/Place</th><th className="num">Quantity</th>
                  <th className="num">Taxable Amount</th><th className="num">CGST</th><th className="num">SGST</th>
                  <th className="num">IGST</th><th className="num">Grand Total</th><th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((p) => (
                  <tr key={p.id} className={p.is_voided ? 'row-voided' : ''}>
                    <td>{formatDate(p.purchase_date)}</td>
                    <td>
                      {p.material_name}
                      {p.supplier_invoice_number && <div className="muted small">Ref: {p.supplier_invoice_number}</div>}
                      {p.is_voided && <div><StatusBadge value="Voided" /></div>}
                    </td>
                    <td>{[p.supplier_name, p.supplier_place].filter(Boolean).join(', ') || '—'}</td>
                    <td className="num">{p.quantity ? `${p.quantity} ${p.unit || ''}` : '—'}</td>
                    <td className="num">{formatINR(p.taxable_amount)}</td>
                    <td className="num">{formatINR(p.cgst_amount)}</td>
                    <td className="num">{formatINR(p.sgst_amount)}</td>
                    <td className="num">{formatINR(p.igst_amount)}</td>
                    <td className="num strong">{formatINR(p.total_amount)}</td>
                    <td className="row-actions">
                      {!p.is_voided && (
                        <>
                          <button type="button" className="btn btn-small btn-ghost" title="Edit" onClick={() => navigate(`/raw-materials/${p.id}/edit`)}
                            aria-label={`Edit purchase of ${p.material_name} on ${formatDate(p.purchase_date)}`}>
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button type="button" className="btn btn-small btn-ghost danger-text" title="Void" onClick={() => setVoiding(p)}
                            aria-label={`Void purchase of ${p.material_name} on ${formatDate(p.purchase_date)}`}>
                            <Ban size={15} aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d && <Pagination page={d.page} perPage={d.per_page} total={d.total_rows} onPage={setPage} />}
      </section>

      <ConfirmDialog
        open={!!voiding}
        title="Void this purchase?"
        message={voiding ? `${voiding.material_name} on ${formatDate(voiding.purchase_date)} for ${formatINR(voiding.total_amount)} will be removed from all totals. The record is kept for audit and cannot be edited afterwards.` : ''}
        confirmLabel="Void purchase"
        danger
        withReason
        onConfirm={async (reason) => {
          await api.post(`/purchases/${voiding.id}/void`, { reason });
          list.reload();
        }}
        onClose={() => setVoiding(null)}
      />
    </div>
  );
}
