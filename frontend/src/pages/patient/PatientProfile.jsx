import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../api';
import '../Dashboard.css';
import './PatientProfile.css';

const PatientProfile = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [profile, setProfile] = useState(userInfo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userInfo?.token) {
        setError('Please sign in to view your profile.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/patient/profile'), {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load your profile.');
        }

        setProfile(data);
        localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, ...data }));
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userPhone');
    navigate('/patient/login');
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : 'Not available';

  return (
    <div className="dashboard-container patient-portal patient-profile-page">
      <div className="top-navbar-full">
        <div className="navbar-left">
          <span className="navbar-brand">DOC-CONNECT</span>
        </div>
        <div className="navbar-right">
          <div className="user-dropdown-container">
            <button
              className="user-dropdown-button"
              onClick={() => setShowDropdown((isOpen) => !isOpen)}
              aria-expanded={showDropdown}
            >
              👤 {profile?.name || 'Patient'} ▼
            </button>
            {showDropdown && (
              <div className="user-dropdown-menu">
                <button className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  📋 Profile
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-sidebar-clean">
          <nav className="sidebar-nav-clean">
            <button onClick={() => navigate('/patient/home')} className="sidebar-nav-button-clean">
              My Appointments
            </button>
            <button onClick={() => navigate('/patient/bookings')} className="sidebar-nav-button-clean">
              Book Appointment
            </button>
            <button onClick={handleLogout} className="sidebar-nav-button-clean">
              Logout
            </button>
          </nav>
        </div>

        <main className="dashboard-content">
          <section className="patient-profile-card">
            <div className="patient-profile-heading">
              <div className="patient-profile-avatar" aria-hidden="true">
                {profile?.name?.trim()?.charAt(0)?.toUpperCase() || 'P'}
              </div>
              <div>
                <p className="patient-profile-eyebrow">PATIENT PROFILE</p>
                <h1>{profile?.name || 'Patient'}</h1>
                <p>Your personal account information</p>
              </div>
            </div>

            {loading ? (
              <p className="patient-profile-message">Loading profile...</p>
            ) : error ? (
              <div className="patient-profile-error" role="alert">
                {error}
                {!userInfo?.token && (
                  <button onClick={() => navigate('/patient/login')}>Sign in</button>
                )}
              </div>
            ) : (
              <div className="patient-profile-details">
                <div className="patient-profile-detail">
                  <span>Full name</span>
                  <strong>{profile?.name || 'Not provided'}</strong>
                </div>
                <div className="patient-profile-detail">
                  <span>Email address</span>
                  <strong>{profile?.email || 'Not provided'}</strong>
                </div>
                <div className="patient-profile-detail">
                  <span>Phone number</span>
                  <strong>{profile?.phone || 'Not provided'}</strong>
                </div>
                <div className="patient-profile-detail">
                  <span>Patient ID</span>
                  <strong>{profile?._id || 'Not available'}</strong>
                </div>
                <div className="patient-profile-detail">
                  <span>Member since</span>
                  <strong>{memberSince}</strong>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default PatientProfile;
