import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PatientLogin from './pages/patient/PatientLogin';
import ForgotPassword from './pages/patient/ForgotPassword';
import ResetPassword from './pages/patient/ResetPassword';
import PatientRegister from './pages/patient/PatientRegister';
import PatientProfile from './pages/patient/PatientProfile';
import PatientDashboard from './pages/patient/PatientDashboard';
import Home from './pages/patient/Home';
import Bookings from './pages/patient/Bookings';
import Payment from './pages/patient/Payment';
import Status from './pages/patient/Status';
import Contact from './pages/patient/Contact';
import DoctorLogin from './pages/doctor/DoctorLogin';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorHome from './pages/doctor/DoctorHome';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatientDetails from './pages/doctor/DoctorPatientDetails';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <div className="route-transition" key={location.pathname}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/forgot-password" element={<ForgotPassword />} />
        <Route path="/patient/reset-password/:token" element={<ResetPassword />} />
        <Route path="/patient/register" element={<PatientRegister />} />
        <Route path="/patient/home" element={<Home />} />
        <Route path="/patient/profile" element={<PatientProfile />} />
        <Route path="/patient/bookings" element={<Bookings />} />
        <Route path="/patient/payment" element={<Payment />} />
        <Route path="/patient/status" element={<Status />} />
        <Route path="/patient/contact" element={<Contact />} />
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/home" element={<DoctorHome />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/appointments/:appointmentId" element={<DoctorPatientDetails />} />
        <Route path="/doctor/profile" element={<DoctorProfile />} />
        <Route path="/doctor/schedule" element={<DoctorSchedule />} />
        <Route path="/doctor/dashboard" element={<Navigate to="/doctor/home" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
