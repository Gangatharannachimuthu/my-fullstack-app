import React, { useEffect, useState } from 'react';
import { loanService } from '../services/api';
import '../styles/Pages.css';

function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await loanService.getAll();
      setLoans(response.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Loans Management</h1>
      
      <div className="card">
        <h2>Loans List</h2>
        {loading ? <p>Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Loan Number</th>
                <th>Member</th>
                <th>Type</th>
                <th>Principal</th>
                <th>Interest Rate</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td>{loan.loan_number}</td>
                  <td>{loan.member_id}</td>
                  <td>{loan.loan_type}</td>
                  <td>₹{parseFloat(loan.principal_amount).toFixed(2)}</td>
                  <td>{loan.interest_rate}%</td>
                  <td>₹{parseFloat(loan.outstanding_principal).toFixed(2)}</td>
                  <td><span className="badge">{loan.loan_status}</span></td>
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
