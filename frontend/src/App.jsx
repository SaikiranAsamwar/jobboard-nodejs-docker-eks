import React, { useEffect, useState } from 'react';
import Jobs from './pages/Jobs.jsx';
import Login from './pages/login.jsx';
import './App.css';

export default function App(){
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('jobs');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    setIsLoggedIn(!!token);
    setUserEmail(email || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserEmail('');
    setCurrentView('jobs');
  };

  const handleLoginSuccess = (email) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('userEmail', email);
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch(currentView) {
      case 'jobs':
        return <Jobs />;
      case 'profile':
        return (
          <div className="content-section">
            <div className="container">
              <h2 className="mb-4"><i className="bi bi-person-circle me-3"></i>My Profile</h2>
              <div className="row">
                <div className="col-lg-4 mb-4">
                  <div className="card shadow-lg">
                    <div className="card-body text-center p-5">
                      <div className="mb-4">
                        <i className="bi bi-person-circle" style={{fontSize: '100px', color: '#667eea'}}></i>
                      </div>
                      <h4 className="mb-2">{userEmail}</h4>
                      <p className="text-muted mb-4">Job Seeker</p>
                      <div className="d-grid gap-2">
                        <button className="btn btn-outline-primary">
                          <i className="bi bi-pencil me-2"></i>Edit Profile
                        </button>
                        <button className="btn btn-outline-danger" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-8 mb-4">
                  <div className="card shadow-lg mb-4">
                    <div className="card-header bg-white">
                      <h5 className="mb-0"><i className="bi bi-info-circle me-2"></i>Profile Information</h5>
                    </div>
                    <div className="card-body p-4">
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <strong><i className="bi bi-envelope me-2"></i>Email:</strong>
                        </div>
                        <div className="col-md-8">
                          {userEmail}
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <strong><i className="bi bi-calendar me-2"></i>Member Since:</strong>
                        </div>
                        <div className="col-md-8">
                          November 2025
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <strong><i className="bi bi-shield-check me-2"></i>Account Status:</strong>
                        </div>
                        <div className="col-md-8">
                          <span className="badge bg-success">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card shadow-lg">
                    <div className="card-header bg-white">
                      <h5 className="mb-0"><i className="bi bi-file-earmark-text me-2"></i>Application History</h5>
                    </div>
                    <div className="card-body p-4">
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Your application history will appear here once you apply to jobs.
                      </div>
                      <button className="btn btn-primary" onClick={() => setCurrentView('jobs')}>
                        <i className="bi bi-briefcase me-2"></i>Browse Jobs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="content-section">
            <div className="container">
              <h2 className="mb-4">About JobBoard Pro</h2>
              <div className="card shadow-lg">
                <div className="card-body p-5">
                  <p className="lead">Welcome to JobBoard Pro - your gateway to finding the perfect career opportunity!</p>
                  <hr className="my-4" />
                  <h4 className="mb-3">Our Mission</h4>
                  <p>We connect talented professionals with amazing companies. Our platform makes job searching simple, efficient, and effective.</p>
                  
                  <h4 className="mt-4 mb-3">Why Choose Us?</h4>
                  <ul className="list-unstyled">
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Curated job listings from top companies</li>
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Easy application process</li>
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Real-time job updates</li>
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Career growth opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="content-section">
            <div className="container">
              <h2 className="mb-4">Contact Us</h2>
              <div className="row">
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-lg h-100">
                    <div className="card-body p-5">
                      <h4 className="mb-4">Get In Touch</h4>
                      <div className="mb-3">
                        <i className="bi bi-envelope-fill text-primary me-3"></i>
                        <strong>Email:</strong> support@jobboardpro.com
                      </div>
                      <div className="mb-3">
                        <i className="bi bi-telephone-fill text-primary me-3"></i>
                        <strong>Phone:</strong> +1 (555) 123-4567
                      </div>
                      <div className="mb-3">
                        <i className="bi bi-geo-alt-fill text-primary me-3"></i>
                        <strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105
                      </div>
                      <div className="mt-4">
                        <h5>Follow Us</h5>
                        <div className="d-flex gap-3 mt-3">
                          <a href="#" className="btn btn-outline-primary btn-lg"><i className="bi bi-linkedin"></i></a>
                          <a href="#" className="btn btn-outline-primary btn-lg"><i className="bi bi-twitter"></i></a>
                          <a href="#" className="btn btn-outline-primary btn-lg"><i className="bi bi-facebook"></i></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-lg h-100">
                    <div className="card-body p-5">
                      <h4 className="mb-4">Send us a message</h4>
                      <form>
                        <div className="mb-3">
                          <input type="text" className="form-control" placeholder="Your Name" required />
                        </div>
                        <div className="mb-3">
                          <input type="email" className="form-control" placeholder="Your Email" required />
                        </div>
                        <div className="mb-3">
                          <textarea className="form-control" rows="4" placeholder="Your Message" required></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Send Message</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Jobs />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" style={{cursor: 'pointer'}} onClick={() => setCurrentView('jobs')}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="url(#gradient)" />
              <path d="M12 16h16M12 24h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
            <span>JobBoard Pro</span>
          </div>
          <nav className="nav">
            {isLoggedIn && (
              <>
                <a 
                  href="#jobs" 
                  className={currentView === 'jobs' ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); setCurrentView('jobs'); }}
                >
                  <i className="bi bi-briefcase me-1"></i>Jobs
                </a>
                <a 
                  href="#about"
                  className={currentView === 'about' ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); setCurrentView('about'); }}
                >
                  <i className="bi bi-info-circle me-1"></i>About
                </a>
                <a 
                  href="#contact"
                  className={currentView === 'contact' ? 'active' : ''}
                  onClick={(e) => { e.preventDefault(); setCurrentView('contact'); }}
                >
                  <i className="bi bi-envelope me-1"></i>Contact
                </a>
                <div 
                  className="user-info" 
                  style={{cursor: 'pointer'}}
                  onClick={() => setCurrentView('profile')}
                  title="View Profile"
                >
                  <i className="bi bi-person-circle me-2"></i>
                  <span>{userEmail || 'User'}</span>
                </div>
                <button className="btn-secondary" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-1"></i>Logout
                </button>
              </>
            )}
            {!isLoggedIn && (
              <span className="text-white">Please login to continue</span>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {renderContent()}
      </main>

      <footer className="app-footer">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-0">© 2025 JobBoard Pro. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <a href="#" className="text-white text-decoration-none me-3">Privacy Policy</a>
              <a href="#" className="text-white text-decoration-none">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
