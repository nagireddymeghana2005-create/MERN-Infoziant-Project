import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../api';
import '../Dashboard.css';

const Payment = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [showDropdown, setShowDropdown] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    const storedBooking = localStorage.getItem('pendingBooking');
    if (storedBooking) {
      setBookingData(JSON.parse(storedBooking));
    } else {
      navigate('/patient/bookings');
    }
  }, [navigate]);

  const handlePayment = async () => {
    setPaymentStatus('processing');
    setPaymentError('');
    
    try {
      console.log('Sending booking data:', bookingData);
      
      // Map field names to match backend schema
      const bookingPayload = {
        patientName: bookingData.name,
        patientEmail: bookingData.patientEmail,
        patientPhone: bookingData.patientPhone,
        patientAge: bookingData.age,
        patientGender: bookingData.gender,
        patientWeight: bookingData.weight,
        symptoms: bookingData.symptoms,
        doctorId: bookingData.doctorId,
        doctorName: bookingData.doctorName,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        paymentStatus: 'paid'
      };
      
      console.log('Mapped booking payload:', bookingPayload);
      
      // Submit booking to backend
      const response = await fetch(apiUrl('/api/booking'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token || ''}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        setPaymentStatus('success');
        localStorage.removeItem('pendingBooking');
        localStorage.setItem('lastBooking', JSON.stringify(data));
      } else {
        setPaymentError(data.message || 'We could not create your booking. Please try again.');
        setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setPaymentError('Unable to connect to the booking service. Please try again.');
      setPaymentStatus('pending');
    }
  };

  const handleBack = () => {
    navigate('/patient/bookings');
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/patient/login');
  };

  if (!bookingData) {
    return <div className="dashboard-container">Loading...</div>;
  }

  const doctorName = bookingData.doctorName || 'Selected Doctor';

  return (
    <div className="dashboard-container patient-portal patient-payment-page">
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
              👤 {userInfo?.name || 'Patient'} ▼
            </button>
            {showDropdown && (
              <div className="user-dropdown-menu">
                <button className="dropdown-item" onClick={() => navigate('/patient/profile')}>
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
            <button onClick={handleBack} className="sidebar-nav-button-clean active">
              📅 Book Appointment
            </button>
          </nav>
        </div>

        <div className="dashboard-content">
          <div className="payment-container">
            <h2>Payment Details</h2>
            {paymentError && <p className="payment-error-message" role="alert">{paymentError}</p>}
            
            {paymentStatus === 'pending' && (
              <>
                <div className="payment-summary">
                  <h3>Booking Summary</h3>
                  <div className="summary-item">
                    <span>Patient Name:</span>
                    <span>{bookingData.name}</span>
                  </div>
                  <div className="summary-item">
                    <span>Doctor:</span>
                    <span>{doctorName}</span>
                  </div>
                  <div className="summary-item">
                    <span>Date:</span>
                    <span>{bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not selected'}</span>
                  </div>
                  <div className="summary-item">
                    <span>Time Slot:</span>
                    <span>{bookingData.timeSlot}</span>
                  </div>
                  <div className="summary-item total">
                    <span>Consultation Fee:</span>
                    <span>₹200</span>
                  </div>
                </div>

                <div className="qr-section">
                  <h3>Scan QR Code to Pay</h3>
                  <div className="qr-placeholder">
                    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                      <rect x="10" y="10" width="60" height="60" fill="#000000"/>
                      <rect x="130" y="10" width="60" height="60" fill="#000000"/>
                      <rect x="10" y="130" width="60" height="60" fill="#000000"/>
                      <rect x="20" y="20" width="40" height="40" fill="white"/>
                      <rect x="140" y="20" width="40" height="40" fill="white"/>
                      <rect x="20" y="140" width="40" height="40" fill="white"/>
                      <rect x="30" y="30" width="20" height="20" fill="#000000"/>
                      <rect x="150" y="30" width="20" height="20" fill="#000000"/>
                      <rect x="30" y="150" width="20" height="20" fill="#000000"/>
                      <rect x="80" y="10" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="10" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="30" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="30" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="50" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="50" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="140" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="140" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="160" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="160" width="10" height="10" fill="#000000"/>
                      <rect x="80" y="180" width="10" height="10" fill="#000000"/>
                      <rect x="100" y="180" width="10" height="10" fill="#000000"/>
                      <rect x="120" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="140" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="160" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="180" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="120" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="140" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="160" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="180" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="120" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="140" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="160" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="180" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="120" y="140" width="10" height="10" fill="#000000"/>
                      <rect x="140" y="140" width="10" height="10" fill="#000000"/>
                      <rect x="160" y="140" width="10" height="10" fill="#000000"/>
                      <rect x="180" y="140" width="10" height="10" fill="#000000"/>
                      <rect x="120" y="160" width="10" height="10" fill="#000000"/>
                      <rect x="140" y="160" width="10" height="10" fill="#000000"/>
                      <rect x="160" y="160" width="10" height="10" fill="#000000"/>
                      <rect x="180" y="160" width="10" height="10" fill="#000000"/>
                      <rect x="120" y="180" width="10" height="10" fill="#000000"/>
                      <rect x="140" y="180" width="10" height="10" fill="#000000"/>
                      <rect x="160" y="180" width="10" height="10" fill="#000000"/>
                      <rect x="180" y="180" width="10" height="10" fill="#000000"/>
                      <rect x="10" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="30" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="50" y="80" width="10" height="10" fill="#000000"/>
                      <rect x="10" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="30" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="50" y="100" width="10" height="10" fill="#000000"/>
                      <rect x="10" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="30" y="120" width="10" height="10" fill="#000000"/>
                      <rect x="50" y="120" width="10" height="10" fill="#000000"/>
                    </svg>
                    <p className="qr-text">UPI QR Code</p>
                  </div>
                </div>

                <button onClick={handlePayment} className="submit-button">
                  Confirm Payment of ₹200
                </button>
              </>
            )}

            {paymentStatus === 'processing' && (
              <div className="payment-processing">
                <div className="spinner"></div>
                <p>Processing payment...</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="payment-success">
                <div className="success-icon">✓</div>
                <h3>Payment Successful!</h3>
                <p>Your booking has been confirmed.</p>
                <p className="booking-reference">Reference ID: {Date.now()}</p>
                <button onClick={() => navigate('/patient/home')} className="submit-button">
                  Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
