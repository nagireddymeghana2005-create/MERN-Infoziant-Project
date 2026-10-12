import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import useLoginBackNavigation from '../../hooks/useLoginBackNavigation';
import { apiUrl } from '../../api';
import './AdminLogin.css';

const AdminLogin = () => {
  useLoginBackNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed. Check your email and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to the login service. Please try again when the server is available.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V23" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 19H16" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1>DocConnect</h1>
          <p>Admin Portal</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? <LoadingIndicator label="Signing in..." /> : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <button type="button" className="login-home-button" onClick={() => navigate('/', { replace: true })}>
            ← Back to landing page
          </button>
          <div className="role-buttons">
            <button className={`role-btn ${location.pathname === '/patient/login' || location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/patient/login')}>
              Patient
            </button>
            <button className={`role-btn ${location.pathname === '/doctor/login' ? 'active' : ''}`} onClick={() => navigate('/doctor/login')}>
              Doctor
            </button>
            <button className={`role-btn ${location.pathname === '/admin/login' ? 'active' : ''}`} onClick={() => navigate('/admin/login')}>
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
