import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }

    try {
      const res = await loginWithEmail(cleanEmail);
      if (res.exists) {
        setSuccess(`Welcome back, ${res.user.name || res.user.email}! Logging you in...`);
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        // Email not present in database -> go to register page as requested
        navigate(`/register?email=${encodeURIComponent(cleanEmail)}`);
      }
    } catch {
      setError('Could not connect to database. Please make sure MySQL is running.');
    }
  };

  return (
    <main className="main-content auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon ms">key</div>
          <h2 className="auth-title">Welcome to NPTEL Ace</h2>
          <p className="auth-subtitle">
            Enter your email to sign in. No password required.
          </p>
        </div>

        {error && <div className="auth-alert auth-alert-error"><span className="ms">warning</span> {error}</div>}
        {success && <div className="auth-alert auth-alert-success"><span className="ms">check_circle</span> {success}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="e.g. student@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Checking Database...' : 'Continue with Email'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            New to NPTEL Ace?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
          <Link to="/" className="auth-back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
