import React, { useEffect, useState } from 'react';
import { repaymentService } from '../services/api';
import '../styles/Pages.css';

function Repayments() {
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    try {
      setLoading(true);
      const response = await repaymentService.getAll();
      console.log('Repayments response:', response.data);
      setRepayments(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching repayments:', err);
      setError('Failed to load repayments');
      setRepayments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Loan Repayments</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="card">
        <h2>Repayment Records</h2>
        {loading ? (
          <p>Loading repayments...</p>
        ) : repayments.length === 0 ? (
          <p>No repayments found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Loan Number</th>
                <th>Payment Date</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Total Amount</th>
                <th>Date Recorded</th>
              </tr>
            </thead>
            <tbody>
              {repayments.map(rep => (
                <tr key={rep.id}>
                  <td>{rep.loan_number}</td>
                  <td>{rep.payment_date}</td>
                  <td>₹{parseFloat(rep.principal_amount || 0).toFixed(2)}</td>
                  <td>₹{parseFloat(rep.interest_amount || 0).toFixed(2)}</td>
                  <td className="font-weight-bold">₹{parseFloat(rep.total_amount || 0).toFixed(2)}</td>
                  <td>{new Date(rep.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Repayments;
