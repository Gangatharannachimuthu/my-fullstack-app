import React, { useCallback, useEffect, useState } from 'react';
import { meetingService } from '../../services/mandramApi';

function Tile({ label, value, highlight }) {
  return (
    <div className={`summary-tile ${highlight ? 'highlight' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">₹{Number(value || 0).toFixed(2)}</div>
    </div>
  );
}

function MandramSummary({ meetingId, onFinalized }) {
  const [summary, setSummary] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  const [finalizing, setFinalizing] = useState(false);

  const refresh = useCallback(async () => {
    if (!meetingId) return;
    try {
      const [summaryRes, meetingRes] = await Promise.all([
        meetingService.getSummary(meetingId),
        meetingService.getAll(),
      ]);
      setSummary(summaryRes.data);
      const m = (meetingRes.data || []).find((x) => x.id === meetingId);
      setMeeting(m);
      setError('');
    } catch (err) {
      setError('Failed to load summary');
    }
  }, [meetingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this month? This locks all entries and carries the closing balance forward.')) {
      return;
    }
    try {
      setFinalizing(true);
      setError('');
      await meetingService.finalize(meetingId);
      await refresh();
      if (onFinalized) await onFinalized();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to finalize meeting');
    } finally {
      setFinalizing(false);
    }
  };

  if (!meetingId) return <div className="card"><p>Select a meeting first.</p></div>;
  if (!summary) return <p>Loading summary...</p>;

  const isFinalized = meeting?.status === 'finalized';

  return (
    <div className="card">
      <div className="summary-header-row">
        <h2>Monthly Summary {meeting ? `— ${meeting.month}/${meeting.year}` : ''}</h2>
        <button className="btn btn-primary" onClick={handleFinalize} disabled={isFinalized || finalizing}>
          {isFinalized ? 'Already Finalized' : finalizing ? 'Finalizing...' : 'Finalize Month'}
        </button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="summary-section">
        <h3>Income (வரவு)</h3>
        <div className="summary-grid">
          <Tile label="Share Contributions" value={summary.income.share_income} />
          <Tile label="EMI Loan Interest" value={summary.income.emi_loan_interest} />
          <Tile label="Personal Loan Interest" value={summary.income.personal_loan_interest} />
          <Tile label="Other Income" value={summary.income.other_income} />
          <Tile label="Total Income" value={summary.income.total_income} highlight />
        </div>
      </div>

      <div className="summary-section">
        <h3>Expenditure (செலவு)</h3>
        <div className="summary-grid">
          <Tile label="Total Expenditure" value={summary.expenditure.total_expenditure} />
          <Tile label="Net Income" value={summary.net_income} highlight />
        </div>
      </div>

      <div className="summary-section">
        <h3>Collections & Disbursements</h3>
        <div className="summary-grid">
          <Tile label="EMI Principal Collected" value={summary.collections.emi_principal_collected} />
          <Tile label="Personal Loan Collected" value={summary.collections.personal_loan_collected} />
          <Tile label="New Personal Loans Disbursed" value={summary.new_personal_loans_disbursed} />
          <Tile label="New EMI Loans Disbursed" value={summary.new_emi_loans_disbursed} />
          <Tile label="Investment / Savings Outflow" value={summary.total_investment_outflow} />
        </div>
      </div>

      <div className="summary-section">
        <h3>Balance Roll-Forward</h3>
        <div className="summary-grid">
          <Tile label="Opening Balance" value={summary.opening_balance} />
          <Tile label="Closing Balance" value={summary.closing_balance} highlight />
          <Tile label="Outstanding EMI Loans" value={summary.outstanding_emi_loans} />
          <Tile label="Outstanding Personal Loans" value={summary.outstanding_personal_loans} />
          <Tile label="Mandram Total Value" value={summary.trust_total_value} highlight />
        </div>
      </div>
    </div>
  );
}

export default MandramSummary;
