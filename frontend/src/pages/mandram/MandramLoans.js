import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { loanService } from '../../services/mandramApi';
import IconButton from './IconButton';

function MandramLoans({ members, selectedMeetingId }) {
  const [loans, setLoans] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const refresh = useCallback(async () => {
    const res = await loanService.getAll();
    setLoans(res.data || []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const memberName = (id) => members.find((m) => m.id === id)?.name || `#${id}`;

  const handleOpenLoan = async (e) => {
    e.preventDefault();
    if (!memberId || !principal) return;
    try {
      setSubmitting(true);
      setError('');
      await loanService.create({
        member_id: Number(memberId),
        principal_amount: Number(principal),
        start_meeting_id: selectedMeetingId,
      });
      setMemberId('');
      setPrincipal('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to open loan');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (loan) => {
    setEditingId(loan.id);
    setEditValues({
      principal_amount: loan.principal_amount,
      current_outstanding_balance: loan.current_outstanding_balance,
      status: loan.status,
    });
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async (loan) => {
    if (!window.confirm(`Remove the EMI loan for ${memberName(loan.member_id)}?`)) return;
    try {
      setError('');
      await loanService.remove(loan.id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove loan');
    }
  };

  const saveEdit = async (loanId) => {
    try {
      setError('');
      await loanService.update(loanId, {
        principal_amount: Number(editValues.principal_amount),
        current_outstanding_balance: Number(editValues.current_outstanding_balance),
        status: editValues.status,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update loan');
    }
  };

  return (
    <>
      <div className="card">
        <h2>Open a New EMI Loan</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleOpenLoan} className="inline-form">
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Principal amount"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Opening...' : 'Open Loan'}
          </button>
        </form>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 10 }}>
          A member can only have one active EMI loan at a time.
        </p>
      </div>

      <div className="card">
        <h2>EMI Loans</h2>
        {loans.length === 0 ? (
          <p>No EMI loans yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{memberName(loan.member_id)}</td>
                  {editingId === loan.id ? (
                    <>
                      <td>
                        <input
                          type="number"
                          style={{ width: 90 }}
                          value={editValues.principal_amount}
                          onChange={(e) => setEditValues({ ...editValues, principal_amount: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          style={{ width: 90 }}
                          value={editValues.current_outstanding_balance}
                          onChange={(e) =>
                            setEditValues({ ...editValues, current_outstanding_balance: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={editValues.status}
                          onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                        >
                          <option value="active">active</option>
                          <option value="closed">closed</option>
                        </select>
                      </td>
                      <td>
                        <div className="icon-btn-group">
                          <IconButton icon={Check} variant="save" title="Save" onClick={() => saveEdit(loan.id)} />
                          <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEdit} />
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>₹{Number(loan.principal_amount).toFixed(2)}</td>
                      <td>₹{Number(loan.current_outstanding_balance).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${loan.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td>
                        <div className="icon-btn-group">
                          <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEdit(loan)} />
                          <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(loan)} />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default MandramLoans;
