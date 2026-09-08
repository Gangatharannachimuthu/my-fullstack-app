import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import MandramSection from './pages/mandram/MandramSection';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user_name');
    if (user) {
      setIsLoggedIn(true);
      setUserName(user);
    }
  }, []);

  const handleLogin = (user) => {
    localStorage.setItem('user_name', user);
    setIsLoggedIn(true);
    setUserName(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_name');
    setIsLoggedIn(false);
    setUserName('');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Navbar userName={userName} onLogout={handleLogout} />
      <main className="main-content">
        <MandramSection />
      </main>
    </div>
  );
}

export default App;
