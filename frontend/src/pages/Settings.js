import React from 'react';
import '../styles/Pages.css';

function Settings() {
  return (
    <div className="page-container">
      <h1>Settings</h1>
      <div className="card">
        <h2>System Settings (Admin Only)</h2>
        <div className="form-group">
          <label>Default Sandha Amount: ₹1000</label>
        </div>
        <div className="form-group">
          <label>Default Interest Rate: 1%</label>
        </div>
        <div className="form-group">
          <label>Monthly Repayment: 10%</label>
        </div>
      </div>
    </div>
  );
}

export default Settings;
