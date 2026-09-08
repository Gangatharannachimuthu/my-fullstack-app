import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { meetingService, loanService, personalLoanService, penaltyService } from '../../services/mandramApi';
import IconButton from './IconButton';

function MandramLedger({ meetingId, members }) {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [shareInputs, setShareInputs] = useState({});
  const [emiInputs, setEmiInputs] = useState({});
  const [emiEditingFor, setEmiEditingFor] = useState(null);
  const [emiPrincipalEditingFor, setEmiPrincipalEditingFor] = useState(null);
  const [emiPrincipalEditValue, setEmiPrincipalEditValue] = useState('');
  const [personalLoanEditingFor, setPersonalLoanEditingFor] = useState(null);
  const [personalLoanEditValue, setPersonalLoanEditValue] = useState('');
  const [newLoanInputs, setNewLoanInputs] = useState({});
  const [newLoanOpenFor, setNewLoanOpenFor] = useState(null);
  const [repayInputs, setRepayInputs] = useState({});
  const [penaltyInputs, setPenaltyInputs] = useState({});
  const [penaltyOpenFor, setPenaltyOpenFor] = useState(null);
  const [penaltyEditingId, setPenaltyEditingId] = useState(null);
  const [penaltyEditValues, setPenaltyEditValues] = useState({});

  const refresh = useCallback(async () => {
    if (!meetingId) {
      setLedger(null);
      return;
    }
    setLoading(true);
    try {
      const res = await meetingService.getLedger(meetingId);
      setLedger(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load ledger for this meeting');
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveShare = async (memberId) => {
    const amount = shareInputs[memberId];
    if (amount === undefined || amount === '') return;
    try {
      setError('');
      await meetingService.upsertShareContribution(meetingId, { member_id: memberId, amount: Number(amount) });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save share amount');
    }
  };

  const startEmiEdit = (row) => {
    setEmiEditingFor(row.member_id);
    setEmiInputs({
      ...emiInputs,
      [row.member_id]: {
        installment: row.emi_loan.installment_paid,
        interest: row.emi_loan.interest_paid,
      },
    });
  };

  const savePayment = async (loanId, memberId, isEdit) => {
    const values = emiInputs[memberId] || {};
    try {
      setError('');
      const payload = {
        installment_paid: Number(values.installment || 0),
        interest_paid: Number(values.interest || 0),
      };
      if (isEdit) {
        await loanService.updatePayment(loanId, meetingId, payload);
      } else {
        await loanService.recordPayment(loanId, { meeting_id: meetingId, ...payload });
      }
      setEmiEditingFor(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record EMI payment');
    }
  };

  const removePayment = async (loanId) => {
    if (!window.confirm('Remove this EMI payment?')) return;
    try {
      setError('');
      await loanService.removePayment(loanId, meetingId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove EMI payment');
    }
  };

  const startEmiPrincipalEdit = (row) => {
    setEmiPrincipalEditingFor(row.member_id);
    setEmiPrincipalEditValue(row.emi_loan.principal_amount);
  };

  const saveEmiPrincipalEdit = async (loanId) => {
    try {
      setError('');
      await loanService.update(loanId, {
        principal_amount: Number(emiPrincipalEditValue),
        current_outstanding_balance: Number(emiPrincipalEditValue),
      });
      setEmiPrincipalEditingFor(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update loan amount');
    }
  };

  const removeEmiLoan = async (loanId) => {
    if (!window.confirm('Remove this EMI loan entirely?')) return;
    try {
      setError('');
      await loanService.remove(loanId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove EMI loan');
    }
  };

  const startPersonalLoanEdit = (row) => {
    setPersonalLoanEditingFor(row.member_id);
    if (row.personal_loan_repaid) {
      setPersonalLoanEditValue(row.personal_loan_repaid.interest_amount || 0);
    } else if (row.personal_loan_new) {
      setPersonalLoanEditValue(row.personal_loan_new.amount || 0);
    } else if (row.personal_loan_pending) {
      setPersonalLoanEditValue(row.personal_loan_pending.amount || 0);
    }
  };

  const savePersonalLoanEdit = async (row) => {
    try {
      setError('');
      if (row.personal_loan_repaid) {
        await personalLoanService.update(row.personal_loan_repaid.personal_loan_id, {
          interest_amount: Number(personalLoanEditValue),
        });
      } else if (row.personal_loan_new) {
        await personalLoanService.update(row.personal_loan_new.personal_loan_id, {
          amount: Number(personalLoanEditValue),
        });
      } else if (row.personal_loan_pending) {
        await personalLoanService.update(row.personal_loan_pending.personal_loan_id, {
          amount: Number(personalLoanEditValue),
        });
      }
      setPersonalLoanEditingFor(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update personal loan');
    }
  };

  const removePersonalLoan = async (personalLoanId) => {
    if (!window.confirm('Remove this personal loan entirely (disbursement and repayment)?')) return;
    try {
      setError('');
      await personalLoanService.remove(personalLoanId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove personal loan');
    }
  };

  const disburseNewLoan = async (memberId) => {
    const amount = newLoanInputs[memberId];
    if (!amount) return;
    try {
      setError('');
      await personalLoanService.disburse({
        member_id: memberId,
        amount: Number(amount),
        disbursed_meeting_id: meetingId,
      });
      setNewLoanOpenFor(null);
      setNewLoanInputs({ ...newLoanInputs, [memberId]: '' });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disburse personal loan');
    }
  };

  const repayPending = async (row) => {
    const interestAmount = Number(repayInputs[row.member_id] || 0);
    try {
      setError('');
      await personalLoanService.repay(row.personal_loan_pending.personal_loan_id, {
        meeting_id: meetingId,
        interest_amount: interestAmount,
      });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record repayment');
    }
  };

  const savePenalty = async (memberId) => {
    const values = penaltyInputs[memberId] || {};
    if (!values.amount || !values.reason) return;
    try {
      setError('');
      await penaltyService.create({
        member_id: memberId,
        meeting_id: meetingId,
        amount: Number(values.amount),
        reason: values.reason,
      });
      setPenaltyOpenFor(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add penalty');
    }
  };

  const startPenaltyEdit = (penalty) => {
    setPenaltyEditingId(penalty.id);
    setPenaltyEditValues({ amount: penalty.amount, reason: penalty.reason });
  };

  const savePenaltyEdit = async (penaltyId) => {
    try {
      setError('');
      await penaltyService.update(penaltyId, {
        amount: Number(penaltyEditValues.amount),
        reason: penaltyEditValues.reason,
      });
      setPenaltyEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update penalty');
    }
  };

  const removePenalty = async (penaltyId) => {
    if (!window.confirm('Remove this penalty?')) return;
    try {
      setError('');
      await penaltyService.remove(penaltyId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove penalty');
    }
  };

  if (!meetingId) {
    return (
      <div className="card">
        <p>Open a meeting first, then pick it from the Month/Year dropdown above.</p>
      </div>
    );
  }

  if (loading) return <p>Loading ledger...</p>;
  if (!ledger) return <p>No data.</p>;

  const rows = ledger.rows.filter((row) => !memberFilter || row.member_id === Number(memberFilter));
  const isFinalized = ledger.meeting.status === 'finalized';

  return (
    <div className="card">
      <div className="summary-header-row">
        <h2>Member Ledger — {ledger.meeting.month}/{ledger.meeting.year}</h2>
        <div className="month-filter-row">
          <label>Member:</label>
          <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {isFinalized && <div className="alert" style={{ background: '#eef2ff', color: '#4338ca' }}>This meeting is finalized (read-only).</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Share Amount</th>
              <th>EMI Loan (Installment / Interest / Outstanding)</th>
              <th>Personal Loan (Given / Repaid)</th>
              <th>Penalty</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.member_id}>
                <td>{row.member_name}</td>
                <td>
                  {isFinalized ? (
                    row.share_amount != null ? `₹${row.share_amount.toFixed(2)}` : '-'
                  ) : (
                    <div className="inline-form">
                      <input
                        type="number"
                        style={{ width: 90 }}
                        placeholder={row.share_amount != null ? String(row.share_amount) : '1000'}
                        value={shareInputs[row.member_id] ?? ''}
                        onChange={(e) => setShareInputs({ ...shareInputs, [row.member_id]: e.target.value })}
                      />
                      <IconButton icon={Check} variant="save" title="Save" onClick={() => saveShare(row.member_id)} />
                    </div>
                  )}
                </td>
                <td>
                  {!row.emi_loan ? (
                    <span style={{ color: '#94a3b8' }}>No active loan</span>
                  ) : row.emi_loan.just_given ? (
                    emiPrincipalEditingFor === row.member_id ? (
                      <div className="inline-form">
                        <input
                          type="number"
                          style={{ width: 90 }}
                          value={emiPrincipalEditValue}
                          onChange={(e) => setEmiPrincipalEditValue(e.target.value)}
                        />
                        <div className="icon-btn-group">
                          <IconButton
                            icon={Check}
                            variant="save"
                            title="Save"
                            onClick={() => saveEmiPrincipalEdit(row.emi_loan.loan_id)}
                          />
                          <IconButton
                            icon={X}
                            variant="cancel"
                            title="Cancel"
                            onClick={() => setEmiPrincipalEditingFor(null)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="inline-form">
                        <span>Given ₹{row.emi_loan.principal_amount.toFixed(2)} (due from next month)</span>
                        {!isFinalized && (
                          <div className="icon-btn-group">
                            <IconButton
                              icon={Pencil}
                              variant="edit"
                              title="Edit"
                              onClick={() => startEmiPrincipalEdit(row)}
                            />
                            <IconButton
                              icon={Trash2}
                              variant="remove"
                              title="Remove"
                              onClick={() => removeEmiLoan(row.emi_loan.loan_id)}
                            />
                          </div>
                        )}
                      </div>
                    )
                  ) : row.emi_loan.installment_paid != null && emiEditingFor !== row.member_id ? (
                    <div className="inline-form">
                      <span>
                        ₹{row.emi_loan.installment_paid.toFixed(2)} / ₹{row.emi_loan.interest_paid.toFixed(2)} / bal ₹
                        {row.emi_loan.outstanding_balance.toFixed(2)}
                      </span>
                      {!isFinalized && (
                        <div className="icon-btn-group">
                          <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEmiEdit(row)} />
                          <IconButton
                            icon={Trash2}
                            variant="remove"
                            title="Remove"
                            onClick={() => removePayment(row.emi_loan.loan_id)}
                          />
                        </div>
                      )}
                    </div>
                  ) : isFinalized ? (
                    <span style={{ color: '#94a3b8' }}>Not paid</span>
                  ) : (
                    <div className="inline-form">
                      <input
                        type="number"
                        placeholder="Installment"
                        style={{ width: 90 }}
                        value={emiInputs[row.member_id]?.installment ?? ''}
                        onChange={(e) =>
                          setEmiInputs({
                            ...emiInputs,
                            [row.member_id]: { ...emiInputs[row.member_id], installment: e.target.value },
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Interest"
                        style={{ width: 80 }}
                        value={emiInputs[row.member_id]?.interest ?? ''}
                        onChange={(e) =>
                          setEmiInputs({
                            ...emiInputs,
                            [row.member_id]: { ...emiInputs[row.member_id], interest: e.target.value },
                          })
                        }
                      />
                      <div className="icon-btn-group">
                        <IconButton
                          icon={Check}
                          variant="save"
                          title="Save"
                          onClick={() => savePayment(row.emi_loan.loan_id, row.member_id, row.emi_loan.installment_paid != null)}
                        />
                        {emiEditingFor === row.member_id && (
                          <IconButton icon={X} variant="cancel" title="Cancel" onClick={() => setEmiEditingFor(null)} />
                        )}
                      </div>
                    </div>
                  )}
                </td>
                <td>
                  {row.personal_loan_repaid || row.personal_loan_new || row.personal_loan_pending ? (
                    personalLoanEditingFor === row.member_id ? (
                      <div className="inline-form">
                        <input
                          type="number"
                          style={{ width: 80 }}
                          value={personalLoanEditValue}
                          onChange={(e) => setPersonalLoanEditValue(e.target.value)}
                        />
                        <div className="icon-btn-group">
                          <IconButton icon={Check} variant="save" title="Save" onClick={() => savePersonalLoanEdit(row)} />
                          <IconButton
                            icon={X}
                            variant="cancel"
                            title="Cancel"
                            onClick={() => setPersonalLoanEditingFor(null)}
                          />
                        </div>
                      </div>
                    ) : row.personal_loan_repaid ? (
                      <div className="inline-form">
                        <span>
                          Repaid ₹{row.personal_loan_repaid.amount.toFixed(2)} / ₹
                          {(row.personal_loan_repaid.interest_amount || 0).toFixed(2)}
                        </span>
                        {!isFinalized && (
                          <div className="icon-btn-group">
                            <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startPersonalLoanEdit(row)} />
                            <IconButton
                              icon={Trash2}
                              variant="remove"
                              title="Remove"
                              onClick={() => removePersonalLoan(row.personal_loan_repaid.personal_loan_id)}
                            />
                          </div>
                        )}
                      </div>
                    ) : row.personal_loan_new ? (
                      <div className="inline-form">
                        <span>Given ₹{row.personal_loan_new.amount.toFixed(2)} (due next meeting)</span>
                        {!isFinalized && (
                          <div className="icon-btn-group">
                            <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startPersonalLoanEdit(row)} />
                            <IconButton
                              icon={Trash2}
                              variant="remove"
                              title="Remove"
                              onClick={() => removePersonalLoan(row.personal_loan_new.personal_loan_id)}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="inline-form">
                        <span style={{ color: '#b45309' }}>
                          Pending ₹{row.personal_loan_pending.amount.toFixed(2)} (from earlier month)
                        </span>
                        {!isFinalized && (
                          <>
                            <input
                              type="number"
                              placeholder="Interest"
                              style={{ width: 80 }}
                              value={repayInputs[row.member_id] || ''}
                              onChange={(e) => setRepayInputs({ ...repayInputs, [row.member_id]: e.target.value })}
                            />
                            <div className="icon-btn-group">
                              <IconButton icon={Check} variant="save" title="Mark Repaid" onClick={() => repayPending(row)} />
                              <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startPersonalLoanEdit(row)} />
                              <IconButton
                                icon={Trash2}
                                variant="remove"
                                title="Remove"
                                onClick={() => removePersonalLoan(row.personal_loan_pending.personal_loan_id)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  ) : !isFinalized ? (
                    newLoanOpenFor === row.member_id ? (
                      <div className="inline-form">
                        <input
                          type="number"
                          placeholder="Amount"
                          style={{ width: 90 }}
                          value={newLoanInputs[row.member_id] ?? ''}
                          onChange={(e) => setNewLoanInputs({ ...newLoanInputs, [row.member_id]: e.target.value })}
                        />
                        <div className="icon-btn-group">
                          <IconButton
                            icon={Check}
                            variant="save"
                            title="Give Loan"
                            onClick={() => disburseNewLoan(row.member_id)}
                          />
                          <IconButton icon={X} variant="cancel" title="Cancel" onClick={() => setNewLoanOpenFor(null)} />
                        </div>
                      </div>
                    ) : (
                      <IconButton
                        icon={Plus}
                        variant="add"
                        title="Give New Personal Loan"
                        onClick={() => setNewLoanOpenFor(row.member_id)}
                      />
                    )
                  ) : (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  )}
                </td>
                <td>
                  {row.penalties.map((p) =>
                    penaltyEditingId === p.id ? (
                      <div className="inline-form" key={p.id} style={{ marginBottom: 4 }}>
                        <input
                          type="number"
                          style={{ width: 70 }}
                          value={penaltyEditValues.amount}
                          onChange={(e) => setPenaltyEditValues({ ...penaltyEditValues, amount: e.target.value })}
                        />
                        <input
                          type="text"
                          style={{ width: 90 }}
                          value={penaltyEditValues.reason}
                          onChange={(e) => setPenaltyEditValues({ ...penaltyEditValues, reason: e.target.value })}
                        />
                        <div className="icon-btn-group">
                          <IconButton icon={Check} variant="save" title="Save" onClick={() => savePenaltyEdit(p.id)} />
                          <IconButton icon={X} variant="cancel" title="Cancel" onClick={() => setPenaltyEditingId(null)} />
                        </div>
                      </div>
                    ) : (
                      <div className="inline-form" key={p.id} style={{ marginBottom: 4 }} title={p.reason}>
                        <span>₹{p.amount.toFixed(2)}</span>
                        {!isFinalized && (
                          <div className="icon-btn-group">
                            <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startPenaltyEdit(p)} />
                            <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => removePenalty(p.id)} />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {!isFinalized &&
                    (penaltyOpenFor === row.member_id ? (
                      <div className="inline-form">
                        <input
                          type="number"
                          placeholder="Amount"
                          style={{ width: 80 }}
                          value={penaltyInputs[row.member_id]?.amount ?? ''}
                          onChange={(e) =>
                            setPenaltyInputs({
                              ...penaltyInputs,
                              [row.member_id]: { ...penaltyInputs[row.member_id], amount: e.target.value },
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Reason"
                          style={{ width: 100 }}
                          value={penaltyInputs[row.member_id]?.reason ?? ''}
                          onChange={(e) =>
                            setPenaltyInputs({
                              ...penaltyInputs,
                              [row.member_id]: { ...penaltyInputs[row.member_id], reason: e.target.value },
                            })
                          }
                        />
                        <IconButton icon={Check} variant="save" title="Save" onClick={() => savePenalty(row.member_id)} />
                      </div>
                    ) : (
                      <IconButton
                        icon={Plus}
                        variant="add"
                        title="Add Penalty"
                        onClick={() => setPenaltyOpenFor(row.member_id)}
                      />
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MandramLedger;
