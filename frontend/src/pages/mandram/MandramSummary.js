import React, { useCallback, useEffect, useState } from 'react';
import { meetingService } from '../../services/mandramApi';

function fmt(value) {
  const num = Number(value || 0);
  return num < 0 ? `− ₹${Math.abs(num).toFixed(2)}` : `₹${num.toFixed(2)}`;
}

function SummaryTable({ title, rows, fullWidth }) {
  return (
    <div className={`summary-section ${fullWidth ? 'summary-section-full' : ''}`}>
      <h3>{title}</h3>
      <table className="table">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td style={row.highlight ? { fontWeight: 700 } : undefined}>{fmt(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

      <div className="summary-quadrants">
        <SummaryTable
          title="Income (வரவு)"
          rows={[
            { label: 'Share Contributions', value: summary.income.share_income },
            { label: 'EMI Loan Interest', value: summary.income.emi_loan_interest },
            { label: 'Personal Loan Interest', value: summary.income.personal_loan_interest },
            { label: 'Other Income', value: summary.income.other_income },
            { label: 'Total Income', value: summary.income.total_income, highlight: true },
          ]}
        />

        <SummaryTable
          title="Expenditure (செலவு)"
          rows={[
            { label: 'Total Expenditure', value: summary.expenditure.total_expenditure },
            { label: 'Net Income', value: summary.net_income, highlight: true },
          ]}
        />

        <SummaryTable
          title="Balance Roll-Forward (this month's total balance)"
          fullWidth
          rows={[
            { label: 'Last Month Balance (Opening)', value: summary.opening_balance },
            { label: '+ This Month Total Income', value: summary.income.total_income },
            { label: '+ EMI Loan Amount Collected', value: summary.collections.emi_principal_collected },
            { label: '+ Personal Loan Amount Collected', value: summary.collections.personal_loan_collected },
            { label: '− New EMI Loans Given Out', value: -summary.new_emi_loans_disbursed },
            { label: '− New Personal Loans Given Out', value: -summary.new_personal_loans_disbursed },
            { label: '− Total Expenditure', value: -summary.expenditure.total_expenditure },
            { label: '− Investment / Savings (Gold, Chit, etc.)', value: -summary.total_investment_outflow },
            { label: '= Current Month Total Balance', value: summary.closing_balance, highlight: true },
            { label: 'Outstanding EMI Loans (not yet collected)', value: summary.outstanding_emi_loans },
            { label: 'Outstanding Personal Loans (not yet collected)', value: summary.outstanding_personal_loans },
            { label: 'Mandram Total Value', value: summary.trust_total_value, highlight: true },
          ]}
        />
      </div>
    </div>
  );
}

export default MandramSummary;
