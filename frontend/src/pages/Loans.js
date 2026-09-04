import React, { useEffect, useState } from 'react';
import { loanService } from '../services/api';
import '../styles/Pages.css';

function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await loanService.getAll();
      console.log('Loans response:', response.data);
      setLoans(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to load loans');
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Loans Management</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="card">
        <h2>Loans List</h2>
        {loading ? (
          <p>Loading loans...</p>
        ) : loans.length === 0 ? (
          <p>No loans found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Loan Number</th>
                <th>Type</th>
                <th>Principal</th>
                <th>Interest Rate</th>
                <th>Outstanding Principal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td>{loan.loan_number}</td>
                  <td>
                    <span className="badge">
                      {loan.loan_type}
                    </span>
                  </td>
                  <td>₹{parseFloat(loan.principal_amount || 0).toFixed(2)}</td>
                  <td>{loan.interest_rate}%</td>
                  <td>₹{parseFloat(loan.outstanding_principal || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${loan.loan_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {loan.loan_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Loans;
