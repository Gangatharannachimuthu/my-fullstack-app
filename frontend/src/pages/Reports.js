import React, { useEffect, useState } from 'react';
import { dashboardService, memberService } from '../services/api';
import '../styles/Pages.css';

function Reports() {
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const statsRes = await dashboardService.getStats();
      const membersRes = await memberService.getAll({ limit: 100 });
      
      setStats(statsRes.data);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading reports...</p></div>;

  return (
    <div className="page-container">
      <h1>Financial Reports</h1>
      
      {stats && (
        <>
          <div className="card">
            <h2>Financial Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Total Members</p>
                <h3 style={{ margin: '10px 0 0 0' }}>{stats.total_members}</h3>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Active Loans</p>
                <h3 style={{ margin: '10px 0 0 0' }}>{stats.active_loans}</h3>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Outstanding Loans</p>
                <h3 style={{ margin: '10px 0 0 0' }}>₹{parseFloat(stats.outstanding_loans || 0).toFixed(2)}</h3>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>Cash Balance</p>
                <h3 style={{ margin: '10px 0 0 0' }}>₹{parseFloat(stats.current_cash_balance || 0).toFixed(2)}</h3>
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Member Summary</h2>
            {members.length === 0 ? (
              <p>No members found.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Member Number</th>
                    <th>Name</th>
                    <th>Monthly Sandha</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id}>
                      <td>{member.member_number}</td>
                      <td>{member.name}</td>
                      <td>₹{parseFloat(member.monthly_sandha_amount || 0).toFixed(2)}</td>
                      <td>
                        <span className="badge badge-success">{member.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
