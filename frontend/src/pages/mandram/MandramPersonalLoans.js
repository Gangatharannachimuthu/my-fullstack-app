import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import { personalLoanService } from '../../services/mandramApi';
import IconButton from './IconButton';

function MandramPersonalLoans({
  members,
  meetings,
  selectedMeetingId,
  canEdit = true,
  isAdmin = false,
  memberId: ownMemberId = null,
}) {
  const [loans, setLoans] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [filterMemberId, setFilterMemberId] = useState('');

  // A viewer only ever sees their own loans - the API enforces this too, so the
  // filter here is about what the UI asks for, not the guarantee.
  const scopedMemberId = isAdmin ? filterMemberId : ownMemberId;

  const refresh = useCallback(async () => {
    const params = scopedMemberId ? { member_id: Number(scopedMemberId) } : undefined;
    const res = await personalLoanService.getAll(params);
    setLoans(res.data || []);
  }, [scopedMemberId]);

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

  const meetingKey = (id) => {
    const m = (meetings || []).find((mm) => mm.id === id);
    return m ? m.year * 12 + m.month : null;
  };
  const selectedKey = meetingKey(selectedMeetingId);

  // Show a loan only in the months it was actually running: from the month it was
  // disbursed through the month it was repaid. A loan disbursed in July shouldn't appear
  // while looking at April/May/June, and one repaid in September shouldn't appear from
  // October onwards. An unrepaid loan keeps showing every month until it is repaid.
  const visibleLoans = loans.filter((loan) => {
    if (!selectedKey) return true;

    const disbursedKey = meetingKey(loan.disbursed_meeting_id);
    if (disbursedKey && disbursedKey > selectedKey) return false;

    if (loan.status !== 'repaid') return true;

    // Repaid loans still show in the month they were settled. If we can't tell which
    // month that was, keep showing it rather than silently hiding history.
    const repaidKey = meetingKey(loan.repaid_meeting_id);
    return !repaidKey || repaidKey >= selectedKey;
  });

  // Which table a loan belongs in depends on the month being viewed, not on its status
  // today - a loan repaid in September was still outstanding when looking at July.
  const isRepaidAsOf = (loan) => {
    if (loan.status !== 'repaid') return false;
    const repaidKey = meetingKey(loan.repaid_meeting_id);
    if (!repaidKey || !selectedKey) return true;
    return repaidKey <= selectedKey;
  };

  const outstanding = visibleLoans.filter((l) => !isRepaidAsOf(l));
  const repaid = visibleLoans.filter(isRepaidAsOf);

  // Totals match the rows actually listed, so they respect the Member filter and
  // the selected meeting's visibility window.
  const sum = (rows, field) => rows.reduce((total, l) => total + Number(l[field] || 0), 0);
  const outstandingTotal = sum(outstanding, 'amount');
  const repaidTotal = sum(repaid, 'amount');
  const repaidInterestTotal = sum(repaid, 'interest_amount');

  return (
    <>
      {canEdit && (
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
      )}

      <div className="card">
        <div className="summary-header-row">
          <h2>Outstanding Personal Loans (due to be repaid next meeting)</h2>
          {isAdmin && (
            <div className="month-filter-row">
              <label>Member:</label>
              <select value={filterMemberId} onChange={(e) => setFilterMemberId(e.target.value)}>
                <option value="">All members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {!isAdmin && !ownMemberId ? (
          <p>This login isn't linked to a member yet, so there are no loans to show. Ask the admin to link it.</p>
        ) : outstanding.length === 0 ? (
          <p>None outstanding.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                {canEdit && <th></th>}
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
                        {canEdit && (
                          <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEditAmount(loan)} />
                        )}
                      </div>
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      <div className="icon-btn-group">
                        <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => handleDelete(loan)} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              <tr>
                <td className="font-weight-bold">Total ({outstanding.length})</td>
                <td className="font-weight-bold">₹{outstandingTotal.toFixed(2)}</td>
                {canEdit && <td></td>}
              </tr>
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
                {canEdit && <th></th>}
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
                        {canEdit && (
                          <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEditAmount(loan)} />
                        )}
                      </div>
                    )}
                  </td>
                  {canEdit && (
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
                  )}
                </tr>
              ))}
              <tr>
                <td className="font-weight-bold">Total ({repaid.length})</td>
                <td className="font-weight-bold">₹{repaidTotal.toFixed(2)}</td>
                <td className="font-weight-bold">₹{repaidInterestTotal.toFixed(2)}</td>
                {canEdit && <td></td>}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default MandramPersonalLoans;
