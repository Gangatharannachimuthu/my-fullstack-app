import React, { useCallback, useEffect, useState } from 'react';
import { Check, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  meetingService,
  loanService,
  personalLoanService,
  penaltyService,
  messageService,
  joiningService,
} from '../../services/mandramApi';
import IconButton from './IconButton';
import LoanReminderDialog from './LoanReminderDialog';

function MandramLedger({ meetingId, members, canEdit = true, isAdmin = false }) {
  const [reminders, setReminders] = useState(null);
  const [remindersLoading, setRemindersLoading] = useState(false);
  // Joining dues only apply to members who joined after the group was established,
  // so this is empty for most mandrams and the column simply shows a dash.
  const [dues, setDues] = useState([]);
  const [joiningPaid, setJoiningPaid] = useState({});
  const [joiningInputs, setJoiningInputs] = useState({});
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
      const [res, duesRes, paidRes] = await Promise.all([
        meetingService.getLedger(meetingId),
        joiningService.getDues(),
        joiningService.getForMeeting(meetingId),
      ]);
      setLedger(res.data);
      setDues(duesRes.data || []);
      setJoiningPaid(
        Object.fromEntries((paidRes.data || []).map((p) => [p.member_id, p.amount]))
      );
      setJoiningInputs({});
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

  const dueFor = (memberId) => dues.find((d) => d.member_id === memberId) || null;

  const saveJoining = async (memberId) => {
    const amount = joiningInputs[memberId];
    if (amount === undefined || amount === '') return;
    try {
      setError('');
      await joiningService.pay(meetingId, { member_id: memberId, amount: Number(amount) });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save joining payment');
    }
  };

  // EMI state is keyed by loan_id, not member_id: a member can have more than one
  // loan in the same month, and editing one must not disturb the other.
  const startEmiEdit = (loan) => {
    setEmiEditingFor(loan.loan_id);
    setEmiInputs({
      ...emiInputs,
      [loan.loan_id]: {
        installment: loan.installment_paid,
        interest: loan.interest_paid,
      },
    });
  };

  const savePayment = async (loanId, isEdit) => {
    const values = emiInputs[loanId] || {};
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

  const startEmiPrincipalEdit = (loan) => {
    setEmiPrincipalEditingFor(loan.loan_id);
    setEmiPrincipalEditValue(loan.principal_amount);
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

  /**
   * The personal-loan states that apply to this member this month, oldest event
   * first. A member can both clear a loan and take a new one in the same meeting,
   * so this is a list, not a single state - exactly as EMI loans already are.
   */
  const personalLoanBlocks = (row) => {
    const blocks = [];
    if (row.personal_loan_repaid) blocks.push({ kind: 'repaid', loan: row.personal_loan_repaid });
    if (row.personal_loan_new) blocks.push({ kind: 'new', loan: row.personal_loan_new });
    if (row.personal_loan_pending) blocks.push({ kind: 'pending', loan: row.personal_loan_pending });
    return blocks;
  };

  // Keyed by personal_loan_id, not member_id: with two loans in one row, editing
  // one must not open or overwrite the other.
  const startPersonalLoanEdit = (kind, loan) => {
    setPersonalLoanEditingFor(loan.personal_loan_id);
    setPersonalLoanEditValue(
      kind === 'repaid' ? loan.interest_amount || 0 : loan.amount || 0
    );
  };

  const savePersonalLoanEdit = async (kind, loan) => {
    try {
      setError('');
      // On a repaid loan the editable figure is its interest; on one still running
      // it is the principal.
      const payload =
        kind === 'repaid'
          ? { interest_amount: Number(personalLoanEditValue) }
          : { amount: Number(personalLoanEditValue) };
      await personalLoanService.update(loan.personal_loan_id, payload);
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

  const openReminders = async () => {
    setRemindersLoading(true);
    setError('');
    try {
      const res = await messageService.getLoanReminders(meetingId);
      setReminders(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to build loan reminders');
    } finally {
      setRemindersLoading(false);
    }
  };

  if (loading) return <p>Loading ledger...</p>;
  if (!ledger) return <p>No data.</p>;

  const rows = ledger.rows.filter((row) => !memberFilter || row.member_id === Number(memberFilter));
  const isFinalized = ledger.meeting.status === 'finalized';
  const editable = canEdit && !isFinalized;

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
          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary btn-with-icon"
              onClick={openReminders}
              disabled={remindersLoading}
              title="Send each member their loan position for this month"
            >
              <MessageCircle size={16} />
              {remindersLoading ? 'Preparing...' : 'Send Loan Reminders'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {isFinalized && <div className="alert" style={{ background: '#eef2ff', color: '#4338ca' }}>This meeting is finalized (read-only).</div>}

      {reminders && (
        <LoanReminderDialog
          meetingLabel={`${ledger.meeting.month}/${ledger.meeting.year}`}
          reminders={reminders}
          onClose={() => setReminders(null)}
        />
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Share Amount</th>
              <th>Joining Contribution</th>
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
                  {!editable ? (
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
                  {(() => {
                    const due = dueFor(row.member_id);
                    if (!due) return <span style={{ color: '#94a3b8' }}>—</span>;
                    const paidThisMonth = joiningPaid[row.member_id];
                    return (
                      <div className="joining-cell">
                        {editable ? (
                          <div className="inline-form">
                            <input
                              type="number"
                              style={{ width: 90 }}
                              placeholder={paidThisMonth != null ? String(paidThisMonth) : '0'}
                              value={joiningInputs[row.member_id] ?? ''}
                              onChange={(e) =>
                                setJoiningInputs({ ...joiningInputs, [row.member_id]: e.target.value })
                              }
                            />
                            <IconButton
                              icon={Check}
                              variant="save"
                              title="Save joining payment"
                              onClick={() => saveJoining(row.member_id)}
                            />
                          </div>
                        ) : (
                          <span>{paidThisMonth != null ? `₹${Number(paidThisMonth).toFixed(2)}` : '-'}</span>
                        )}
                        <span className={`badge ${due.is_cleared ? 'badge-success' : 'badge-warning'}`}>
                          {due.is_cleared
                            ? 'fully paid'
                            : `₹${Number(due.remaining).toFixed(0)} left of ₹${Number(due.total_amount).toFixed(0)}`}
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td>
                  {row.emi_loans.length === 0 ? (
                    <span style={{ color: '#94a3b8' }}>No active loan</span>
                  ) : (
                    <div className="emi-loan-stack">
                      {row.emi_loans.map((loan) =>
                        loan.just_given ? (
                          emiPrincipalEditingFor === loan.loan_id ? (
                            <div className="inline-form" key={loan.loan_id}>
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
                                  onClick={() => saveEmiPrincipalEdit(loan.loan_id)}
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
                            <div className="inline-form" key={loan.loan_id}>
                              <span>Given ₹{loan.principal_amount.toFixed(2)} (due from next month)</span>
                              {editable && (
                                <div className="icon-btn-group">
                                  <IconButton
                                    icon={Pencil}
                                    variant="edit"
                                    title="Edit"
                                    onClick={() => startEmiPrincipalEdit(loan)}
                                  />
                                  <IconButton
                                    icon={Trash2}
                                    variant="remove"
                                    title="Remove"
                                    onClick={() => removeEmiLoan(loan.loan_id)}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        ) : loan.installment_paid != null && emiEditingFor !== loan.loan_id ? (
                          <div className="inline-form" key={loan.loan_id}>
                            <span>
                              ₹{loan.installment_paid.toFixed(2)} / ₹{loan.interest_paid.toFixed(2)} / bal ₹
                              {loan.outstanding_balance.toFixed(2)}
                            </span>
                            {loan.closed_this_month && (
                              <span className="badge badge-success">Loan closed this month</span>
                            )}
                            {editable && (
                              <div className="icon-btn-group">
                                <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startEmiEdit(loan)} />
                                <IconButton
                                  icon={Trash2}
                                  variant="remove"
                                  title="Remove"
                                  onClick={() => removePayment(loan.loan_id)}
                                />
                              </div>
                            )}
                          </div>
                        ) : !editable ? (
                          <span style={{ color: '#94a3b8' }} key={loan.loan_id}>
                            Not paid
                          </span>
                        ) : (
                          <div className="inline-form" key={loan.loan_id}>
                            <input
                              type="number"
                              placeholder="Installment"
                              style={{ width: 90 }}
                              value={emiInputs[loan.loan_id]?.installment ?? ''}
                              onChange={(e) =>
                                setEmiInputs({
                                  ...emiInputs,
                                  [loan.loan_id]: { ...emiInputs[loan.loan_id], installment: e.target.value },
                                })
                              }
                            />
                            <input
                              type="number"
                              placeholder="Interest"
                              style={{ width: 80 }}
                              value={emiInputs[loan.loan_id]?.interest ?? ''}
                              onChange={(e) =>
                                setEmiInputs({
                                  ...emiInputs,
                                  [loan.loan_id]: { ...emiInputs[loan.loan_id], interest: e.target.value },
                                })
                              }
                            />
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>
                              bal ₹{loan.outstanding_balance.toFixed(2)}
                            </span>
                            <div className="icon-btn-group">
                              <IconButton
                                icon={Check}
                                variant="save"
                                title="Save"
                                onClick={() => savePayment(loan.loan_id, loan.installment_paid != null)}
                              />
                              {emiEditingFor === loan.loan_id && (
                                <IconButton
                                  icon={X}
                                  variant="cancel"
                                  title="Cancel"
                                  onClick={() => setEmiEditingFor(null)}
                                />
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </td>
                <td>
                  {personalLoanBlocks(row).length === 0 ? (
                    // Giving a personal loan belongs on the Personal Loans tab, the same
                    // way opening an EMI loan does. The ledger only records what happens
                    // to a loan month by month.
                    <span style={{ color: '#94a3b8' }}>No personal loan</span>
                  ) : (
                    <div className="emi-loan-stack">
                      {personalLoanBlocks(row).map(({ kind, loan }) =>
                        personalLoanEditingFor === loan.personal_loan_id ? (
                          <div className="inline-form" key={loan.personal_loan_id}>
                            <input
                              type="number"
                              style={{ width: 80 }}
                              value={personalLoanEditValue}
                              onChange={(e) => setPersonalLoanEditValue(e.target.value)}
                            />
                            <div className="icon-btn-group">
                              <IconButton
                                icon={Check}
                                variant="save"
                                title="Save"
                                onClick={() => savePersonalLoanEdit(kind, loan)}
                              />
                              <IconButton
                                icon={X}
                                variant="cancel"
                                title="Cancel"
                                onClick={() => setPersonalLoanEditingFor(null)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="inline-form" key={loan.personal_loan_id}>
                            {kind === 'repaid' && (
                              <>
                                <span>
                                  Repaid ₹{loan.amount.toFixed(2)} / ₹
                                  {(loan.interest_amount || 0).toFixed(2)}
                                </span>
                                <span className="badge badge-success">Loan closed this month</span>
                              </>
                            )}
                            {kind === 'new' && (
                              <span>Given ₹{loan.amount.toFixed(2)} (due next meeting)</span>
                            )}
                            {kind === 'pending' && (
                              <span style={{ color: '#b45309' }}>
                                Pending ₹{loan.amount.toFixed(2)} (from earlier month)
                              </span>
                            )}
                            {editable && (
                              <>
                                {kind === 'pending' && (
                                  <input
                                    type="number"
                                    placeholder="Interest"
                                    style={{ width: 80 }}
                                    value={repayInputs[row.member_id] || ''}
                                    onChange={(e) =>
                                      setRepayInputs({ ...repayInputs, [row.member_id]: e.target.value })
                                    }
                                  />
                                )}
                                <div className="icon-btn-group">
                                  {kind === 'pending' && (
                                    <IconButton
                                      icon={Check}
                                      variant="save"
                                      title="Mark Repaid"
                                      onClick={() => repayPending(row)}
                                    />
                                  )}
                                  <IconButton
                                    icon={Pencil}
                                    variant="edit"
                                    title={kind === 'repaid' ? 'Edit interest' : 'Edit amount'}
                                    onClick={() => startPersonalLoanEdit(kind, loan)}
                                  />
                                  <IconButton
                                    icon={Trash2}
                                    variant="remove"
                                    title="Remove"
                                    onClick={() => removePersonalLoan(loan.personal_loan_id)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )
                      )}
                    </div>
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
                        {editable && (
                          <div className="icon-btn-group">
                            <IconButton icon={Pencil} variant="edit" title="Edit" onClick={() => startPenaltyEdit(p)} />
                            <IconButton icon={Trash2} variant="remove" title="Remove" onClick={() => removePenalty(p.id)} />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  {editable &&
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
