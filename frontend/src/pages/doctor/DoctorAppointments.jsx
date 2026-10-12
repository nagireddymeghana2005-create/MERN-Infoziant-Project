import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiUrl } from '../../api';
import DoctorPortalLayout from './DoctorPortalLayout';

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState('');
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl('/api/booking/doctor'), {
        headers: {
          Authorization: `Bearer ${userInfo?.token || ''}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load appointments.');
      }

      setAppointments(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userInfo?.token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchAppointments({ silent: true });
    };
    const interval = window.setInterval(refreshWhenVisible, 30000);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [fetchAppointments]);

  const updateAppointmentStatus = async (appointment, status, reason = '') => {
    const confirmationMessages = {
      confirmed: `Confirm the appointment for ${appointment.patientName}?`,
      completed: `Mark the appointment for ${appointment.patientName} as completed?`,
      cancelled: `Cancel the appointment for ${appointment.patientName}?`
    };
    if (!window.confirm(confirmationMessages[status])) return;

    setUpdatingAppointmentId(appointment._id);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(apiUrl(`/api/booking/${appointment._id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token || ''}`
        },
        body: JSON.stringify({
          status,
          ...(status === 'cancelled' ? { cancellationReason: reason } : {})
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update appointment.');
      }

      setAppointments((current) => current.map((item) =>
        item._id === data._id ? data : item
      ));
      setSuccessMessage(`Appointment ${status} successfully.`);
      setCancellingAppointmentId('');
      setCancellationReason('');
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingAppointmentId('');
    }
  };

  const beginCancellation = (appointmentId) => {
    setCancellingAppointmentId(appointmentId);
    setCancellationReason('');
    setError('');
    setSuccessMessage('');
  };

  const submitCancellation = (appointment) => {
    if (!cancellationReason.trim()) {
      setError('Please enter a reason for cancelling this appointment.');
      return;
    }
    updateAppointmentStatus(appointment, 'cancelled', cancellationReason.trim());
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [
      appointment.patientName,
      appointment.patientEmail,
      appointment.patientPhone,
      appointment.symptoms
    ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesDate = !dateFilter ||
      new Date(appointment.date).toISOString().slice(0, 10) === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFilter('');
  };

  return (
    <DoctorPortalLayout activePage="appointments">
      <section className="doctor-appointments-panel">
        <div className="doctor-appointments-heading">
          <div>
            <h1>My Appointments</h1>
            <p className="doctor-appointments-subtitle">Appointments booked with you</p>
          </div>
          <button
            className="doctor-refresh-button"
            onClick={fetchAppointments}
            disabled={loading}
          >
            {loading ? <LoadingIndicator label="Loading..." /> : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="doctor-appointment-feedback doctor-appointment-feedback-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={fetchAppointments}>Try again</button>
          </div>
        )}
        {successMessage && <p className="doctor-appointment-feedback doctor-appointment-feedback-success" role="status">{successMessage}</p>}

        {loading ? (
          <LoadingSkeleton variant="appointment" count={3} label="Loading doctor appointments" />
        ) : appointments.length === 0 ? (
          <p className="doctor-profile-message">No appointments have been booked yet.</p>
        ) : (
          <>
            <div className="doctor-appointment-filters">
              <label>
                <span>Search patient</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Name, email, phone, or symptoms"
                />
              </label>
              <label>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label>
                <span>Appointment date</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                />
              </label>
              <button className="doctor-filter-reset" type="button" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
            <p className="doctor-filter-count" aria-live="polite">
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </p>

            {filteredAppointments.length === 0 ? (
              <p className="doctor-profile-message">No appointments match these filters.</p>
            ) : (
              <div className="doctor-appointment-list">
                {filteredAppointments.map((appointment) => {
                  const isUpdating = updatingAppointmentId === appointment._id;
                  const isRequestingCancellation = cancellingAppointmentId === appointment._id;

                  return (
                    <article className="doctor-appointment-card" key={appointment._id}>
                      <div className="doctor-appointment-time">{appointment.timeSlot}</div>
                      <div className="doctor-appointment-details">
                        <h2>
                          <button
                            type="button"
                            className="doctor-patient-details-link"
                            onClick={() => navigate(`/doctor/appointments/${appointment._id}`)}
                          >
                            {appointment.patientName}
                          </button>
                        </h2>
                        <p>{new Date(appointment.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                        <p>{appointment.symptoms}</p>
                        <p>{appointment.patientEmail} · {appointment.patientPhone}</p>
                        {appointment.cancellationReason && (
                          <p className="doctor-cancellation-reason">
                            <strong>Cancellation reason:</strong> {appointment.cancellationReason}
                          </p>
                        )}
                      </div>
                      <span className={`doctor-appointment-status ${appointment.status}`}>
                        {appointment.status}
                      </span>

                      {['pending', 'confirmed'].includes(appointment.status) && (
                        <div className="doctor-appointment-actions">
                          {appointment.status === 'pending' ? (
                            <button
                              type="button"
                              className="doctor-action-button doctor-action-confirm"
                              onClick={() => updateAppointmentStatus(appointment, 'confirmed')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Updating...' : 'Confirm appointment'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="doctor-action-button doctor-action-complete"
                              onClick={() => updateAppointmentStatus(appointment, 'completed')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Updating...' : 'Mark completed'}
                            </button>
                          )}

                          {isRequestingCancellation ? (
                            <div className="doctor-cancellation-form">
                              <label>
                                <span>Reason for cancellation</span>
                                <textarea
                                  value={cancellationReason}
                                  onChange={(event) => setCancellationReason(event.target.value)}
                                  maxLength={500}
                                  rows={2}
                                  placeholder="Enter a reason to share with the patient"
                                  disabled={isUpdating}
                                />
                              </label>
                              <div className="doctor-cancellation-actions">
                                <button
                                  type="button"
                                  className="doctor-action-button doctor-action-cancel"
                                  onClick={() => submitCancellation(appointment)}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? 'Cancelling...' : 'Confirm cancellation'}
                                </button>
                                <button
                                  type="button"
                                  className="doctor-filter-reset"
                                  onClick={() => {
                                    setCancellingAppointmentId('');
                                    setCancellationReason('');
                                  }}
                                  disabled={isUpdating}
                                >
                                  Keep appointment
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="doctor-action-button doctor-action-cancel"
                              onClick={() => beginCancellation(appointment._id)}
                              disabled={isUpdating}
                            >
                              Cancel appointment
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </DoctorPortalLayout>
  );
};

export default DoctorAppointments;
