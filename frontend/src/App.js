import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Loans from './pages/Loans';
import Contributions from './pages/Contributions';
import Repayments from './pages/Repayments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user_name');
    if (token && user) {
      setIsLoggedIn(true);
      setUserName(user);
    }
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_name', user);
    setIsLoggedIn(true);
    setUserName(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_name');
    setIsLoggedIn(false);
    setUserName('');
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'members':
        return <Members />;
      case 'loans':
        return <Loans />;
      case 'contributions':
        return <Contributions />;
      case 'repayments':
        return <Repayments />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Navbar userName={userName} onLogout={handleLogout} />
      
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={setCurrentPage} />
        
        <main className="main-content">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
