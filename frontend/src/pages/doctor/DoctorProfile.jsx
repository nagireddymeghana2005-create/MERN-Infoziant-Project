import React, { useEffect, useState } from 'react';
import { apiUrl } from '../../api';
import DoctorPortalLayout from './DoctorPortalLayout';

const DoctorProfile = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const [profile, setProfile] = useState(userInfo);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(apiUrl('/api/doctor/profile'), {
          headers: {
            Authorization: `Bearer ${userInfo?.token || ''}`
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

  return (
    <DoctorPortalLayout>
      <section className="doctor-profile-panel">
        <h1>Doctor Profile</h1>
        {loading ? (
          <p className="doctor-profile-message">Loading profile...</p>
        ) : error ? (
          <p className="doctor-profile-error" role="alert">{error}</p>
        ) : (
          <div className="doctor-profile-details">
            <div className="doctor-profile-field">
              <span>Name</span>
              <strong>{profile?.name || 'Not available'}</strong>
            </div>
            <div className="doctor-profile-field">
              <span>Email</span>
              <strong>{profile?.email || 'Not available'}</strong>
            </div>
            <div className="doctor-profile-field">
              <span>Phone</span>
              <strong>{profile?.phone || 'Not available'}</strong>
            </div>
            <div className="doctor-profile-field">
              <span>Specialization</span>
              <strong>{profile?.specialization || 'Not available'}</strong>
            </div>
            <div className="doctor-profile-field">
              <span>Qualification</span>
              <strong>{profile?.qualification || 'Not available'}</strong>
            </div>
            <div className="doctor-profile-field">
              <span>Experience</span>
              <strong>{profile?.experience != null ? `${profile.experience} years` : 'Not available'}</strong>
            </div>
          </div>
        )}
      </section>
    </DoctorPortalLayout>
  );
};

export default DoctorProfile;
