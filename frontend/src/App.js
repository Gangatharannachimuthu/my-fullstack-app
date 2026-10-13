import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import MandramSection from './pages/mandram/MandramSection';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('viewer');
  const [memberId, setMemberId] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('user_name');
    const savedRole = localStorage.getItem('user_role');
    const savedMemberId = localStorage.getItem('user_member_id');
    if (user) {
      setIsLoggedIn(true);
      setUserName(user);
      setRole(savedRole || 'viewer');
      setMemberId(savedMemberId ? Number(savedMemberId) : null);
    }
  }, []);

  const handleLogin = (user, userRole, userMemberId) => {
    localStorage.setItem('user_name', user);
    localStorage.setItem('user_role', userRole);
    if (userMemberId) {
      localStorage.setItem('user_member_id', String(userMemberId));
    } else {
      localStorage.removeItem('user_member_id');
    }
    setIsLoggedIn(true);
    setUserName(user);
    setRole(userRole);
    setMemberId(userMemberId || null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_member_id');
    setIsLoggedIn(false);
    setUserName('');
    setRole('viewer');
    setMemberId(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Navbar userName={userName} role={role} onLogout={handleLogout} />
      <main className="main-content">
        <MandramSection
          canEdit={role === 'admin'}
          isAdmin={role === 'admin'}
          memberId={memberId}
        />
      </main>
    </div>
  );
}

export default App;
