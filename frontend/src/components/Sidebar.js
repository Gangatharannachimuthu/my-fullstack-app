import React from 'react';
import { Menu, Home, Users, DollarSign, Repeat2, FileText, Settings, X } from 'lucide-react';
import '../styles/Sidebar.css';

function Sidebar({ isOpen, onClose, onNavigate }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => { onNavigate('dashboard'); onClose(); }}>
            <Home size={18} />
            <span>Dashboard</span>
          </button>
          
          <button className="nav-item" onClick={() => { onNavigate('members'); onClose(); }}>
            <Users size={18} />
            <span>Members</span>
          </button>
          
          <button className="nav-item" onClick={() => { onNavigate('loans'); onClose(); }}>
            <DollarSign size={18} />
            <span>Loans</span>
          </button>
          
          <button className="nav-item" onClick={() => { onNavigate('contributions'); onClose(); }}>
            <Repeat2 size={18} />
            <span>Contributions</span>
          </button>
          
          <button className="nav-item" onClick={() => { onNavigate('repayments'); onClose(); }}>
            <Repeat2 size={18} />
            <span>Repayments</span>
          </button>
          
          <button className="nav-item" onClick={() => { onNavigate('reports'); onClose(); }}>
            <FileText size={18} />
            <span>Reports</span>
          </button>
          
          <button className="nav-item" onClick={() => { onNavigate('settings'); onClose(); }}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
