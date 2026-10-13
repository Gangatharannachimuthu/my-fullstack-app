import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import { joiningService } from '../../services/mandramApi';
import IconButton from './IconButton';

/**
 * Admin panel for joining contributions.
 *
 * Two lists on purpose. "Needs a joining contribution" is the one that matters: it
 * surfaces every member who joined after the group started and has no due recorded,
 * so a late joiner cannot quietly end up owing nothing. The app proposes the amount
 * and shows its working, but the figure stays editable - the group may round it or
 * agree something different, and that decision is theirs, not the app's.
 */
function JoiningDuesPanel() {
  const [dues, setDues] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amounts, setAmounts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [duesRes, candRes] = await Promise.all([
        joiningService.getDues(),
        joiningService.getCandidates(),
      ]);
      setDues(duesRes.data || []);
      setCandidates(candRes.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load joining contributions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createDue = async (candidate) => {
    const typed = amounts[candidate.member_id];
    const amount = typed === undefined || typed === '' ? candidate.suggested_amount : Number(typed);
    if (!amount || amount <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }
    try {
      setError('');
      await joiningService.createDue({
        member_id: candidate.member_id,
        total_amount: amount,
        basis_meeting_id: candidate.basis_meeting_id,
        note: candidate.working,
      });
      setAmounts({ ...amounts, [candidate.member_id]: '' });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create joining contribution');
    }
  };

  const saveEdit = async (due) => {
    try {
      setError('');
      await joiningService.updateDue(due.id, { total_amount: Number(editAmount) });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
    }
  };

  const removeDue = async (due) => {
    if (!window.confirm(`Remove the joining contribution for ${due.member_name}?`)) return;
    try {
      setError('');
      await joiningService.removeDue(due.id);
      await refresh();
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to remove';
      // The API refuses while installments exist; offer the explicit force path
      // rather than silently discarding payment history.
      if (err.response?.status === 409 && window.confirm(`${message}\n\nDrop the due anyway?`)) {
        try {
          await joiningService.removeDue(due.id, true);
          await refresh();
          return;
        } catch (e2) {
          setError(e2.response?.data?.error || 'Failed to remove');
          return;
        }
      }
      setError(message);
    }
  };

  return (
    <div className="card">
      <div className="summary-header-row">
        <h2>Joining Contributions (சேர்க்கை தொகை)</h2>
        <button
          type="button"
          className="btn btn-with-icon"
          onClick={refresh}
          disabled={loading}
          title="Re-check for members who need a joining contribution"
        >
          <RefreshCw size={15} className={loading ? 'spinning' : undefined} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <p className="muted-note">
        A member who joins after the mandram has been running buys an equal share of what the group
        already built. The amount is the <strong>existing per-member stake</strong> — the fund&apos;s
        value the month before they joined, divided by the members at that time. Until it is fully
        paid they cannot take a loan.
      </p>
      {error && <div className="alert alert-error">{error}</div>}

      <h3>Needs a joining contribution</h3>
      {loading && candidates.length === 0 ? (
        <p>Loading...</p>
      ) : candidates.length === 0 ? (
        <p>Every member who joined late already has one recorded.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Joined</th>
              <th>Fund value before they joined</th>
              <th>Suggested amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.member_id}>
                <td>{c.member_name}</td>
                <td>{c.joined_date}</td>
                <td>
                  ₹{Number(c.net_worth).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  <div className="joining-working">
                    as of {c.basis_label} · cash ₹{Number(c.cash).toFixed(0)} + loans out ₹
                    {Number(c.loans_out).toFixed(0)} + investments ₹
                    {Number(c.investments_held).toFixed(0)}
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    style={{ width: 110 }}
                    placeholder={String(c.suggested_amount)}
                    value={amounts[c.member_id] ?? ''}
                    onChange={(e) => setAmounts({ ...amounts, [c.member_id]: e.target.value })}
                  />
                  <div className="joining-working">÷ {c.member_count} members = {c.working.split('= ')[1]}</div>
                </td>
                <td>
                  <button type="button" className="btn btn-primary" onClick={() => createDue(c)}>
                    Set
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{ marginTop: 22 }}>Recorded</h3>
      {dues.length === 0 ? (
        <p>No joining contributions recorded yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Basis</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dues.map((d) => (
              <tr key={d.id}>
                <td>{d.member_name}</td>
                <td>
                  {editingId === d.id ? (
                    <input
                      type="number"
                      style={{ width: 110 }}
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                  ) : (
                    `₹${Number(d.total_amount).toFixed(2)}`
                  )}
                </td>
                <td>₹{Number(d.paid).toFixed(2)}</td>
                <td>₹{Number(d.remaining).toFixed(2)}</td>
                <td>
                  <span className={`badge ${d.is_cleared ? 'badge-success' : 'badge-warning'}`}>
                    {d.is_cleared ? 'fully paid' : 'outstanding'}
                  </span>
                </td>
                <td>{d.basis_label || '-'}</td>
                <td>
                  <div className="icon-btn-group">
                    {editingId === d.id ? (
                      <>
                        <IconButton icon={Check} variant="save" title="Save" onClick={() => saveEdit(d)} />
                        <IconButton icon={X} variant="cancel" title="Cancel" onClick={() => setEditingId(null)} />
                      </>
                    ) : (
                      <>
                        <IconButton
                          icon={Pencil}
                          variant="edit"
                          title="Edit amount"
                          onClick={() => {
                            setEditingId(d.id);
                            setEditAmount(d.total_amount);
                          }}
                        />
                        <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => removeDue(d)} />
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default JoiningDuesPanel;
