import React, { useEffect, useState } from 'react';
import { contributionService } from '../services/api';
import '../styles/Pages.css';

function Contributions() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      const response = await contributionService.getAll();
      console.log('Contributions response:', response.data);
      setContributions(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching contributions:', err);
      setError('Failed to load contributions');
      setContributions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Monthly Sandha Contributions</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <div className="card">
        <h2>Contributions List</h2>
        {loading ? (
          <p>Loading contributions...</p>
        ) : contributions.length === 0 ? (
          <p>No contributions found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Member Number</th>
                <th>Member Name</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map(contrib => (
                <tr key={contrib.id}>
                  <td>{contrib.member_number}</td>
                  <td>{contrib.member_name}</td>
                  <td>{contrib.contribution_month}</td>
                  <td>₹{parseFloat(contrib.amount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${contrib.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {contrib.payment_status}
                    </span>
                  </td>
                  <td>{new Date(contrib.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Contributions;
