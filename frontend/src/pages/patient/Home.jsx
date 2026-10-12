import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiUrl } from '../../api';
import '../Dashboard.css';

const Home = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [showDropdown, setShowDropdown] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [activeView, setActiveView] = useState('home');
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!showDropdown) return undefined;

    const handlePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowDropdown(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  const fetchAppointments = useCallback(async () => {
    if (!userInfo?.token || userInfo.role !== 'patient') {
      setAppointmentsError('Please sign in as a patient to view your appointments.');
      return;
    }

    setAppointmentsLoading(true);
    setAppointmentsError('');
    try {
      const response = await fetch(apiUrl('/api/booking/patient'), {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load your appointments.');
      setAppointments(data);
    } catch (error) {
      setAppointmentsError(error.message);
    } finally {
      setAppointmentsLoading(false);
    }
  }, [userInfo?.role, userInfo?.token]);

  useEffect(() => {
    if (activeView === 'appointments') fetchAppointments();
  }, [activeView, fetchAppointments]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userPhone');
    navigate('/patient/login', { replace: true });
  };

  const handleBookAppointment = () => navigate('/patient/bookings');

  const renderAppointments = () => (
    <section className="appointments-section patient-appointments-section">
      <div className="appointments-header">
        <div>
          <p className="patient-section-eyebrow">YOUR CARE</p>
          <h1>My Appointments</h1>
        </div>
        <button onClick={fetchAppointments} className="refresh-button" disabled={appointmentsLoading}>
          {appointmentsLoading ? <LoadingIndicator label="Loading..." /> : '↻ Refresh'}
        </button>
      </div>

      {appointmentsError && (
        <div className="patient-appointments-error" role="alert">
          <span>{appointmentsError}</span>
          <button onClick={fetchAppointments}>Try again</button>
        </div>
      )}

      {appointmentsLoading ? (
        <LoadingSkeleton variant="appointment" count={3} label="Loading your appointments" />
      ) : appointments.length === 0 && !appointmentsError ? (
        <div className="patient-appointments-empty">
          <span aria-hidden="true">▦</span>
          <h2>No appointments booked yet</h2>
          <p>Your appointments will appear here after you book one.</p>
          <button onClick={handleBookAppointment} className="patient-primary-button">Book appointment</button>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <article key={appointment._id} className="appointment-item">
              <div className="appointment-header">
                <h2>{appointment.doctorName}</h2>
                <span className={`appointment-status ${appointment.status}`}>
                  {appointment.status}
                </span>
              </div>
              <div className="appointment-details">
                <p><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}</p>
                <p><strong>Time:</strong> {appointment.timeSlot}</p>
                <p><strong>Symptoms:</strong> {appointment.symptoms || 'Not provided'}</p>
                {appointment.cancellationReason && (
                  <p><strong>Cancellation reason:</strong> {appointment.cancellationReason}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="dashboard-container patient-portal patient-home-dashboard">
      <div className="top-navbar-full">
        <div className="navbar-left">
          <button className="navbar-brand patient-brand-button" onClick={() => setActiveView('home')}>
            DOC-CONNECT
          </button>
        </div>
        <div className="navbar-right">
          <div className="user-menu-container" ref={userMenuRef}>
            <button
              type="button"
              className="user-menu-trigger"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-expanded={showDropdown}
              aria-haspopup="menu"
              aria-label={`Account menu for ${userInfo?.name || 'Patient'}`}
            >
              <span className="user-avatar">{userInfo?.name?.charAt(0) || 'P'}</span>
              <span className="user-name">{userInfo?.name || 'Patient'}</span>
              <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
            </button>
            {showDropdown && (
              <div className="user-dropdown" role="menu">
                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/patient/profile');
                  }}
                >
                  📋 Profile
                </button>
                <button
                  type="button"
                  className="dropdown-item logout"
                  role="menuitem"
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <aside className="dashboard-sidebar-clean">
          <nav className="sidebar-nav-clean" aria-label="Patient dashboard navigation">
            <button onClick={handleBookAppointment} className="sidebar-nav-button-clean">
              <span aria-hidden="true">＋</span> Book Appointment
            </button>
            <button
              onClick={() => setActiveView('appointments')}
              className={`sidebar-nav-button-clean ${activeView === 'appointments' ? 'active' : ''}`}
              aria-current={activeView === 'appointments' ? 'page' : undefined}
            >
              <span aria-hidden="true">▦</span> My Appointments
            </button>
            <button onClick={() => navigate('/patient/status')} className="sidebar-nav-button-clean">
              <span aria-hidden="true">◷</span> Appointment Status
            </button>
          </nav>
        </aside>

        <main className="dashboard-content">
          {activeView === 'home' ? (
            <>
              <section className="welcome-card patient-welcome-card">
                <p className="patient-section-eyebrow">PATIENT DASHBOARD</p>
                <h1>Welcome, {userInfo?.name || 'Patient'}!</h1>
                <p>Book your appointment with our expert doctors and manage your care.</p>
                <button onClick={handleBookAppointment} className="patient-primary-button">
                  Book an appointment
                </button>
              </section>
              <section className="patient-home-tip">
                <span aria-hidden="true">♡</span>
                <div>
                  <h2>Your health, made easier</h2>
                  <p>Use the sidebar to review your appointments or check the status of your latest booking.</p>
                </div>
              </section>
            </>
          ) : (
            renderAppointments()
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
