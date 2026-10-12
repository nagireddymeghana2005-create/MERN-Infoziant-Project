import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiUrl } from '../../api';
import DoctorPortalLayout from './DoctorPortalLayout';

const DoctorPatientDetails = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPatientDetails = useCallback(async () => {
    if (!userInfo?.token || userInfo.role !== 'doctor') {
      setError('Please sign in as a doctor to view patient details.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/booking/doctor'), {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const bookings = await response.json();
      if (!response.ok) {
        throw new Error(bookings.message || 'Unable to load patient details.');
      }

      const selectedAppointment = bookings.find((booking) => booking._id === appointmentId);
      if (!selectedAppointment) {
        throw new Error('This appointment was not found in your doctor account.');
      }
      setAppointment(selectedAppointment);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, userInfo?.role, userInfo?.token]);

  useEffect(() => {
    fetchPatientDetails();
  }, [fetchPatientDetails]);

  const formattedDate = appointment?.date
    ? new Date(appointment.date).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    : '';

  return (
    <DoctorPortalLayout activePage="appointments">
      <section className="doctor-patient-details-panel">
        <button
          type="button"
          className="doctor-patient-details-back"
          onClick={() => navigate('/doctor/appointments')}
        >
          <span aria-hidden="true">←</span> Back to My Appointments
        </button>

        {loading ? (
          <div className="doctor-patient-details-state" role="status">
            <span className="doctor-schedule-spinner" aria-hidden="true" />
            Loading patient details...
          </div>
        ) : error ? (
          <div className="doctor-patient-details-state doctor-patient-details-error" role="alert">
            <h1>Unable to load patient details</h1>
            <p>{error}</p>
            <button type="button" className="doctor-action-button doctor-action-confirm" onClick={fetchPatientDetails}>
              Try again
            </button>
          </div>
        ) : appointment ? (
          <>
            <header className="doctor-patient-details-header">
              <div className="doctor-patient-avatar" aria-hidden="true">
                {appointment.patientName?.trim().charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="doctor-patient-details-title">
                <p className="doctor-calendar-eyebrow">PATIENT DETAILS</p>
                <h1>{appointment.patientName}</h1>
                <span className={`doctor-appointment-status ${appointment.status}`}>
                  {appointment.status}
                </span>
              </div>
            </header>

            <div className="doctor-patient-details-grid">
              <article className="doctor-patient-info-card">
                <span className="doctor-patient-info-icon" aria-hidden="true">♙</span>
                <div>
                  <p>Age</p>
                  <strong>{appointment.patientAge || 'Not provided'}</strong>
                </div>
              </article>
              <article className="doctor-patient-info-card">
                <span className="doctor-patient-info-icon" aria-hidden="true">⚥</span>
                <div>
                  <p>Gender</p>
                  <strong>{appointment.patientGender || 'Not provided'}</strong>
                </div>
              </article>
              <article className="doctor-patient-info-card doctor-patient-info-wide">
                <span className="doctor-patient-info-icon" aria-hidden="true">◷</span>
                <div>
                  <p>Appointment date and time</p>
                  <strong>{formattedDate}</strong>
                  <span>{appointment.timeSlot}</span>
                </div>
              </article>
              <article className="doctor-patient-info-card doctor-patient-info-wide doctor-patient-symptoms">
                <span className="doctor-patient-info-icon" aria-hidden="true">✚</span>
                <div>
                  <p>Symptoms</p>
                  <strong>{appointment.symptoms || 'Not provided'}</strong>
                </div>
              </article>
              {appointment.cancellationReason && (
                <article className="doctor-patient-info-card doctor-patient-info-wide doctor-patient-cancellation">
                  <span className="doctor-patient-info-icon" aria-hidden="true">!</span>
                  <div>
                    <p>Cancellation reason</p>
                    <strong>{appointment.cancellationReason}</strong>
                  </div>
                </article>
              )}
            </div>
          </>
        ) : null}
      </section>
    </DoctorPortalLayout>
  );
};

export default DoctorPatientDetails;
