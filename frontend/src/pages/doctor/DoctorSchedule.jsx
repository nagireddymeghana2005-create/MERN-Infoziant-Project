import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../api';
import DoctorPortalLayout from './DoctorPortalLayout';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const TIME_SLOTS = [
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM'
];

const DoctorSchedule = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [availableDays, setAvailableDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [timeSlots, setTimeSlots] = useState(TIME_SLOTS);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [dateToBlock, setDateToBlock] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(apiUrl('/api/doctor/schedule'), {
          headers: {
            Authorization: `Bearer ${userInfo?.token || ''}`
          }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load your schedule.');
        }

        setAvailableDays(data.availableDays);
        setTimeSlots(data.timeSlots);
        setUnavailableDates(data.unavailableDates);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const toggleValue = (value, currentValues, setValues) => {
    setValues(currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]);
  };

  const addUnavailableDate = () => {
    if (dateToBlock && !unavailableDates.includes(dateToBlock)) {
      setUnavailableDates((dates) => [...dates, dateToBlock].sort());
      setDateToBlock('');
      setMessage('');
      setError('');
    }
  };

  const removeUnavailableDate = (dateToRemove) => {
    setUnavailableDates((dates) => dates.filter((date) => date !== dateToRemove));
    setMessage('');
    setError('');
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(apiUrl('/api/doctor/schedule'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token || ''}`
        },
        body: JSON.stringify({ availableDays, timeSlots, unavailableDates })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save your schedule.');
      }

      setAvailableDays(data.availableDays);
      setTimeSlots(data.timeSlots);
      setUnavailableDates(data.unavailableDates);
      setMessage('Your schedule has been saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DoctorPortalLayout activePage="schedule">
      <section className="doctor-schedule-panel doctor-schedule-page">
        <header className="doctor-schedule-header">
          <div>
            <p className="doctor-schedule-eyebrow">AVAILABILITY SETTINGS</p>
            <h1>Manage your schedule</h1>
            <p className="doctor-schedule-description">
              Choose your regular working days and appointment times. Block dates when you are unavailable.
            </p>
          </div>
          <span className="doctor-schedule-header-icon" aria-hidden="true">◷</span>
        </header>

        {loading ? (
          <div className="doctor-schedule-loading" role="status">
            <span className="doctor-schedule-spinner" aria-hidden="true" />
            Loading your saved schedule...
          </div>
        ) : (
          <form onSubmit={saveSchedule}>
            <fieldset className="doctor-schedule-fieldset doctor-schedule-days">
              <legend>
                <span className="doctor-schedule-section-icon" aria-hidden="true">▦</span>
                Working days
              </legend>
              <p className="doctor-schedule-hint">Select the days you are available for appointments.</p>
              <div className="doctor-schedule-options doctor-day-options">
                {DAYS.map((day) => (
                  <label
                    className={`doctor-schedule-option doctor-day-option ${availableDays.includes(day.value) ? 'selected' : ''}`}
                    key={day.value}
                  >
                    <input
                      type="checkbox"
                      checked={availableDays.includes(day.value)}
                      onChange={() => {
                        toggleValue(day.value, availableDays, setAvailableDays);
                        setMessage('');
                        setError('');
                      }}
                    />
                    <span className="doctor-schedule-checkmark" aria-hidden="true" />
                    <span className="doctor-day-label">{day.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="doctor-schedule-fieldset doctor-schedule-times">
              <legend>
                <span className="doctor-schedule-section-icon" aria-hidden="true">◷</span>
                Appointment time slots
              </legend>
              <p className="doctor-schedule-hint">Choose the appointment times patients can book.</p>
              <div className="doctor-schedule-options doctor-slot-options">
                {TIME_SLOTS.map((slot) => (
                  <label
                    className={`doctor-schedule-option doctor-slot-option ${timeSlots.includes(slot) ? 'selected' : ''}`}
                    key={slot}
                  >
                    <input
                      type="checkbox"
                      checked={timeSlots.includes(slot)}
                      onChange={() => {
                        toggleValue(slot, timeSlots, setTimeSlots);
                        setMessage('');
                        setError('');
                      }}
                    />
                    <span className="doctor-schedule-checkmark" aria-hidden="true" />
                    <span>{slot}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="doctor-schedule-fieldset doctor-schedule-blocked">
              <legend>
                <span className="doctor-schedule-section-icon" aria-hidden="true">▣</span>
                Blocked dates
              </legend>
              <p className="doctor-schedule-hint">Patients cannot book any time on a blocked date.</p>
              <div className="doctor-block-date-form">
                <input
                  type="date"
                  value={dateToBlock}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setDateToBlock(event.target.value)}
                />
                <button
                  type="button"
                  onClick={addUnavailableDate}
                  disabled={!dateToBlock || unavailableDates.includes(dateToBlock)}
                >
                  + Block date
                </button>
              </div>
              {unavailableDates.length > 0 ? (
                <ul className="doctor-blocked-dates">
                  {unavailableDates.map((date) => (
                    <li className="doctor-blocked-date-badge" key={date}>
                      <span>{new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                      <button
                        type="button"
                        onClick={() => removeUnavailableDate(date)}
                        aria-label={`Remove blocked date ${date}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="doctor-schedule-hint">No dates blocked.</p>
              )}
            </fieldset>

            {error && <p className="doctor-schedule-feedback doctor-schedule-feedback-error" role="alert">{error}</p>}
            {message && <p className="doctor-schedule-feedback doctor-schedule-feedback-success" role="status">{message}</p>}
            <footer className="doctor-schedule-footer">
              <span className="doctor-schedule-save-hint">Your changes take effect after saving.</span>
              <button className="doctor-schedule-save" type="submit" disabled={saving}>
                {saving ? <><span className="doctor-schedule-button-spinner" aria-hidden="true" /> Saving schedule...</> : 'Save schedule'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </DoctorPortalLayout>
  );
};

export default DoctorSchedule;
