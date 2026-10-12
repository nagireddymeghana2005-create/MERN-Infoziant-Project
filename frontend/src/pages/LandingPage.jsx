import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { apiUrl } from '../api';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');

  const fetchDoctors = useCallback(async (signal) => {
    setDoctorsLoading(true);
    setDoctorsError('');
    try {
      const response = await fetch(apiUrl('/api/doctor/public'), { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load our doctors.');
      setDoctors(data);
    } catch (error) {
      if (error.name !== 'AbortError') setDoctorsError(error.message);
    } finally {
      if (!signal?.aborted) setDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDoctors(controller.signal);
    return () => controller.abort();
  }, [fetchDoctors]);

  const handlePatientLogin = () => navigate('/patient/login');
  const handleBookAppointment = () => navigate('/patient/login');
  const handleMenuLink = () => setIsMenuOpen(false);
  const specializations = [...new Set(doctors.map((doctor) => doctor.specialization).filter(Boolean))];

  return (
    <div className="landing-page">
      <nav className="landing-navbar">
        <div className="landing-nav-inner">
          <button className="landing-brand" onClick={() => navigate('/')} aria-label="Doc-Connect home">
            <span className="landing-brand-mark" aria-hidden="true">✚</span>
            <span className="landing-brand-copy">
              <strong>DOC-CONNECT</strong>
              <small>BETTER CARE. TOGETHER.</small>
            </span>
          </button>

          <div className="landing-nav-links">
            <a href="#home" className="landing-nav-link active">Home</a>
            <a href="#about" className="landing-nav-link">About Us</a>
            <a href="#services" className="landing-nav-link">Services</a>
            <a href="#doctors" className="landing-nav-link">Doctors</a>
            <a href="#how-it-works" className="landing-nav-link">How it works</a>
            <a href="#contact" className="landing-nav-link">Contact</a>
          </div>

          <div className="landing-nav-actions">
            <button onClick={handlePatientLogin} className="landing-login-button">Login</button>
            <button onClick={handleBookAppointment} className="landing-book-button">Book Appointment</button>
          </div>

          <button
            className={`landing-menu-toggle ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        <div className={`landing-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <a href="#home" onClick={handleMenuLink}>Home</a>
          <a href="#about" onClick={handleMenuLink}>About Us</a>
          <a href="#services" onClick={handleMenuLink}>Services</a>
          <a href="#doctors" onClick={handleMenuLink}>Doctors</a>
          <a href="#how-it-works" onClick={handleMenuLink}>How it works</a>
          <a href="#contact" onClick={handleMenuLink}>Contact</a>
          <button onClick={handlePatientLogin}>Login</button>
          <button onClick={handleBookAppointment}>Book Appointment</button>
        </div>
      </nav>

      <section className="landing-hero" id="home">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">YOUR HEALTH <span /> OUR PRIORITY</p>
          <h1>Healthcare,<br />connected to <em>you.</em></h1>
          <p className="landing-hero-description">
            Find trusted doctors, manage your appointments, and access quality care — all in one place,
            with confidence and ease.
          </p>
          <div className="landing-hero-actions">
            <button onClick={handleBookAppointment} className="landing-primary-action">
              <span aria-hidden="true">▦</span> Book an Appointment <span aria-hidden="true">→</span>
            </button>
            <a href="#about" className="landing-secondary-action">
              Learn More <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="landing-hero-image" role="img" aria-label="Doctor ready to help you manage your healthcare" />
      </section>

      <section className="landing-benefits" aria-label="DocConnect benefits">
        <div><span aria-hidden="true">♧</span> Trusted care teams</div>
        <div><span aria-hidden="true">▦</span> Easy appointment management</div>
        <div><span aria-hidden="true">♡</span> Patient-first experience</div>
        <div><span aria-hidden="true">♙</span> Secure access</div>
      </section>

      <section className="landing-portals" id="portals">
        <div className="landing-section-heading">
          <p className="landing-eyebrow centered"><span /> GET STARTED</p>
          <h2>Access your DocConnect portal</h2>
          <p>Choose your role and sign in to access your personalized dashboard.</p>
        </div>
        <div className="landing-portal-grid">
          <button className="landing-portal-card patient" onClick={handlePatientLogin}>
            <span className="landing-portal-icon" aria-hidden="true">♙</span>
            <strong>Patient Portal</strong>
            <span>Book appointments, view your records,<br />manage your health journey.</span>
            <b>Sign in <i aria-hidden="true">→</i></b>
          </button>
          <button className="landing-portal-card doctor" onClick={() => navigate('/doctor/login')}>
            <span className="landing-portal-icon" aria-hidden="true">⚕</span>
            <strong>Doctor Portal</strong>
            <span>Manage appointments, patient details,<br />and your schedule.</span>
            <b>Sign in <i aria-hidden="true">→</i></b>
          </button>
          <button className="landing-portal-card admin" onClick={() => navigate('/admin/login')}>
            <span className="landing-portal-icon" aria-hidden="true">▥</span>
            <strong>Hospital Admin Portal</strong>
            <span>Oversee operations, manage staff,<br />and ensure smooth healthcare delivery.</span>
            <b>Sign in <i aria-hidden="true">→</i></b>
          </button>
        </div>
      </section>

      <section className="services-section" id="services">
        <div className="container">
          <p className="landing-eyebrow centered"><span /> CARE THAT CONNECTS</p>
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">Explore the specialties offered by our approved doctors.</p>
          <div className="services-grid">
            {doctorsLoading ? (
              <LoadingSkeleton variant="specialty" count={3} label="Loading doctor specialties" />
            ) : doctorsError ? (
              <div className="landing-doctors-message landing-doctors-error" role="alert">
                <span>{doctorsError}</span>
                <button type="button" onClick={() => fetchDoctors()}>Try again</button>
              </div>
            ) : specializations.length ? specializations.map((specialization) => (
              <article className="service-card" key={specialization}>
                <div className="service-icon" aria-hidden="true">⚕</div>
                <h3>{specialization}</h3>
                <p>Find an approved {specialization.toLowerCase()} doctor and request an appointment through your patient portal.</p>
              </article>
            )) : (
              <p className="landing-doctors-message">Specialties will appear here when approved doctors are available.</p>
            )}
          </div>
        </div>
      </section>

      <section className="why-us-section" id="about">
        <div className="container">
          <p className="landing-eyebrow centered"><span /> THE DOC-CONNECT DIFFERENCE</p>
          <h2 className="section-title">Why Choose Us?</h2>
          <p className="section-subtitle">Thoughtful tools to make finding care and managing appointments simpler.</p>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-number">01</div>
              <h3>Expert Doctors</h3>
              <p>Highly qualified and experienced medical professionals</p>
            </div>
            <div className="why-card">
              <div className="why-number">02</div>
              <h3>Care in One Place</h3>
              <p>Keep appointment details and status together in one convenient patient portal.</p>
            </div>
            <div className="why-card">
              <div className="why-number">03</div>
              <h3>Simple Scheduling</h3>
              <p>Browse available doctors and appointment times before choosing what works for you.</p>
            </div>
            <div className="why-card">
              <div className="why-number">04</div>
              <h3>Connected Care Teams</h3>
              <p>Patients and clinicians can manage appointment information through their own portals.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="doctors-section" id="doctors">
        <div className="container">
          <p className="landing-eyebrow centered"><span /> MEET YOUR CARE TEAM</p>
          <h2 className="section-title">Our Expert Doctors</h2>
          <p className="section-subtitle">Explore our approved clinicians and choose the right care for you.</p>
          <div className="doctors-grid">
            {doctorsLoading ? (
              <LoadingSkeleton variant="doctor" count={3} label="Loading approved doctors" />
            ) : doctorsError ? (
              <div className="landing-doctors-message landing-doctors-error" role="alert">
                <span>{doctorsError}</span>
                <button type="button" onClick={() => fetchDoctors()}>Try again</button>
              </div>
            ) : doctors.length ? doctors.map((doctor) => (
              <article className="doctor-card" key={doctor._id}>
                <div className="doctor-avatar" aria-hidden="true">⚕</div>
                <h3>{doctor.name}</h3>
                <p>{doctor.specialization}</p>
                {doctor.qualification && <p>{doctor.qualification}</p>}
                {Number.isFinite(doctor.experience) && (
                  <p className="doctor-exp">{doctor.experience} {doctor.experience === 1 ? 'year' : 'years'} experience</p>
                )}
                <button className="landing-doctor-action" onClick={handleBookAppointment}>
                  Book appointment <span aria-hidden="true">→</span>
                </button>
              </article>
            )) : (
              <p className="landing-doctors-message">No approved doctors are available right now. Please check back soon.</p>
            )}
          </div>
        </div>
      </section>

      <section className="landing-how-it-works" id="how-it-works">
        <div className="container">
          <p className="landing-eyebrow centered"><span /> A CLEARER PATH TO CARE</p>
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">Three simple steps to get your appointment organized.</p>
          <div className="landing-steps-grid">
            <article className="landing-step-card">
              <span>01</span>
              <h3>Sign in to your portal</h3>
              <p>Create or access your patient account to get started securely.</p>
            </article>
            <article className="landing-step-card">
              <span>02</span>
              <h3>Choose a doctor and time</h3>
              <p>Review doctors and available appointment slots that fit your needs.</p>
            </article>
            <article className="landing-step-card">
              <span>03</span>
              <h3>Track your appointment</h3>
              <p>Return to your dashboard to check appointment details and status.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="container">
          <h2 className="section-title">Contact Us</h2>
          <p className="section-subtitle">Choose the right portal to manage your Doc-Connect account.</p>
          <div className="contact-grid">
            <div className="contact-info">
              <h3>Account access</h3>
              <p>Patients can manage bookings from the patient portal. Doctors and administrators can sign in to their respective workspaces.</p>
              <div className="landing-contact-links">
                <button type="button" onClick={handlePatientLogin}>Patient login <span aria-hidden="true">→</span></button>
                <button type="button" onClick={() => navigate('/doctor/login')}>Doctor login <span aria-hidden="true">→</span></button>
                <button type="button" onClick={() => navigate('/admin/login')}>Admin login <span aria-hidden="true">→</span></button>
              </div>
            </div>
            <div className="contact-form landing-contact-cta">
              <span className="landing-contact-icon" aria-hidden="true">♡</span>
              <h3>Ready to get started?</h3>
              <p>Sign in to find a doctor, book an appointment, and keep your care details in one place.</p>
              <button type="button" className="btn btn-primary" onClick={handleBookAppointment}>Book an Appointment</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <div className="footer-logo">
                <span className="logo-icon">🏥</span>
                <span className="logo-text">DOC-CONNECT</span>
              </div>
              <p>A connected place to discover doctors and manage appointments.</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <a href="#home">Home</a>
              <a href="#about">About Us</a>
              <a href="#services">Services</a>
              <a href="#how-it-works">How it works</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-section">
              <h3>Explore</h3>
              <a href="#doctors">Doctors</a>
              <a href="#how-it-works">How it works</a>
              <a href="#contact">Account access</a>
            </div>
            <div className="footer-section">
              <h3>Portals</h3>
              <a href="/patient/login">Patient login</a>
              <a href="/doctor/login">Doctor login</a>
              <a href="/admin/login">Admin login</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} DOC-CONNECT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
