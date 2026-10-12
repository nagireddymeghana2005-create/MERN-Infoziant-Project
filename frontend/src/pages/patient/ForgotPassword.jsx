import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import { apiUrl } from '../../api';
import './PatientLogin.css';
import './PasswordReset.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(apiUrl('/api/patient/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to process this request.');
      setMessage(data.message);
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
          <h1>Forgot your password?</h1>
          <p>Patient Portal</p>
        </div>
        <p className="password-reset-intro">
          Enter the email address associated with your patient account. If an eligible account exists,
          reset instructions may be sent to that address.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {error && <p className="password-reset-feedback error" role="alert">{error}</p>}
          {message && <p className="password-reset-feedback success" role="status">{message}</p>}
          <button className="login-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoadingIndicator label="Submitting request..." /> : 'Send reset instructions'}
          </button>
        </form>
        <div className="password-reset-footer">
          <Link to="/patient/login">Back to patient sign in</Link>
          <Link to="/">Back to home</Link>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
