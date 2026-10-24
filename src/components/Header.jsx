import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import AdminToast from './AdminToast';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [themeAnimating, setThemeAnimating] = useState(false);
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);

  useEffect(() => {
    // Visitor counter tracking on mount
    try {
      fetch('https://api.counterapi.dev/v1/nptel-cloud-mcq-ravikant/visits/up', { mode: 'no-cors' });
    } catch (e) {
      // silent
    }
  }, []);

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = (e) => {
    const now = Date.now();
    if (now - lastClickTime.current > 2000) {
      clickCount.current = 0;
    }
    clickCount.current += 1;
    lastClickTime.current = now;

    if (clickCount.current === 5) {
      setShowAdmin(true);
      clickCount.current = 0;
    }
  };

  const handleThemeToggle = () => {
    setThemeAnimating(true);
    toggleTheme();
    setTimeout(() => setThemeAnimating(false), 500);
  };

  return (
    <>
      <header className={`site-header header-entrance ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="header-left">
          <Link to="/" className="header-logo" onClick={handleLogoClick}>
            <img src="/logo.jpg" alt="NPTEL Ace" className="logo-img" />
            <span>
              NPTEL <span className="logo-ace">Ace</span>
            </span>
          </Link>
        </div>

        <div className="header-right">
          {user ? (
            <div className="header-user-badge">
              <span className="user-avatar-icon ms">person</span>
              <span className="user-name-text" title={user.email}>
                {user.name || user.email.split('@')[0]}
              </span>
              <button onClick={logout} className="header-logout-btn" title="Sign out">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="header-login-btn">
              <span className="ms">key</span>
              <span>Login</span>
            </Link>
          )}

          <button
            id="theme-toggle"
            className={`theme-btn ${themeAnimating ? 'theme-btn-spin' : ''}`}
            onClick={handleThemeToggle}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>
      </header>

      {showAdmin && <AdminToast onClose={() => setShowAdmin(false)} />}
    </>
  );
}
