import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardService.getStats();
      console.log('Stats response:', response.data);
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard stats');
      // Set default stats
      setStats({
        total_members: 0,
        active_members: 0,
        total_loans: 0,
        active_loans: 0,
        total_sandha_collected: 0,
        outstanding_loans: 0,
        interest_collected: 0,
        current_cash_balance: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {stats && (
        <div className="stats-grid grid-4">
          <div className="stat-card">
            <h3>Total Members</h3>
            <div className="value">{stats.total_members || 0}</div>
          </div>
          
          <div className="stat-card">
            <h3>Active Members</h3>
            <div className="value">{stats.active_members || 0}</div>
          </div>
          
          <div className="stat-card">
            <h3>Total Loans</h3>
            <div className="value">{stats.total_loans || 0}</div>
          </div>
          
          <div className="stat-card">
            <h3>Active Loans</h3>
            <div className="value">{stats.active_loans || 0}</div>
          </div>
          
          <div className="stat-card">
            <h3>Total Sandha Collected</h3>
            <div className="value currency">₹{parseFloat(stats.total_sandha_collected || 0).toFixed(2)}</div>
          </div>
          
          <div className="stat-card">
            <h3>Outstanding Loans</h3>
            <div className="value currency">₹{parseFloat(stats.outstanding_loans || 0).toFixed(2)}</div>
          </div>
          
          <div className="stat-card">
            <h3>Interest Collected</h3>
            <div className="value currency">₹{parseFloat(stats.interest_collected || 0).toFixed(2)}</div>
          </div>
          
          <div className="stat-card">
            <h3>Cash Balance</h3>
            <div className="value currency">₹{parseFloat(stats.current_cash_balance || 0).toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="dashboard-info">
        <h2>Welcome to Member Loan Management System</h2>
        <p>Navigate using the sidebar to manage members, loans, contributions, and view reports.</p>
      </div>
    </div>
  );
}

export default Dashboard;
