import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DoctorPortal.css';

const DoctorPortalLayout = ({ activePage, children }) => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/doctor/login');
  };

  return (
    <div className="dashboard-container doctor-portal">
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
              👨‍⚕️ {userInfo?.name || 'Doctor'} ▼
            </button>
            {showDropdown && (
              <div className="user-dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate('/doctor/profile');
                  }}
                >
                  Profile
                </button>
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        <aside className="dashboard-sidebar-clean">
          <nav className="sidebar-nav-clean" aria-label="Doctor navigation">
            <button
              onClick={() => navigate('/doctor/home')}
              className={`sidebar-nav-button-clean ${activePage === 'home' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className={`sidebar-nav-button-clean ${activePage === 'appointments' ? 'active' : ''}`}
            >
              My Appointments
            </button>
            <button
              onClick={() => navigate('/doctor/schedule')}
              className={`sidebar-nav-button-clean ${activePage === 'schedule' ? 'active' : ''}`}
            >
              Schedule
            </button>
          </nav>
        </aside>
        <main className="dashboard-content doctor-portal-content">{children}</main>
      </div>
    </div>
  );
};

export default DoctorPortalLayout;
