import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/LoadingIndicator';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { apiUrl } from '../../api';
import './AdminDashboard.css';

const initialSummary = {
  totalPatients: 0,
  totalDoctors: 0,
  totalBookings: 0,
  todaysAppointments: 0,
  totalRevenue: 0,
  simulatedAmountMarkedPaid: 0
};

const summaryCards = [
  { key: 'totalPatients', label: 'Total Patients', icon: '♙', tone: 'blue' },
  { key: 'totalDoctors', label: 'Total Doctors', icon: '⚕', tone: 'violet' },
  { key: 'totalBookings', label: 'Total Bookings', icon: '▦', tone: 'cyan' },
  { key: 'todaysAppointments', label: "Today's Appointments", icon: '◷', tone: 'amber' },
  { key: 'simulatedAmountMarkedPaid', label: 'Simulated Amount Marked Paid', icon: '₹', tone: 'green' }
];

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(amount);

const emptyDoctor = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  experience: '',
  qualification: '',
  password: ''
};

const readUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || 'null');
  } catch {
    return null;
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const userInfo = readUserInfo();
  const [summary, setSummary] = useState(initialSummary);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('overview');
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorError, setDoctorError] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorModal, setDoctorModal] = useState(null);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [doctorSaving, setDoctorSaving] = useState(false);
  const [doctorNotice, setDoctorNotice] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientError, setPatientError] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientNotice, setPatientNotice] = useState('');
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientDetailsLoading, setPatientDetailsLoading] = useState(false);
  const [patientDetailsError, setPatientDetailsError] = useState('');
  const [patientUpdatingId, setPatientUpdatingId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');
  const [appointmentNotice, setAppointmentNotice] = useState('');
  const [appointmentFilters, setAppointmentFilters] = useState({
    search: '',
    date: '',
    status: '',
    doctorId: ''
  });
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [appointmentStatusDrafts, setAppointmentStatusDrafts] = useState({});
  const [appointmentUpdatingId, setAppointmentUpdatingId] = useState('');
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentFilters, setPaymentFilters] = useState({ search: '', date: '', status: '' });
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState('');
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    createdAt: ''
  });
  const [profileForm, setProfileForm] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [systemInfo, setSystemInfo] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/admin/login', { replace: true });
  };

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!userInfo?.token || userInfo.role !== 'admin') {
      localStorage.removeItem('userInfo');
      navigate('/admin/login', { replace: true });
      return;
    }

    if (!silent) setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${userInfo.token}` };
      const [summaryResponse, bookingsResponse] = await Promise.all([
        fetch(apiUrl('/api/admin/dashboard/summary'), { headers }),
        fetch(apiUrl('/api/admin/dashboard/recent-bookings?limit=10'), { headers })
      ]);
      const [summaryData, bookingsData] = await Promise.all([
        summaryResponse.json(),
        bookingsResponse.json()
      ]);

      if (!summaryResponse.ok) {
        throw new Error(summaryData.message || 'Unable to load dashboard summary.');
      }
      if (!bookingsResponse.ok) {
        throw new Error(bookingsData.message || 'Unable to load recent bookings.');
      }

      setSummary(summaryData);
      setBookings(bookingsData);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate, userInfo?.role, userInfo?.token]);

  const fetchDoctors = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setDoctorsLoading(true);
    setDoctorError('');
    try {
      const response = await fetch(apiUrl('/api/admin/doctors'), {
        headers: { Authorization: 'Bearer ' + userInfo.token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load doctors.');
      setDoctors(data);
    } catch (fetchError) {
      setDoctorError(fetchError.message);
    } finally {
      if (!silent) setDoctorsLoading(false);
    }
  }, [userInfo?.token]);

  const fetchPatients = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setPatientsLoading(true);
    setPatientError('');
    try {
      const response = await fetch(apiUrl('/api/admin/patients'), {
        headers: { Authorization: 'Bearer ' + userInfo.token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load patients.');
      setPatients(data);
    } catch (fetchError) {
      setPatientError(fetchError.message);
    } finally {
      if (!silent) setPatientsLoading(false);
    }
  }, [userInfo?.token]);

  const fetchAppointments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setAppointmentsLoading(true);
    setAppointmentError('');
    try {
      const query = new URLSearchParams();
      Object.entries(appointmentFilters).forEach(([key, value]) => {
        if (value.trim()) query.set(key, value.trim());
      });
      const response = await fetch(
        apiUrl(`/api/admin/appointments?${query.toString()}`),
        { headers: { Authorization: 'Bearer ' + userInfo.token } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load appointments.');
      setAppointments(data);
      if (!silent) setAppointmentStatusDrafts({});
    } catch (fetchError) {
      setAppointmentError(fetchError.message);
    } finally {
      if (!silent) setAppointmentsLoading(false);
    }
  }, [appointmentFilters, userInfo?.token]);

  const fetchPayments = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setPaymentsLoading(true);
    setPaymentError('');
    try {
      const query = new URLSearchParams();
      Object.entries(paymentFilters).forEach(([key, value]) => {
        if (value.trim()) query.set(key, value.trim());
      });
      const response = await fetch(
        apiUrl(`/api/admin/payments?${query.toString()}`),
        { headers: { Authorization: 'Bearer ' + userInfo.token } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load simulated payment records.');
      setPayments(data);
    } catch (fetchError) {
      setPaymentError(fetchError.message);
    } finally {
      if (!silent) setPaymentsLoading(false);
    }
  }, [paymentFilters, userInfo?.token]);

  const refreshActiveView = useCallback(() => {
    if (document.visibilityState !== 'visible') return;
    if (activeView === 'overview') fetchDashboard({ silent: true });
    if (activeView === 'doctors') fetchDoctors({ silent: true });
    if (activeView === 'patients') fetchPatients({ silent: true });
    if (activeView === 'appointments') fetchAppointments({ silent: true });
    if (activeView === 'payments') fetchPayments({ silent: true });
  }, [activeView, fetchAppointments, fetchDashboard, fetchDoctors, fetchPatients, fetchPayments]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const response = await fetch(apiUrl('/api/admin/reports/analytics'), {
        headers: { Authorization: 'Bearer ' + userInfo.token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load reports and analytics.');
      setReports(data);
    } catch (fetchError) {
      setReportsError(fetchError.message);
    } finally {
      setReportsLoading(false);
    }
  }, [userInfo?.token]);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const headers = { Authorization: 'Bearer ' + userInfo.token };
      const [profileResponse, systemResponse] = await Promise.all([
        fetch(apiUrl('/api/admin/settings/profile'), { headers }),
        fetch(apiUrl('/api/admin/settings/system-info'), { headers })
      ]);
      const [profileData, systemData] = await Promise.all([
        profileResponse.json(),
        systemResponse.json()
      ]);
      if (!profileResponse.ok) throw new Error(profileData.message || 'Unable to load admin profile.');
      if (!systemResponse.ok) throw new Error(systemData.message || 'Unable to load system information.');
      setAdminProfile(profileData);
      setProfileForm({ name: profileData.name, email: profileData.email });
      setSystemInfo(systemData);
    } catch (fetchError) {
      setSettingsError(fetchError.message);
    } finally {
      setSettingsLoading(false);
    }
  }, [userInfo?.token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const interval = window.setInterval(refreshActiveView, 30000);
    window.addEventListener('focus', refreshActiveView);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshActiveView);
    };
  }, [refreshActiveView]);

  useEffect(() => {
    if (activeView === 'doctors') fetchDoctors();
  }, [activeView, fetchDoctors]);

  useEffect(() => {
    if (activeView === 'patients') fetchPatients();
  }, [activeView, fetchPatients]);

  useEffect(() => {
    if (activeView !== 'appointments') return undefined;
    const timeout = window.setTimeout(() => {
      fetchAppointments();
    }, appointmentFilters.search ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [activeView, appointmentFilters, fetchAppointments]);

  useEffect(() => {
    if (activeView === 'appointments' && doctors.length === 0) fetchDoctors();
  }, [activeView, doctors.length, fetchDoctors]);

  useEffect(() => {
    if (activeView !== 'payments') return undefined;
    const timeout = window.setTimeout(fetchPayments, paymentFilters.search ? 250 : 0);
    return () => window.clearTimeout(timeout);
  }, [activeView, fetchPayments, paymentFilters.search]);

  useEffect(() => {
    if (activeView === 'reports' && !reports) fetchReports();
  }, [activeView, fetchReports, reports]);

  useEffect(() => {
    if (activeView === 'settings') fetchSettings();
  }, [activeView, fetchSettings]);

  const saveAdminProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setSettingsError('');
    setProfileNotice('');
    try {
      const response = await fetch(apiUrl('/api/admin/settings/profile'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token
        },
        body: JSON.stringify(profileForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save profile.');
      setAdminProfile(data);
      setProfileForm({ name: data.name, email: data.email });
      const latestUserInfo = readUserInfo();
      if (latestUserInfo?.token) {
        localStorage.setItem('userInfo', JSON.stringify({
          ...latestUserInfo,
          name: data.name,
          email: data.email
        }));
      }
      setProfileNotice('Admin profile updated.');
    } catch (saveError) {
      setSettingsError(saveError.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const changeAdminPassword = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordNotice('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordSaving(false);
      return;
    }
    try {
      const response = await fetch(apiUrl('/api/admin/settings/password'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to change password.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordNotice(data.message);
    } catch (changeError) {
      setPasswordError(changeError.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const saveDoctor = async (event) => {
    event.preventDefault();
    setDoctorSaving(true);
    setDoctorError('');
    setDoctorNotice('');
    const editing = doctorModal?.mode === 'edit';
    const payload = { ...doctorForm, experience: Number(doctorForm.experience) };
    if (editing) delete payload.password;
    try {
      const response = await fetch(
        editing
          ? apiUrl(`/api/admin/doctors/${doctorModal.doctor._id}`)
          : apiUrl('/api/admin/doctors'),
        {
          method: editing ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + userInfo.token
          },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save doctor.');
      setDoctorModal(null);
      setDoctorForm(emptyDoctor);
      setDoctorNotice(editing ? 'Doctor details updated.' : 'Doctor added successfully.');
      await fetchDoctors();
    } catch (saveError) {
      setDoctorError(saveError.message);
    } finally {
      setDoctorSaving(false);
    }
  };

  const updateDoctorState = async (doctor, endpoint, body, successMessage) => {
    setDoctorError('');
    setDoctorNotice('');
    try {
      const response = await fetch(apiUrl(`/api/admin/doctors/${doctor._id}/${endpoint}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update doctor.');
      setDoctorNotice(successMessage);
      await fetchDoctors();
    } catch (updateError) {
      setDoctorError(updateError.message);
    }
  };

  const openDoctorModal = (mode, doctor = null) => {
    setDoctorForm(doctor ? {
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialization: doctor.specialization,
      experience: doctor.experience,
      qualification: doctor.qualification,
      password: ''
    } : emptyDoctor);
    setDoctorModal({ mode, doctor });
    setDoctorError('');
    setDoctorNotice('');
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const query = doctorSearch.trim().toLowerCase();
    return !query || [doctor.name, doctor.email, doctor.phone, doctor.specialization]
      .some((value) => value?.toLowerCase().includes(query));
  });

  const filteredPatients = patients.filter((patient) => {
    const query = patientSearch.trim().toLowerCase();
    return !query || [patient.name, patient.email]
      .some((value) => value?.toLowerCase().includes(query));
  });

  const openPatientDetails = async (patient) => {
    setPatientDetails({ patient, bookings: null });
    setPatientDetailsLoading(true);
    setPatientDetailsError('');
    try {
      const response = await fetch(apiUrl(`/api/admin/patients/${patient._id}`), {
        headers: { Authorization: 'Bearer ' + userInfo.token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load patient details.');
      setPatientDetails(data);
    } catch (fetchError) {
      setPatientDetailsError(fetchError.message);
    } finally {
      setPatientDetailsLoading(false);
    }
  };

  const updatePatientAccess = async (patient) => {
    setPatientUpdatingId(patient._id);
    setPatientError('');
    setPatientNotice('');
    try {
      const response = await fetch(apiUrl(`/api/admin/patients/${patient._id}/active`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + userInfo.token
        },
        body: JSON.stringify({ isActive: !patient.isActive })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update patient access.');
      setPatientNotice(`${patient.name} ${data.isActive ? 'activated' : 'deactivated'}.`);
      await fetchPatients();
      setPatientDetails((current) => current?.patient?._id === patient._id
        ? { ...current, patient: { ...current.patient, isActive: data.isActive } }
        : current);
    } catch (updateError) {
      setPatientError(updateError.message);
    } finally {
      setPatientUpdatingId('');
    }
  };

  const updateAppointmentStatus = async (appointment, selectedStatus = appointmentStatusDrafts[appointment._id]) => {
    const status = selectedStatus;
    if (!status) return;
    setAppointmentUpdatingId(appointment._id);
    setAppointmentError('');
    setAppointmentNotice('');
    try {
      const response = await fetch(
        apiUrl(`/api/admin/appointments/${appointment._id}/status`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + userInfo.token
          },
          body: JSON.stringify({ status })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update appointment.');
      setAppointmentNotice(`Appointment status changed to ${data.status}.`);
      await fetchAppointments();
    } catch (updateError) {
      setAppointmentError(updateError.message);
    } finally {
      setAppointmentUpdatingId('');
    }
  };

  const allowedAppointmentStatuses = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };

  const openPaymentDetails = async (payment) => {
    setPaymentDetails(payment);
    setPaymentDetailsLoading(true);
    setPaymentDetailsError('');
    try {
      const response = await fetch(apiUrl(`/api/admin/payments/${payment.bookingId}`), {
        headers: { Authorization: 'Bearer ' + userInfo.token }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load simulated payment details.');
      setPaymentDetails(data);
    } catch (fetchError) {
      setPaymentDetailsError(fetchError.message);
    } finally {
      setPaymentDetailsLoading(false);
    }
  };

  const getCardValue = (key) => {
    if (key === 'simulatedAmountMarkedPaid') {
      return formatCurrency(summary[key] || 0);
    }
    return new Intl.NumberFormat('en-IN').format(summary[key]);
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <button className="admin-brand" onClick={() => navigate('/admin/dashboard')}>
          <span className="admin-brand-mark">✚</span>
          <span><strong>DOC-CONNECT</strong><small>ADMIN PORTAL</small></span>
        </button>

        <p className="admin-nav-label">WORKSPACE</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          <button
            className={`admin-nav-link ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          ><span>▦</span> Overview</button>
          <button
            className={`admin-nav-link ${activeView === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveView('doctors')}
          ><span>⚕</span> Doctor management</button>
          <button
            className={`admin-nav-link ${activeView === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveView('patients')}
          ><span>♙</span> Patient management</button>
          <button
            className={`admin-nav-link ${activeView === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveView('appointments')}
          ><span>◷</span> Appointment management</button>
          <button
            className={`admin-nav-link ${activeView === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveView('payments')}
          ><span>₹</span> Payment management</button>
          <button
            className={`admin-nav-link ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          ><span>▥</span> Reports &amp; analytics</button>
          <button
            className={`admin-nav-link ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          ><span>⚙</span> Admin settings</button>
          {activeView === 'overview' && (
            <a className="admin-nav-link" href="#recent-bookings"><span>◷</span> Recent bookings</a>
          )}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user">
            <span className="admin-avatar">{userInfo?.name?.charAt(0)?.toUpperCase() || 'A'}</span>
            <span className="admin-user-copy">
              <strong>{userInfo?.name || 'Administrator'}</strong>
              <small>{userInfo?.email || ''}</small>
            </span>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            <span aria-hidden="true">↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">Workspace / {activeView === 'doctors'
              ? 'Doctor management'
              : activeView === 'patients'
                ? 'Patient management'
                : activeView === 'appointments'
                  ? 'Appointment management'
                  : activeView === 'payments'
                    ? 'Payment management'
                    : activeView === 'reports'
                      ? 'Reports & analytics'
                      : activeView === 'settings' ? 'Admin settings' : 'Overview'}</p>
            <h1>{activeView === 'doctors'
              ? 'Doctor Management'
              : activeView === 'patients'
                ? 'Patient Management'
                : activeView === 'appointments'
                  ? 'Appointment Management'
                  : activeView === 'payments'
                    ? 'Payment Management'
                    : activeView === 'reports'
                      ? 'Reports & Analytics'
                      : activeView === 'settings' ? 'Admin Settings' : 'Admin Dashboard'}</h1>
          </div>
          {activeView === 'overview' ? (
            <button className="admin-refresh" onClick={fetchDashboard} disabled={loading}>
              <span aria-hidden="true">↻</span> {loading ? 'Refreshing...' : 'Refresh data'}
            </button>
          ) : activeView === 'doctors' ? (
            <button className="admin-refresh" onClick={fetchDoctors} disabled={doctorsLoading}>
              <span aria-hidden="true">↻</span> {doctorsLoading ? <LoadingIndicator label="Refreshing..." /> : 'Refresh doctors'}
            </button>
          ) : activeView === 'patients' ? (
            <button className="admin-refresh" onClick={fetchPatients} disabled={patientsLoading}>
              <span aria-hidden="true">↻</span> {patientsLoading ? <LoadingIndicator label="Refreshing..." /> : 'Refresh patients'}
            </button>
          ) : activeView === 'appointments' ? (
            <button className="admin-refresh" onClick={fetchAppointments} disabled={appointmentsLoading}>
              <span aria-hidden="true">↻</span> {appointmentsLoading ? <LoadingIndicator label="Refreshing..." /> : 'Refresh appointments'}
            </button>
          ) : activeView === 'payments' ? (
            <button className="admin-refresh" onClick={fetchPayments} disabled={paymentsLoading}>
              <span aria-hidden="true">↻</span> {paymentsLoading ? <LoadingIndicator label="Refreshing..." /> : 'Refresh payments'}
            </button>
          ) : activeView === 'reports' ? (
            <button className="admin-refresh" onClick={fetchReports} disabled={reportsLoading}>
              <span aria-hidden="true">↻</span> {reportsLoading ? <LoadingIndicator label="Refreshing..." /> : 'Refresh reports'}
            </button>
          ) : (
            <button className="admin-refresh" onClick={fetchSettings} disabled={settingsLoading}>
              <span aria-hidden="true">↻</span> {settingsLoading ? <LoadingIndicator label="Refreshing..." /> : 'Refresh settings'}
            </button>
          )}
        </header>

        <section className="admin-content" id="overview">
          {activeView === 'overview' ? (
            <>
          <div className="admin-welcome">
            <div>
              <p className="admin-welcome-eyebrow">OVERVIEW</p>
              <h2>Welcome back, {userInfo?.name || 'Admin'}</h2>
              <p>Here’s what’s happening across your healthcare platform.</p>
            </div>
            <span className="admin-welcome-icon" aria-hidden="true">✚</span>
          </div>

          {error && (
            <div className="admin-error" role="alert">
              <span>{error}</span>
              <button onClick={fetchDashboard}>Try again</button>
            </div>
          )}

          <div className="admin-summary-grid" aria-busy={loading}>
            {loading ? <LoadingSkeleton variant="stat" count={summaryCards.length} label="Loading dashboard statistics" /> : summaryCards.map((card) => (
              <article className="admin-summary-card" key={card.key}>
                <span className={`admin-summary-icon ${card.tone}`} aria-hidden="true">
                  {card.icon}
                </span>
                <div>
                  <p>{card.label}</p>
                  <strong>{getCardValue(card.key)}</strong>
                </div>
              </article>
            ))}
          </div>

          <section className="admin-bookings-panel" id="recent-bookings">
            <div className="admin-panel-heading">
              <div>
                <h2>Recent Bookings</h2>
                <p>Latest appointments recorded on the platform</p>
              </div>
              <span className="admin-record-count">{bookings.length} records</span>
            </div>

            {loading ? (
              <LoadingSkeleton variant="table" count={4} label="Loading recent bookings" />
            ) : bookings.length === 0 ? (
              <div className="admin-table-message">No bookings have been recorded yet.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-bookings-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Appointment</th>
                      <th>Booking status</th>
                      <th>Payment</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>
                          <strong>{booking.patientName}</strong>
                          <small>{booking.patientEmail}</small>
                        </td>
                        <td>{booking.doctorName}</td>
                        <td>
                          <strong>{new Date(booking.date).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}</strong>
                          <small>{booking.timeSlot}</small>
                        </td>
                        <td>
                          <span className={`admin-status ${booking.status}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-payment ${booking.paymentStatus}`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td>{formatCurrency(booking.amount ?? 200)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <p className="admin-dashboard-footnote">
            Payment amounts and statuses are simulated by the demo flow and are not verified transactions. Today’s appointments use India Standard Time.
          </p>
            </>
          ) : activeView === 'doctors' ? (
            <section className="admin-bookings-panel admin-doctors-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Doctors</h2>
                  <p>Manage doctor profiles, approvals, and account access.</p>
                </div>
                <button className="admin-primary-button" onClick={() => openDoctorModal('add')}>
                  + Add doctor
                </button>
              </div>

              {doctorNotice && <div className="admin-success" role="status">{doctorNotice}</div>}
              {doctorError && (
                <div className="admin-error" role="alert">
                  <span>{doctorError}</span>
                  <button onClick={fetchDoctors}>Try again</button>
                </div>
              )}

              <div className="admin-doctor-toolbar">
                <label className="admin-search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Search name, email, phone, or specialty"
                    value={doctorSearch}
                    onChange={(event) => setDoctorSearch(event.target.value)}
                  />
                </label>
                <span className="admin-record-count">{filteredDoctors.length} doctors</span>
              </div>

              {doctorsLoading ? (
                <LoadingSkeleton variant="table" count={5} label="Loading doctors" />
              ) : filteredDoctors.length === 0 ? (
                <div className="admin-table-message">
                  {doctors.length ? 'No doctors match your search.' : 'No doctors have been added yet.'}
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-bookings-table admin-doctors-table">
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Specialization</th>
                        <th>Experience</th>
                        <th>Approval</th>
                        <th>Access</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.map((doctor) => (
                        <tr key={doctor._id}>
                          <td>
                            <strong>{doctor.name}</strong>
                            <small>{doctor.email} · {doctor.phone}</small>
                          </td>
                          <td>{doctor.specialization}<small>{doctor.qualification}</small></td>
                          <td>{doctor.experience} years</td>
                          <td><span className={`admin-doctor-status ${doctor.approvalStatus}`}>
                            {doctor.approvalStatus}
                          </span></td>
                          <td><span className={`admin-doctor-status ${doctor.isActive ? 'active' : 'inactive'}`}>
                            {doctor.isActive ? 'Active' : 'Inactive'}
                          </span></td>
                          <td>
                            <div className="admin-doctor-actions">
                              <button className="admin-action-button" onClick={() => openDoctorModal('edit', doctor)}>Edit</button>
                              {doctor.approvalStatus !== 'approved' && (
                                <button
                                  className="admin-action-button approve"
                                  onClick={() => updateDoctorState(doctor, 'approval', { approvalStatus: 'approved' }, `${doctor.name} approved.`)}
                                >Approve</button>
                              )}
                              {doctor.approvalStatus !== 'rejected' && (
                                <button
                                  className="admin-action-button reject"
                                  onClick={() => updateDoctorState(doctor, 'approval', { approvalStatus: 'rejected' }, `${doctor.name} rejected.`)}
                                >Reject</button>
                              )}
                              <button
                                className="admin-action-button"
                                onClick={() => updateDoctorState(
                                  doctor,
                                  'active',
                                  { isActive: !doctor.isActive },
                                  `${doctor.name} ${doctor.isActive ? 'deactivated' : 'activated'}.`
                                )}
                              >{doctor.isActive ? 'Deactivate' : 'Activate'}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : activeView === 'patients' ? (
            <section className="admin-bookings-panel admin-doctors-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Patients</h2>
                  <p>Review registered patient accounts and their appointment history.</p>
                </div>
                <span className="admin-record-count">{filteredPatients.length} patients</span>
              </div>

              {patientNotice && <div className="admin-success" role="status">{patientNotice}</div>}
              {patientError && (
                <div className="admin-error" role="alert">
                  <span>{patientError}</span>
                  <button onClick={fetchPatients}>Try again</button>
                </div>
              )}

              <div className="admin-doctor-toolbar">
                <label className="admin-search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Search patient name or email"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                  />
                </label>
                <span className="admin-record-count">{filteredPatients.length} patients</span>
              </div>

              {patientsLoading ? (
                <LoadingSkeleton variant="table" count={5} label="Loading patients" />
              ) : filteredPatients.length === 0 ? (
                <div className="admin-table-message">
                  {patients.length ? 'No patients match your search.' : 'No registered patients found.'}
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-bookings-table admin-patients-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Phone</th>
                        <th>Registered</th>
                        <th>Bookings</th>
                        <th>Account</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr key={patient._id}>
                          <td>
                            <strong>{patient.name}</strong>
                            <small>{patient.email}</small>
                          </td>
                          <td>{patient.phone}</td>
                          <td>{new Date(patient.createdAt).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}</td>
                          <td>{patient.bookingCount}</td>
                          <td>
                            <span className={`admin-doctor-status ${patient.isActive ? 'active' : 'inactive'}`}>
                              {patient.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-doctor-actions">
                              <button className="admin-action-button" onClick={() => openPatientDetails(patient)}>
                                View details
                              </button>
                              <button
                                className="admin-action-button"
                                disabled={patientUpdatingId === patient._id}
                                onClick={() => updatePatientAccess(patient)}
                              >
                                {patientUpdatingId === patient._id
                                  ? 'Updating...'
                                  : patient.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : activeView === 'appointments' ? (
            <section className="admin-bookings-panel admin-appointments-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Appointments</h2>
                  <p>Search, review, and manage patient bookings.</p>
                </div>
                <span className="admin-record-count">{appointments.length} appointments</span>
              </div>

              {appointmentNotice && <div className="admin-success" role="status">{appointmentNotice}</div>}
              {appointmentError && (
                <div className="admin-error" role="alert">
                  <span>{appointmentError}</span>
                  <button onClick={fetchAppointments}>Try again</button>
                </div>
              )}
              {doctorError && (
                <div className="admin-error" role="alert">
                  <span>{doctorError}</span>
                  <button onClick={fetchDoctors}>Retry doctor list</button>
                </div>
              )}

              <div className="admin-appointment-filters">
                <label className="admin-search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Search patient, doctor, or symptoms"
                    value={appointmentFilters.search}
                    onChange={(event) => setAppointmentFilters({
                      ...appointmentFilters,
                      search: event.target.value
                    })}
                  />
                </label>
                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={appointmentFilters.date}
                    onChange={(event) => setAppointmentFilters({
                      ...appointmentFilters,
                      date: event.target.value
                    })}
                  />
                </label>
                <label>
                  <span>Status</span>
                  <select
                    value={appointmentFilters.status}
                    onChange={(event) => setAppointmentFilters({
                      ...appointmentFilters,
                      status: event.target.value
                    })}
                  >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label>
                  <span>Doctor</span>
                  <select
                    value={appointmentFilters.doctorId}
                    onChange={(event) => setAppointmentFilters({
                      ...appointmentFilters,
                      doctorId: event.target.value
                    })}
                  >
                    <option value="">All doctors</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>{doctor.name}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="admin-action-button"
                  onClick={() => setAppointmentFilters({ search: '', date: '', status: '', doctorId: '' })}
                  disabled={!Object.values(appointmentFilters).some(Boolean)}
                >Clear filters</button>
              </div>

              {appointmentsLoading ? (
                <LoadingSkeleton variant="table" count={5} label="Loading appointments" />
              ) : appointments.length === 0 ? (
                <div className="admin-table-message">No appointments match these filters.</div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-bookings-table admin-appointments-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Appointment</th>
                        <th>Symptoms</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => {
                        const nextStatuses = allowedAppointmentStatuses[appointment.status] || [];
                        const draftStatus = appointmentStatusDrafts[appointment._id] || '';
                        return (
                          <tr key={appointment._id}>
                            <td>
                              <strong>{appointment.patientName}</strong>
                              <small>{appointment.patientEmail}</small>
                            </td>
                            <td>{appointment.doctorName}</td>
                            <td>
                              <strong>{new Date(appointment.date).toLocaleDateString(undefined, {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}</strong>
                              <small>{appointment.timeSlot}</small>
                            </td>
                            <td className="admin-appointment-symptoms">{appointment.symptoms}</td>
                            <td><span className={`admin-status ${appointment.status}`}>{appointment.status}</span></td>
                            <td>
                              <div className="admin-appointment-actions">
                                <button
                                  className="admin-action-button"
                                  onClick={() => setAppointmentDetails(appointment)}
                                >View details</button>
                                {nextStatuses.some((status) => status !== 'cancelled') && (
                                  <div className="admin-appointment-status-control">
                                    <select
                                      aria-label={`Update status for ${appointment.patientName}'s appointment`}
                                      value={draftStatus}
                                      onChange={(event) => setAppointmentStatusDrafts({
                                        ...appointmentStatusDrafts,
                                        [appointment._id]: event.target.value
                                      })}
                                    >
                                      <option value="">Update status...</option>
                                      {nextStatuses.filter((status) => status !== 'cancelled').map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                      ))}
                                    </select>
                                    <button
                                      className={`admin-action-button ${draftStatus === 'cancelled' ? 'reject' : 'approve'}`}
                                      disabled={!draftStatus || appointmentUpdatingId === appointment._id}
                                      onClick={() => updateAppointmentStatus(appointment)}
                                    >{appointmentUpdatingId === appointment._id ? <LoadingIndicator label="Saving..." /> : 'Update'}</button>
                                  </div>
                                )}
                                {nextStatuses.includes('cancelled') && (
                                  <button
                                    className="admin-action-button reject"
                                    disabled={appointmentUpdatingId === appointment._id}
                                    onClick={() => {
                                      if (window.confirm(`Cancel ${appointment.patientName}'s appointment with ${appointment.doctorName}?`)) {
                                        updateAppointmentStatus(appointment, 'cancelled');
                                      }
                                    }}
                                  >Cancel appointment</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : activeView === 'payments' ? (
            <section className="admin-bookings-panel admin-payments-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Simulated payment records</h2>
                  <p>These records come from the demo payment flow and do not represent verified transactions.</p>
                </div>
                <span className="admin-record-count">{payments.length} records</span>
              </div>

              <div className="admin-payment-disclaimer" role="note">
                <strong>Demo only:</strong> Payments use a dummy QR code and a simulated ₹200 fee. A “marked paid” status is not proof that money was received.
              </div>

              {paymentError && (
                <div className="admin-error" role="alert">
                  <span>{paymentError}</span>
                  <button onClick={fetchPayments}>Try again</button>
                </div>
              )}

              <div className="admin-appointment-filters">
                <label className="admin-search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    placeholder="Search patient, doctor, or booking ID"
                    value={paymentFilters.search}
                    onChange={(event) => setPaymentFilters({
                      ...paymentFilters,
                      search: event.target.value
                    })}
                  />
                </label>
                <label>
                  <span>Record date*</span>
                  <input
                    type="date"
                    value={paymentFilters.date}
                    onChange={(event) => setPaymentFilters({
                      ...paymentFilters,
                      date: event.target.value
                    })}
                  />
                </label>
                <label>
                  <span>Payment state</span>
                  <select
                    value={paymentFilters.status}
                    onChange={(event) => setPaymentFilters({
                      ...paymentFilters,
                      status: event.target.value
                    })}
                  >
                    <option value="">All states</option>
                    <option value="pending">Simulated pending</option>
                    <option value="paid">Demo marked paid</option>
                  </select>
                </label>
                <button
                  className="admin-action-button"
                  onClick={() => setPaymentFilters({ search: '', date: '', status: '' })}
                  disabled={!Object.values(paymentFilters).some(Boolean)}
                >Clear filters</button>
              </div>

              {paymentsLoading ? (
                <LoadingSkeleton variant="table" count={5} label="Loading payment records" />
              ) : payments.length === 0 ? (
                <div className="admin-table-message">No simulated payment records match these filters.</div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-bookings-table admin-payment-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Booking ID</th>
                        <th>Simulated amount</th>
                        <th>Record date*</th>
                        <th>Simulated status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td>
                            <strong>{payment.patientName}</strong>
                            <small>{payment.patientEmail}</small>
                          </td>
                          <td>{payment.doctorName}</td>
                          <td><code>{payment.bookingId}</code></td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td title="Payment timestamp is not stored; this is the booking record creation date.">
                            {new Date(payment.paymentDate).toLocaleDateString(undefined, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                            <small>Booking record date</small>
                          </td>
                          <td>
                            <span className={`admin-simulated-payment ${payment.paymentStatus}`}>
                              {payment.paymentStatus === 'paid'
                                ? 'Simulated · marked paid'
                                : 'Simulated · pending'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="admin-action-button"
                              onClick={() => openPaymentDetails(payment)}
                            >View details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="admin-payment-footnote">
                * No actual payment timestamp is stored. The date shown is when the booking record was created, not a verified payment date.
              </p>
            </section>
          ) : activeView === 'reports' ? (
            <section className="admin-reports">
              {reportsError && (
                <div className="admin-error" role="alert">
                  <span>{reportsError}</span>
                  <button onClick={fetchReports}>Try again</button>
                </div>
              )}

              {reportsLoading && !reports ? (
                <div className="admin-bookings-panel admin-table-message">Loading reports and analytics...</div>
              ) : reports ? (
                <>
                  <div className="admin-report-cards">
                    {[
                      ['Total patients', reports.totals.totalPatients, 'blue'],
                      ['Total doctors', reports.totals.totalDoctors, 'violet'],
                      ['All bookings', reports.totals.totalBookings, 'cyan'],
                      ['Completed appointments', reports.appointmentStatuses.completed, 'green'],
                      ['Cancelled appointments', reports.appointmentStatuses.cancelled, 'amber'],
                      ['Verified revenue', formatCurrency(reports.payments.verifiedRevenue), 'green']
                    ].map(([label, value, tone]) => (
                      <article className="admin-report-card" key={label}>
                        <span className={`admin-report-card-mark ${tone}`} aria-hidden="true">▦</span>
                        <div><p>{label}</p><strong>{value}</strong></div>
                      </article>
                    ))}
                  </div>

                  <div className="admin-report-chart-grid">
                    <section className="admin-bookings-panel admin-report-panel">
                      <div className="admin-panel-heading">
                        <div>
                          <h2>Daily bookings</h2>
                          <p>Bookings created per day · last 14 days · {reports.timezone}</p>
                        </div>
                      </div>
                      <div className="admin-report-bars">
                        {reports.dailyBookings.map((item) => {
                          const maximum = Math.max(...reports.dailyBookings.map((entry) => entry.count), 1);
                          return (
                            <div className="admin-report-bar-row" key={item.date}>
                              <span>{new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                              <div className="admin-report-bar-track">
                                <i style={{ width: `${item.count ? Math.max((item.count / maximum) * 100, 2) : 0}%` }} />
                              </div>
                              <strong>{item.count}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="admin-bookings-panel admin-report-panel">
                      <div className="admin-panel-heading">
                        <div>
                          <h2>Monthly bookings</h2>
                          <p>Bookings created per month · last 12 months</p>
                        </div>
                      </div>
                      <div className="admin-report-bars">
                        {reports.monthlyBookings.map((item) => {
                          const maximum = Math.max(...reports.monthlyBookings.map((entry) => entry.count), 1);
                          const [year, month] = item.month.split('-').map(Number);
                          const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                          return (
                            <div className="admin-report-bar-row" key={item.month}>
                              <span>{label}</span>
                              <div className="admin-report-bar-track">
                                <i style={{ width: `${item.count ? Math.max((item.count / maximum) * 100, 2) : 0}%` }} />
                              </div>
                              <strong>{item.count}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  <section className="admin-bookings-panel admin-report-panel admin-doctor-analytics">
                    <div className="admin-panel-heading">
                      <div>
                        <h2>Doctor-wise appointments</h2>
                        <p>Appointment totals and outcomes for each doctor</p>
                      </div>
                      <span className="admin-record-count">{reports.doctorAppointments.length} doctors</span>
                    </div>
                    {reports.doctorAppointments.length ? (
                      <div className="admin-table-wrap">
                        <table className="admin-bookings-table">
                          <thead>
                            <tr><th>Doctor</th><th>Total appointments</th><th>Completed</th><th>Cancelled</th></tr>
                          </thead>
                          <tbody>
                            {reports.doctorAppointments.map((doctor) => (
                              <tr key={doctor.doctorId || doctor.doctorName}>
                                <td><strong>{doctor.doctorName}</strong></td>
                                <td>{doctor.total}</td>
                                <td>{doctor.completed}</td>
                                <td>{doctor.cancelled}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <div className="admin-table-message">No appointment data available.</div>}
                  </section>

                  <section className="admin-bookings-panel admin-report-panel admin-payment-analytics">
                    <div className="admin-panel-heading">
                      <div>
                        <h2>Payment summary</h2>
                        <p>Verified revenue is kept separate from simulated demo values.</p>
                      </div>
                      <span className="admin-simulated-payment">SIMULATED DATA</span>
                    </div>
                    <div className="admin-payment-disclaimer" role="note">
                      <strong>No verified payment integration is configured.</strong> Demo “paid” states and the ₹200 fee are simulated only and are excluded from revenue. Verified revenue is therefore {formatCurrency(reports.payments.verifiedRevenue)}.
                    </div>
                    <div className="admin-payment-summary-grid">
                      <article><span>Verified revenue</span><strong>{formatCurrency(reports.payments.verifiedRevenue)}</strong><small>{reports.payments.verifiedPaymentCount} verified transactions</small></article>
                      <article><span>Simulated · marked paid</span><strong>{reports.payments.simulatedPaidCount}</strong><small>{formatCurrency(reports.payments.simulatedAmountMarkedPaid)} simulated amount</small></article>
                      <article><span>Simulated · pending</span><strong>{reports.payments.simulatedPendingCount}</strong><small>{formatCurrency(reports.payments.simulatedPendingAmount)} simulated amount</small></article>
                    </div>
                  </section>
                  <p className="admin-report-footnote">
                    Booking trends use booking record creation dates in {reports.timezone}. Payment amounts/statuses are simulated and are not verified transactions.
                  </p>
                </>
              ) : !reportsLoading && !reportsError ? (
                <div className="admin-bookings-panel admin-table-message">Reports are not available.</div>
              ) : null}
            </section>
          ) : (
            <section className="admin-settings">
             {settingsError && (
               <div className="admin-error" role="alert">
                 <span>{settingsError}</span>
                 <button onClick={fetchSettings}>Try again</button>
               </div>
             )}

             <div className="admin-settings-grid">
               <section className="admin-bookings-panel admin-settings-panel">
                 <div className="admin-panel-heading">
                   <div>
                     <h2>Admin profile</h2>
                     <p>Manage the name and email associated with this admin account.</p>
                   </div>
                 </div>
                 {profileNotice && <div className="admin-success" role="status">{profileNotice}</div>}
                 <form className="admin-settings-form" onSubmit={saveAdminProfile}>
                   <label>
                     <span>Full name</span>
                     <input
                       type="text"
                       autoComplete="name"
                       maxLength={100}
                       required
                       value={profileForm.name}
                       onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                     />
                   </label>
                   <label>
                     <span>Email address</span>
                     <input
                       type="email"
                       autoComplete="email"
                       maxLength={254}
                       required
                       value={profileForm.email}
                       onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                     />
                   </label>
                   <div className="admin-settings-meta">
                     <span>Admin since</span>
                     <strong>{adminProfile.createdAt
                       ? new Date(adminProfile.createdAt).toLocaleDateString(undefined, {
                         day: '2-digit',
                         month: 'long',
                         year: 'numeric'
                       })
                       : '—'}</strong>
                   </div>
                   <button className="admin-primary-button" type="submit" disabled={profileSaving || settingsLoading}>
                     {profileSaving ? <LoadingIndicator label="Saving profile..." /> : 'Save profile'}
                   </button>
                 </form>
               </section>

               <section className="admin-bookings-panel admin-settings-panel">
                 <div className="admin-panel-heading">
                   <div>
                     <h2>Change password</h2>
                     <p>Verify your current password before setting a new one.</p>
                   </div>
                 </div>
                 {passwordNotice && <div className="admin-success" role="status">{passwordNotice}</div>}
                 {passwordError && <div className="admin-error" role="alert">{passwordError}</div>}
                 <form className="admin-settings-form" onSubmit={changeAdminPassword}>
                   <label>
                     <span>Current password</span>
                     <input
                       type="password"
                       autoComplete="current-password"
                       required
                       value={passwordForm.currentPassword}
                       onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                     />
                   </label>
                   <label>
                     <span>New password (8–128 characters)</span>
                     <input
                       type="password"
                       autoComplete="new-password"
                       minLength={8}
                       maxLength={128}
                       required
                       value={passwordForm.newPassword}
                       onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                     />
                   </label>
                   <label>
                     <span>Confirm new password</span>
                     <input
                       type="password"
                       autoComplete="new-password"
                       minLength={8}
                       maxLength={128}
                       required
                       value={passwordForm.confirmPassword}
                       onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                     />
                   </label>
                   <button className="admin-primary-button" type="submit" disabled={passwordSaving}>
                     {passwordSaving ? <LoadingIndicator label="Changing password..." /> : 'Change password'}
                   </button>
                 </form>
               </section>
             </div>

             <section className="admin-bookings-panel admin-settings-panel">
               <div className="admin-panel-heading">
                 <div>
                   <h2>System information</h2>
                   <p>Live application and MongoDB status.</p>
                 </div>
                 <span className={`admin-system-status ${systemInfo?.database.status === 'connected' ? 'connected' : ''}`}>
                   {systemInfo?.database.status || (settingsLoading ? 'Checking...' : 'Unknown')}
                 </span>
               </div>
               {systemInfo ? (
                 <div className="admin-system-info-grid">
                   <div><span>Application</span><strong>{systemInfo.application}</strong></div>
                   <div><span>Environment</span><strong>{systemInfo.environment}</strong></div>
                   <div><span>Node runtime</span><strong>{systemInfo.nodeVersion}</strong></div>
                   <div><span>API version</span><strong>{systemInfo.apiVersion}</strong></div>
                   <div><span>Database</span><strong>{systemInfo.database.provider} · {systemInfo.database.status}</strong></div>
                   <div><span>Server uptime</span><strong>{Math.floor(systemInfo.uptimeSeconds / 3600)}h {Math.floor((systemInfo.uptimeSeconds % 3600) / 60)}m</strong></div>
                   <div><span>Registered patients</span><strong>{systemInfo.records.patients}</strong></div>
                   <div><span>Doctors</span><strong>{systemInfo.records.doctors}</strong></div>
                   <div><span>Bookings</span><strong>{systemInfo.records.bookings}</strong></div>
                   <div><span>Server time</span><strong>{new Date(systemInfo.serverTime).toLocaleString()}</strong></div>
                 </div>
               ) : settingsLoading ? (
                 <div className="admin-table-message">Loading system information...</div>
               ) : (
                 <div className="admin-table-message">System information is unavailable. Use Refresh settings to retry.</div>
               )}
             </section>
            </section>
          )}

          {doctorModal && (
            <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget && !doctorSaving) setDoctorModal(null);
            }}>
              <section className="admin-doctor-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-modal-title">
                <div className="admin-panel-heading">
                  <div>
                    <h2 id="doctor-modal-title">{doctorModal.mode === 'edit' ? 'Edit doctor' : 'Add doctor'}</h2>
                    <p>{doctorModal.mode === 'edit' ? 'Update doctor account details.' : 'New doctors require approval before login.'}</p>
                  </div>
                  <button className="admin-modal-close" onClick={() => setDoctorModal(null)} aria-label="Close" disabled={doctorSaving}>×</button>
                </div>
                <form className="admin-doctor-form" onSubmit={saveDoctor}>
                  {[
                    ['name', 'Full name', 'text'],
                    ['email', 'Email address', 'email'],
                    ['phone', 'Phone number', 'tel'],
                    ['specialization', 'Specialization', 'text'],
                    ['experience', 'Experience (years)', 'number'],
                    ['qualification', 'Qualification', 'text'],
                    ...(doctorModal.mode === 'add' ? [['password', 'Temporary password (8+ characters)', 'password']] : [])
                  ].map(([field, label, type]) => (
                    <label key={field}>
                      <span>{label}</span>
                      <input
                        type={type}
                        min={field === 'experience' ? '0' : undefined}
                        step={field === 'experience' ? '1' : undefined}
                        required
                        value={doctorForm[field]}
                        onChange={(event) => setDoctorForm({ ...doctorForm, [field]: event.target.value })}
                      />
                    </label>
                  ))}
                  <div className="admin-modal-actions">
                    <button type="button" className="admin-action-button" onClick={() => setDoctorModal(null)} disabled={doctorSaving}>Cancel</button>
                    <button type="submit" className="admin-primary-button" disabled={doctorSaving}>
                      {doctorSaving ? <LoadingIndicator label="Saving..." /> : doctorModal.mode === 'edit' ? 'Save changes' : 'Add doctor'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {patientDetails && (
            <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPatientDetails(null);
                setPatientDetailsError('');
              }
            }}>
              <section className="admin-patient-modal" role="dialog" aria-modal="true" aria-labelledby="patient-modal-title">
                <div className="admin-panel-heading">
                  <div>
                    <h2 id="patient-modal-title">Patient details</h2>
                    <p>Account information and booking history</p>
                  </div>
                  <button
                    className="admin-modal-close"
                    onClick={() => {
                      setPatientDetails(null);
                      setPatientDetailsError('');
                    }}
                    aria-label="Close patient details"
                  >×</button>
                </div>
                {patientDetailsError && <div className="admin-error" role="alert">{patientDetailsError}</div>}
                <div className="admin-patient-details">
                  <div><span>Name</span><strong>{patientDetails.patient.name}</strong></div>
                  <div><span>Email</span><strong>{patientDetails.patient.email}</strong></div>
                  <div><span>Phone</span><strong>{patientDetails.patient.phone}</strong></div>
                  <div><span>Registered</span><strong>{new Date(patientDetails.patient.createdAt).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}</strong></div>
                  <div><span>Account</span><strong>{patientDetails.patient.isActive ? 'Active' : 'Inactive'}</strong></div>
                </div>
                <div className="admin-patient-history-heading">
                  <div>
                    <h3>Booking history</h3>
                    <p>{patientDetails.patient.bookingCount} appointments</p>
                  </div>
                </div>
                {patientDetailsLoading ? (
                  <div className="admin-table-message">Loading patient booking history...</div>
                ) : patientDetails.bookings?.length ? (
                  <div className="admin-table-wrap">
                    <table className="admin-bookings-table">
                      <thead>
                        <tr>
                          <th>Appointment</th>
                          <th>Doctor</th>
                          <th>Patient details</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientDetails.bookings.map((booking) => (
                          <tr key={booking._id}>
                            <td>
                              <strong>{new Date(booking.date).toLocaleDateString(undefined, {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}</strong>
                              <small>{booking.timeSlot}</small>
                            </td>
                            <td>{booking.doctorName}</td>
                            <td>
                              <strong>{booking.patientAge} years · {booking.patientGender}</strong>
                              <small>{booking.patientWeight} kg</small>
                              {booking.symptoms && <small>{booking.symptoms}</small>}
                            </td>
                            <td><span className={`admin-status ${booking.status}`}>{booking.status}</span></td>
                            <td><span className={`admin-payment ${booking.paymentStatus}`}>{booking.paymentStatus}</span></td>
                            <td>{formatCurrency(booking.amount ?? 200)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : patientDetailsError ? null : (
                  <div className="admin-table-message">No appointments found for this patient.</div>
                )}
              </section>
            </div>
          )}

          {appointmentDetails && (
            <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setAppointmentDetails(null);
            }}>
              <section className="admin-patient-modal admin-appointment-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
                <div className="admin-panel-heading">
                  <div>
                    <h2 id="appointment-modal-title">Appointment details</h2>
                    <p>Booking #{appointmentDetails._id}</p>
                  </div>
                  <button
                    className="admin-modal-close"
                    onClick={() => setAppointmentDetails(null)}
                    aria-label="Close appointment details"
                  >×</button>
                </div>
                <div className="admin-patient-details">
                  <div><span>Patient</span><strong>{appointmentDetails.patientName}</strong></div>
                  <div><span>Email</span><strong>{appointmentDetails.patientEmail}</strong></div>
                  <div><span>Phone</span><strong>{appointmentDetails.patientPhone}</strong></div>
                  <div><span>Doctor</span><strong>{appointmentDetails.doctorName}</strong></div>
                  <div><span>Date and time</span><strong>
                    {new Date(appointmentDetails.date).toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })} · {appointmentDetails.timeSlot}
                  </strong></div>
                  <div><span>Status</span><strong>{appointmentDetails.status}</strong></div>
                  <div><span>Age / Gender</span><strong>{appointmentDetails.patientAge} / {appointmentDetails.patientGender}</strong></div>
                  <div><span>Weight</span><strong>{appointmentDetails.patientWeight} kg</strong></div>
                  <div><span>Payment</span><strong>
                    {appointmentDetails.paymentStatus} · {formatCurrency(appointmentDetails.amount ?? 200)}
                  </strong></div>
                  <div className="admin-appointment-symptom-detail">
                    <span>Symptoms</span>
                    <strong>{appointmentDetails.symptoms || 'No symptoms provided.'}</strong>
                  </div>
                </div>
              </section>
            </div>
          )}

          {paymentDetails && (
            <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPaymentDetails(null);
                setPaymentDetailsError('');
              }
            }}>
              <section className="admin-patient-modal admin-payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
                <div className="admin-panel-heading">
                  <div>
                    <h2 id="payment-modal-title">Simulated payment details</h2>
                    <p>Booking #{paymentDetails.bookingId || paymentDetails._id}</p>
                  </div>
                  <button
                    className="admin-modal-close"
                    onClick={() => {
                      setPaymentDetails(null);
                      setPaymentDetailsError('');
                    }}
                    aria-label="Close payment details"
                  >×</button>
                </div>
                {paymentDetailsError && <div className="admin-error" role="alert">{paymentDetailsError}</div>}
                <div className="admin-payment-disclaimer" role="note">
                  <strong>Not a verified transaction.</strong> This project uses a dummy QR code and simulated payment state. No payment processor confirmation or transaction receipt is available.
                </div>
                {paymentDetailsLoading ? (
                  <div className="admin-table-message">Loading payment details...</div>
                ) : (
                  <div className="admin-patient-details">
                    <div><span>Patient</span><strong>{paymentDetails.patientName}</strong></div>
                    <div><span>Patient email</span><strong>{paymentDetails.patientEmail}</strong></div>
                    {paymentDetails.patientPhone && <div><span>Phone</span><strong>{paymentDetails.patientPhone}</strong></div>}
                    <div><span>Doctor</span><strong>{paymentDetails.doctorName}</strong></div>
                    <div><span>Booking ID</span><strong>{paymentDetails.bookingId || paymentDetails._id}</strong></div>
                    <div><span>Simulated amount</span><strong>{formatCurrency(paymentDetails.amount)}</strong></div>
                    <div><span>Simulated payment state</span><strong>
                      {paymentDetails.paymentStatus === 'paid' ? 'Marked paid in demo flow' : 'Pending in demo flow'}
                    </strong></div>
                    <div><span>Appointment</span><strong>
                      {new Date(paymentDetails.appointmentDate).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })} · {paymentDetails.timeSlot}
                    </strong></div>
                    <div><span>Appointment status</span><strong>{paymentDetails.appointmentStatus}</strong></div>
                    <div><span>Record created</span><strong>
                      {new Date(paymentDetails.paymentDate).toLocaleString()}
                    </strong></div>
                    {paymentDetails.symptoms && (
                      <div className="admin-appointment-symptom-detail">
                        <span>Symptoms</span><strong>{paymentDetails.symptoms}</strong>
                      </div>
                    )}
                  </div>
                )}
                <p className="admin-payment-footnote">
                  The record creation timestamp is shown because the Booking model does not store a payment timestamp. It must not be interpreted as payment verification.
                </p>
              </section>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
