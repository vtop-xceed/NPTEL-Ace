import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { registerWithEmail, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectedNotice, setRedirectedNotice] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
      setRedirectedNotice(true);
    }
  }, [searchParams]);

  const handleRegister = async (e) => {
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
      const res = await registerWithEmail(cleanEmail, name);
      if (res.success && res.user) {
        setSuccess(`Account registered successfully for ${res.user.email}! Starting...`);
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Could not connect to database. Please make sure MySQL is running.');
    }
  };

  return (
    <main className="main-content auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon ms">edit_note</div>
          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">
            Register with just your email. No password needed!
          </p>
        </div>

        {redirectedNotice && (
          <div className="auth-alert auth-alert-info">
            ℹ️ Email not found in our database. Complete this quick one-click registration to get started!
          </div>
        )}

        {error && <div className="auth-alert auth-alert-error"><span className="ms">warning</span> {error}</div>}
        {success && <div className="auth-alert auth-alert-success"><span className="ms">celebration</span> {success}</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label htmlFor="reg-email">Email Address <span className="required">*</span></label>
            <input
              id="reg-email"
              type="email"
              placeholder="e.g. yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              autoFocus={!email}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-name">Your Name (Optional)</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Rahul / Student"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              maxLength={60}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Saving to Database...' : 'Register & Start Practicing'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Go to Login
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
