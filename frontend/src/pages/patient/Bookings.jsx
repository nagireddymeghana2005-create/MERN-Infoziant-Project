import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import { apiUrl } from '../../api';
import '../Dashboard.css';

const Bookings = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const [pendingBooking] = useState(() => {
    const storedBooking = localStorage.getItem('pendingBooking');
    return storedBooking ? JSON.parse(storedBooking) : null;
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDateSelection, setShowDateSelection] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState(pendingBooking?.date?.slice(0, 10) || '');
  const [selectedSlot, setSelectedSlot] = useState(pendingBooking?.timeSlot || '');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityAttempt, setAvailabilityAttempt] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');
  const [formData, setFormData] = useState({
    name: pendingBooking?.name || userInfo?.name || '',
    age: pendingBooking?.age || '',
    gender: pendingBooking?.gender || '',
    weight: pendingBooking?.weight || '',
    symptoms: pendingBooking?.symptoms || '',
    doctor: pendingBooking?.doctorId || ''
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchDoctors = async () => {
      setDoctorsLoading(true);
      setDoctorsError('');
      try {
        const response = await fetch(apiUrl('/api/doctor/public'), {
          signal: controller.signal
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to load available doctors.');
        setDoctors(data);
        setFormData((current) => (
          current.doctor && !data.some((doctor) => doctor._id === current.doctor)
            ? { ...current, doctor: '' }
            : current
        ));
      } catch (error) {
        if (error.name !== 'AbortError') setDoctorsError(error.message);
      } finally {
        if (!controller.signal.aborted) setDoctorsLoading(false);
      }
    };

    fetchDoctors();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!showTimeSlots || !selectedDate || !formData.doctor) {
      return undefined;
    }

    const controller = new AbortController();
    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError('');

      try {
        const params = new URLSearchParams({
          doctorId: formData.doctor,
          date: selectedDate
        });
        const response = await fetch(
          apiUrl(`/api/booking/availability?${params}`),
          { signal: controller.signal }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load available slots.');
        }

        setAvailableTimeSlots(data.availableSlots);
        setAvailabilityMessage(data.message || '');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAvailabilityError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setAvailabilityLoading(false);
        }
      }
    };

    fetchAvailability();
    return () => controller.abort();
  }, [showTimeSlots, selectedDate, formData.doctor, availabilityAttempt]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking Details:', formData);
    setShowDateSelection(true);
  };

  const handleDateSelect = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleDateSubmit = () => {
    if (selectedDate) {
      setShowDateSelection(false);
      setShowTimeSlots(true);
    } else {
      alert('Please select a date');
    }
  };

  const handleSlotSelect = async (slot) => {
    if (availabilityLoading || availabilityError || !availableTimeSlots.includes(slot)) {
      return;
    }

    setSelectedSlot(slot);
    const selectedDoctor = doctors.find((doctor) => doctor._id === formData.doctor);
    const userPhone = localStorage.getItem('userPhone') || '';
    const bookingData = {
      ...formData,
      date: selectedDate,
      timeSlot: slot,
      doctorId: selectedDoctor?._id || formData.doctor,
      doctorName: selectedDoctor?.name || '',
      patientEmail: userInfo?.email || '',
      patientPhone: userPhone
    };
    console.log('Final Booking:', bookingData);
    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));
    navigate('/patient/payment');
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/patient/login');
  };

  const handleBack = () => {
    navigate('/patient/home');
  };

  return (
    <div className="dashboard-container patient-portal patient-booking-page">
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
          <div className="booking-form-container">
            <h2>Book Your Appointment</h2>
            <p>Please fill in your details to book a token</p>

            {!showDateSelection && !showTimeSlots ? (
              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="age">Age</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Enter your age"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="weight">Weight (kg)</label>
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="Enter your weight"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="doctor">Select Doctor</label>
                  <select
                    id="doctor"
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a Doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                  {doctorsLoading && <p>Loading available doctors...</p>}
                  {doctorsError && <p className="booking-availability-error" role="alert">{doctorsError}</p>}
                  {!doctorsLoading && !doctorsError && doctors.length === 0 && (
                    <p>No approved doctors are available for booking yet.</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="symptoms">Symptoms / Reason for Visit</label>
                  <textarea
                    id="symptoms"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    placeholder="Describe your symptoms or reason for visit"
                    rows="4"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={doctorsLoading || Boolean(doctorsError) || doctors.length === 0}
                >
                  Submit Booking
                </button>
              </form>
            ) : showDateSelection ? (
              <div className="date-selection-container">
                <h3>Select Appointment Date</h3>
                <p className="date-selection-subtitle">Choose your preferred date</p>
                <div className="date-picker-wrapper">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateSelect}
                    className="date-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <button onClick={handleDateSubmit} className="submit-button">
                  Continue to Time Slots
                </button>
                <button
                  className="back-button"
                  onClick={() => setShowDateSelection(false)}
                >
                  ← Back to Form
                </button>
              </div>
            ) : (
              <div className="time-slots-container">
                <h3>Select Your Preferred Time Slot</h3>
                <p className="time-slots-subtitle">Available slots for</p>
                <p className="selected-date-display">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {availabilityLoading && <LoadingIndicator label="Checking available slots..." />}
                {availabilityError && (
                  <div className="booking-availability-error" role="alert">
                    <span>{availabilityError}</span>
                    <button type="button" onClick={() => setAvailabilityAttempt((attempt) => attempt + 1)}>
                      Try again
                    </button>
                  </div>
                )}
                {!availabilityLoading && !availabilityError && availabilityMessage && (
                  <p>{availabilityMessage}</p>
                )}
                <div className="time-slots-grid">
                  {!availabilityLoading && !availabilityError && availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      className={`time-slot-button ${selectedSlot === slot ? 'selected' : ''}`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {!availabilityLoading && !availabilityError && !availabilityMessage && availableTimeSlots.length === 0 && (
                  <p>No time slots are available for this date.</p>
                )}
                <button
                  className="back-button"
                  onClick={() => {
                    setShowTimeSlots(false);
                    setShowDateSelection(true);
                  }}
                >
                  ← Back to Date Selection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
