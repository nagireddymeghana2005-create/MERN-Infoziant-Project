import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';

const Contact = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const handleHome = () => {
    navigate('/patient/home');
  };

  const handleBookings = () => {
    navigate('/patient/bookings');
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/patient/login');
  };

  const handleStatus = () => {
    navigate('/patient/status');
  };

  return (
    <div className="dashboard-container patient-portal patient-contact-page">
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="header-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="header-title">Doc Token System</span>
          </div>
          <nav className="header-nav">
            <button onClick={handleHome} className="nav-button">🏠 Home</button>
            <button onClick={handleBookings} className="nav-button">📅 Bookings</button>
            <button onClick={handleBookings} className="nav-button">💳 Payment</button>
            <button onClick={handleStatus} className="nav-button">📈 Status</button>
          </nav>
          <div className="header-right">
            <button className="header-button contact-button active">📞 Contact</button>
            <button onClick={handleLogout} className="header-button logout-button">🚪 Logout</button>
            <button className="header-button user-profile-button">👤 {userInfo?.name || 'xyz'}</button>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="contact-container">
            <h2>Contact Us</h2>
            <p className="contact-subtitle">We're here to help you. Reach out to us through any of the following channels.</p>

            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-icon">🏥</div>
                <h3>Hospital Information</h3>
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-label">Hospital Name:</span>
                    <span className="contact-value">DocConnect General Hospital</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Established:</span>
                    <span className="contact-value">2010</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Type:</span>
                    <span className="contact-value">Multi-Specialty Hospital</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Emergency:</span>
                    <span className="contact-value">24/7 Available</span>
                  </div>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-icon">📍</div>
                <h3>Address</h3>
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-label">Street:</span>
                    <span className="contact-value">123 Healthcare Avenue</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Area:</span>
                    <span className="contact-value">Medical District</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">City:</span>
                    <span className="contact-value">Bangalore</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">State:</span>
                    <span className="contact-value">Karnataka</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">PIN Code:</span>
                    <span className="contact-value">560001</span>
                  </div>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-icon">📞</div>
                <h3>Phone Numbers</h3>
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-label">Main Line:</span>
                    <span className="contact-value">+91 98765 43210</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Emergency:</span>
                    <span className="contact-value">+91 98765 43211</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Reception:</span>
                    <span className="contact-value">+91 98765 43212</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Appointment:</span>
                    <span className="contact-value">+91 98765 43213</span>
                  </div>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-icon">✉️</div>
                <h3>Email Addresses</h3>
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-label">General:</span>
                    <span className="contact-value">info@dochospital.com</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Appointments:</span>
                    <span className="contact-value">appointments@dochospital.com</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Emergency:</span>
                    <span className="contact-value">emergency@dochospital.com</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Feedback:</span>
                    <span className="contact-value">feedback@dochospital.com</span>
                  </div>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-icon">⏰</div>
                <h3>Working Hours</h3>
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-label">Monday - Friday:</span>
                    <span className="contact-value">8:00 AM - 8:00 PM</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Saturday:</span>
                    <span className="contact-value">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Sunday:</span>
                    <span className="contact-value">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Emergency:</span>
                    <span className="contact-value">24 Hours</span>
                  </div>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-icon">🌐</div>
                <h3>Social Media</h3>
                <div className="contact-details">
                  <div className="contact-item">
                    <span className="contact-label">Website:</span>
                    <span className="contact-value">www.dochospital.com</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Facebook:</span>
                    <span className="contact-value">@DocConnectHospital</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Twitter:</span>
                    <span className="contact-value">@DocConnect</span>
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Instagram:</span>
                    <span className="contact-value">@docconnect_hospital</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-map-section">
              <h3>Find Us on Map</h3>
              <div className="map-placeholder">
                <div className="map-icon">🗺️</div>
                <p>Interactive Map</p>
                <p className="map-subtext">123 Healthcare Avenue, Medical District, Bangalore</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
