import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import '../styles/Navbar.css';

function Navbar({ userName, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>Member Loan Management</h2>
      </div>
      <div className="navbar-right">
        <div className="user-info">
          <User size={18} />
          <span>{userName || 'User'}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
