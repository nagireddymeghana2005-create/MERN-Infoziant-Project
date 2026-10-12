import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiUrl } from '../../api';
import '../Dashboard.css';

const Status = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [latestBooking, setLatestBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [cancelError, setCancelError] = useState('');

  const fetchLatestBooking = async () => {
    if (!userInfo?.token || userInfo.role !== 'patient') {
      setError('Please sign in as a patient to view your appointment status.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/booking/patient'), {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const bookings = await response.json();
      if (!response.ok) {
        throw new Error(bookings.message || 'Unable to load your appointment status.');
      }
      setLatestBooking(bookings[0] || null);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestBooking();
  }, []);

  const handleCancelAppointment = async () => {
    if (!latestBooking || cancelling) return;

    setCancelling(true);
    setCancelError('');
    try {
      const response = await fetch(
        apiUrl(`/api/booking/${latestBooking._id}/cancel`),
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${userInfo.token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to cancel your appointment.');
      }
      setLatestBooking(data);
    } catch (cancelRequestError) {
      setCancelError(cancelRequestError.message);
    } finally {
      setCancelling(false);
    }
  };

  const bookingStatus = latestBooking?.status || 'pending';
  const statusIcon = bookingStatus === 'cancelled' ? '×' : bookingStatus === 'pending' ? '◷' : '✓';
  const canCancelAppointment = ['pending', 'confirmed'].includes(bookingStatus.toLowerCase());

  return (
    <div className="dashboard-container patient-portal patient-status-page">
      <main className="dashboard-content patient-status-content">
          <div className="status-container">
            <h2>Latest Appointment Status</h2>

            {loading ? (
              <LoadingSkeleton variant="status" count={1} label="Loading latest appointment status" />
            ) : error ? (
              <div className="no-booking" role="alert">
                <h3>Unable to load appointment status</h3>
                <p>{error}</p>
                <button onClick={fetchLatestBooking} className="submit-button">Try Again</button>
              </div>
            ) : latestBooking ? (
              <div className="status-card">
                <div className="status-header">
                  <div className={`status-icon ${bookingStatus}`}>{statusIcon}</div>
                  <h3>{bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}</h3>
                </div>

                <div className="status-details">
                  <div className="status-item">
                    <span>Doctor:</span>
                    <span>{latestBooking.doctorName}</span>
                  </div>
                  <div className="status-item">
                    <span>Date:</span>
                    <span>{latestBooking.date ? new Date(latestBooking.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Not selected'}</span>
                  </div>
                  <div className="status-item">
                    <span>Time Slot:</span>
                    <span>{latestBooking.timeSlot}</span>
                  </div>
                  <div className="status-item">
                    <span>Symptoms:</span>
                    <span>{latestBooking.symptoms || 'Not provided'}</span>
                  </div>
                  {latestBooking.cancellationReason && (
                    <div className="status-item">
                      <span>Cancellation reason:</span>
                      <span>{latestBooking.cancellationReason}</span>
                    </div>
                  )}
                </div>
                {cancelError && <div className="patient-appointments-error" role="alert">{cancelError}</div>}
                {latestBooking.status !== 'cancelled' && (
                  <div className="patient-cancel-appointment">
                    <button
                      type="button"
                      onClick={handleCancelAppointment}
                      className="patient-cancel-appointment-button"
                      disabled={!canCancelAppointment || cancelling}
                      aria-describedby={!canCancelAppointment ? 'appointment-cancel-unavailable' : undefined}
                    >
                      {cancelling
                        ? 'Cancelling...'
                        : canCancelAppointment
                          ? 'Cancel Appointment'
                          : 'Appointment Completed'}
                    </button>
                    {!canCancelAppointment && (
                      <p id="appointment-cancel-unavailable" className="patient-cancel-unavailable">
                        Completed appointments can’t be cancelled.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-booking">
                <div className="no-booking-icon">📋</div>
                <h3>No Bookings Yet</h3>
                <p>Your latest appointment status will appear here after you book an appointment.</p>
                <button onClick={() => navigate('/patient/bookings')} className="submit-button">
                  Book an Appointment
                </button>
              </div>
            )}
          </div>
      </main>
    </div>
  );
};

export default Status;
