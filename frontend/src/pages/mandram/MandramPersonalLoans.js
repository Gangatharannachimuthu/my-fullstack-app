import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { personalLoanService } from '../../services/mandramApi';
import IconButton from './IconButton';

function MandramPersonalLoans({ members, meetings, selectedMeetingId }) {
  const [loans, setLoans] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [repayInputs, setRepayInputs] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const refresh = useCallback(async () => {
    const res = await personalLoanService.getAll();
    setLoans(res.data || []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const memberName = (id) => members.find((m) => m.id === id)?.name || `#${id}`;

  const handleDisburse = async (e) => {
    e.preventDefault();
    if (!memberId || !amount || !selectedMeetingId) return;
    try {
      setSubmitting(true);
      setError('');
      await personalLoanService.disburse({
        member_id: Number(memberId),
        amount: Number(amount),
        disbursed_meeting_id: selectedMeetingId,
      });
      setMemberId('');
      setAmount('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disburse personal loan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepay = async (loanId) => {
    const interestAmount = Number(repayInputs[loanId] || 0);
    try {
      setError('');
      await personalLoanService.repay(loanId, {
        meeting_id: selectedMeetingId,
        interest_amount: interestAmount,
      });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record repayment');
    }
  };

  const startEditAmount = (loan) => {
    setEditingId(loan.id);
    setEditValue(loan.status === 'outstanding' ? loan.amount : loan.interest_amount || 0);
  };

  const cancelEditAmount = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEditAmount = async (loan) => {
    try {
      setError('');
      const payload = loan.status === 'outstanding' ? { amount: Number(editValue) } : { interest_amount: Number(editValue) };
      await personalLoanService.update(loan.id, payload);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update personal loan');
    }
  };

  const handleDelete = async (loan) => {
    if (!window.confirm(`Remove the personal loan for ${memberName(loan.member_id)}?`)) return;
    try {
      setError('');
      await personalLoanService.remove(loan.id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove personal loan');
    }
  };

  const handleRevert = async (loanId) => {
    if (!window.confirm('Revert this loan back to outstanding? This clears the repayment.')) return;
    try {
      setError('');
      await personalLoanService.update(loanId, { revert_to_outstanding: true });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revert personal loan');
    }
  };

  const outstanding = loans.filter((l) => l.status === 'outstanding');
  const repaid = loans.filter((l) => l.status === 'repaid');

  return (
    <>
      <div className="card">
        <h2>Disburse New Personal Loan (இந்த மாத தனிக்கடன்)</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleDisburse} className="inline-form">
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
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={submitting || !selectedMeetingId}>
            {submitting ? 'Disbursing...' : 'Disburse in selected meeting'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Outstanding Personal Loans (due to be repaid next meeting)</h2>
        {outstanding.length === 0 ? (
          <p>None outstanding.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Repay Interest</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {outstanding.map((loan) => (
                <tr key={loan.id}>
                  <td>{memberName(loan.member_id)}</td>
                  <td>
                    {editingId === loan.id ? (
                      <div className="inline-form">
                        <input
                          type="number"
                          style={{ width: 90 }}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <div className="icon-btn-group">
                          <IconButton icon={Check} variant="save" title="Save" onClick={() => saveEditAmount(loan)} />
                          <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEditAmount} />
                        </div>
                      </div>
                    ) : (
                      <div className="inline-form">
                        ₹{Number(loan.amount).toFixed(2)}
                        <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEditAmount(loan)} />
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      placeholder="Interest"
                      value={repayInputs[loan.id] || ''}
                      onChange={(e) => setRepayInputs({ ...repayInputs, [loan.id]: e.target.value })}
                      style={{ width: 100 }}
                    />
                  </td>
                  <td>
                    <div className="icon-btn-group">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleRepay(loan.id)}
                        disabled={!selectedMeetingId}
                      >
                        Mark Repaid in Selected Meeting
                      </button>
                      <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(loan)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Repaid Personal Loans</h2>
        {repaid.length === 0 ? (
          <p>None yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Interest</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {repaid.map((loan) => (
                <tr key={loan.id}>
                  <td>{memberName(loan.member_id)}</td>
                  <td>₹{Number(loan.amount).toFixed(2)}</td>
                  <td>
                    {editingId === loan.id ? (
                      <div className="inline-form">
                        <input
                          type="number"
                          style={{ width: 90 }}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                        <div className="icon-btn-group">
                          <IconButton icon={Check} variant="save" title="Save" onClick={() => saveEditAmount(loan)} />
                          <IconButton icon={X} variant="cancel" title="Cancel" onClick={cancelEditAmount} />
                        </div>
                      </div>
                    ) : (
                      <div className="inline-form">
                        ₹{Number(loan.interest_amount || 0).toFixed(2)}
                        <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEditAmount(loan)} />
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="icon-btn-group">
                      <IconButton
                        icon={RotateCcw}
                        variant="revert"
                        title="Revert to Outstanding"
                        onClick={() => handleRevert(loan.id)}
                      />
                      <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(loan)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default MandramPersonalLoans;
