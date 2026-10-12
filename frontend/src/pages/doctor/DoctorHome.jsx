import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiUrl } from '../../api';
import DoctorPortalLayout from './DoctorPortalLayout';

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonday = (date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = monday.getDay();
  monday.setDate(monday.getDate() + (dayOfWeek === 0 ? -6 : 1 - dayOfWeek));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const DoctorHome = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [appointments, setAppointments] = useState([]);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
    if (!userInfo?.token || userInfo.role !== 'doctor') {
      setError('Please sign in as a doctor to view your calendar.');
      if (!silent) setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/booking/doctor'), {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Unable to load your appointments.');
      }
      setAppointments(data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userInfo?.role, userInfo?.token]);

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

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      date,
      key: formatDateKey(date),
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      number: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    };
  }), [weekStart]);

  const appointmentsByDay = useMemo(() => {
    const grouped = new Map(days.map((day) => [day.key, []]));
    appointments.forEach((appointment) => {
      const dateKey = typeof appointment.date === 'string'
        ? appointment.date.slice(0, 10)
        : formatDateKey(new Date(appointment.date));
      if (grouped.has(dateKey)) {
        grouped.get(dateKey).push(appointment);
      }
    });
    grouped.forEach((dayAppointments) => {
      dayAppointments.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    });
    return grouped;
  }, [appointments, days]);

  const moveWeek = (weekOffset) => {
    setWeekStart((currentWeek) => {
      const nextWeek = new Date(currentWeek);
      nextWeek.setDate(currentWeek.getDate() + weekOffset * 7);
      return nextWeek;
    });
  };

  const weekLabel = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${
    days[6]?.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) || ''
  }`;

  return (
    <DoctorPortalLayout activePage="home">
      <section className="doctor-welcome-card">
        <h1>Welcome, {userInfo?.name || 'Doctor'}</h1>
        <p>Your doctor dashboard is ready.</p>
        {userInfo?.specialization && (
          <p className="doctor-specialization">{userInfo.specialization}</p>
        )}
      </section>

      <section className="doctor-calendar-panel" aria-label="Weekly appointment calendar">
        <header className="doctor-calendar-header">
          <div>
            <p className="doctor-calendar-eyebrow">YOUR SCHEDULE</p>
            <h2>Weekly Calendar</h2>
            <p className="doctor-calendar-range">{weekLabel}</p>
          </div>
          <div className="doctor-calendar-controls">
            <button type="button" onClick={() => moveWeek(-1)} aria-label="Previous week">‹</button>
            <button type="button" onClick={() => {
              setWeekStart(getMonday(new Date()));
            }}>This week</button>
            <button type="button" onClick={() => moveWeek(1)} aria-label="Next week">›</button>
            <button
              type="button"
              className="doctor-calendar-refresh"
              onClick={fetchAppointments}
              disabled={loading}
            >
              {loading ? <LoadingIndicator label="Loading..." /> : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div className="doctor-calendar-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={fetchAppointments}>Try again</button>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton variant="calendar" count={7} label="Loading your weekly appointments" />
        ) : appointments.length === 0 ? (
          <div className="doctor-calendar-empty">
            <span aria-hidden="true">▦</span>
            <h3>No appointments yet</h3>
            <p>Appointments booked with you will appear here.</p>
          </div>
        ) : (
          <>
            <div className="doctor-week-grid">
              {days.map((day) => {
                const dayAppointments = appointmentsByDay.get(day.key) || [];
                return (
                  <section className="doctor-week-day" key={day.key} aria-label={`${day.label} ${day.number}`}>
                    <header className="doctor-week-day-header">
                      <span>{day.label}</span>
                      <strong>{day.number}</strong>
                    </header>
                    <div className="doctor-week-day-appointments">
                      {dayAppointments.length === 0 ? (
                        <span className="doctor-calendar-no-events">No appointments</span>
                      ) : dayAppointments.map((appointment) => (
                        <button
                          type="button"
                          className={`doctor-calendar-appointment ${appointment.status}`}
                          key={appointment._id}
                          onClick={() => navigate(`/doctor/appointments/${appointment._id}`)}
                          aria-label={`View ${appointment.patientName}, ${appointment.timeSlot}, ${appointment.status}`}
                        >
                          <span className="doctor-calendar-appointment-time">{appointment.timeSlot}</span>
                          <strong>{appointment.patientName}</strong>
                          <span className={`doctor-calendar-status ${appointment.status}`}>
                            {appointment.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

          </>
        )}
      </section>
    </DoctorPortalLayout>
  );
};

export default DoctorHome;
