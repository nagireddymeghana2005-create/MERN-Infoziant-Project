import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import { apiUrl } from '../../api';
import './PatientLogin.css';
import './PasswordReset.css';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setError('This reset link is invalid or has expired. Request a new one.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/patient/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to reset your password.');
      setMessage(data.message);
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-container password-reset-page">
      <section className="login-card password-reset-card">
        <div className="login-header">
          <div className="password-reset-mark" aria-hidden="true">✚</div>
          <h1>Set a new password</h1>
          <p>Patient Portal</p>
        </div>
        <p className="password-reset-intro">
          Choose a new password with at least 8 characters. The reset link is single-use and expires after 15 minutes.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {error && <p className="password-reset-feedback error" role="alert">{error}</p>}
          {message && <p className="password-reset-feedback success" role="status">{message}</p>}
          {!message && (
            <button className="login-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoadingIndicator label="Resetting password..." /> : 'Reset password'}
            </button>
          )}
        </form>
        <div className="password-reset-footer">
          <Link to="/patient/forgot-password">Request another reset link</Link>
          {message && <Link to="/patient/login">Go to patient sign in</Link>}
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
