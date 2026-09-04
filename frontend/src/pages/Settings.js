import React, { useEffect, useState } from 'react';
import { settingsService } from '../services/api';
import '../styles/Pages.css';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsService.get();
      console.log('Settings response:', response.data);
      setSettings(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><p>Loading settings...</p></div>;

  return (
    <div className="page-container">
      <h1>System Settings</h1>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {settings && (
        <div className="card">
          <h2>System Configuration (Admin Only)</h2>
          
          <div className="form-group">
            <label>Default Sandha Amount</label>
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              ₹{parseFloat(settings.default_sandha || 0).toFixed(2)}
            </div>
          </div>

          <div className="form-group">
            <label>Default Interest Rate (%)</label>
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {settings.default_interest_rate}%
            </div>
          </div>

          <div className="form-group">
            <label>Monthly Repayment Percentage (%)</label>
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {settings.monthly_repayment_percentage}%
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px', borderLeft: '4px solid #667eea' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              ℹ️ System settings are configured at the database level. Contact administrator to make changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
