import React, { useEffect, useState } from 'react';
import './Jobs.css';

export default function Jobs(){
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    applicantName: '',
    applicantEmail: '',
    resumeLink: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => { 
    fetch((import.meta.env.VITE_API_URL || '/api') + '/jobs')
      .then(r => r.json())
      .then(data => {
        setJobs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleApplyClick = (job, e) => {
    e.stopPropagation();
    setSelectedJob(job);
    setShowApplicationForm(true);
    setSubmitSuccess(false);
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);
    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/jobs/${selectedJob.id}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applicationData)
        }
      );

      if (response.ok) {
        setSubmitSuccess(true);
        setApplicationData({ applicantName: '', applicantEmail: '', resumeLink: '' });
        setValidated(false);
        setTimeout(() => {
          setShowApplicationForm(false);
          setSelectedJob(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Application error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setShowApplicationForm(false);
    setSubmitSuccess(false);
    setApplicationData({ applicantName: '', applicantEmail: '', resumeLink: '' });
    setValidated(false);
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="jobs-loading">
        <div className="spinner"></div>
        <p>Loading amazing opportunities...</p>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      <div className="jobs-header">
        <h2>Find Your Dream Job</h2>
        <p>Discover {jobs.length} exciting opportunities waiting for you</p>
        
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input 
            type="text"
            placeholder="Search jobs by title, location, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="no-jobs">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M40 25v20M40 55h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <h3>No jobs found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map((job, index) => (
            <div 
              key={job.id} 
              className="job-card"
              style={{animationDelay: `${index * 0.1}s`}}
              onClick={() => setSelectedJob(job)}
            >
              <div className="job-card-header">
                <div className="job-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <span className="job-badge">New</span>
              </div>

              <h3 className="job-title">{job.title}</h3>
              
              {job.location && (
                <div className="job-location">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor"/>
                    <path d="M8 1a5.5 5.5 0 0 0-5.5 5.5c0 2.5 3 6.5 5.5 9 2.5-2.5 5.5-6.5 5.5-9A5.5 5.5 0 0 0 8 1z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  {job.location}
                </div>
              )}

              {job.description && (
                <p className="job-description">
                  {job.description.length > 120 
                    ? job.description.substring(0, 120) + '...' 
                    : job.description}
                </p>
              )}

              <div className="job-card-footer">
                <button 
                  className="btn-apply"
                  onClick={(e) => handleApplyClick(job, e)}
                >
                  Apply Now
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Form Modal */}
      {selectedJob && showApplicationForm && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content application-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>✕</button>
            
            {submitSuccess ? (
              <div className="success-message">
                <div className="success-icon">
                  <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                    <circle cx="30" cy="30" r="28" stroke="#10b981" strokeWidth="2"/>
                    <path d="M17 30l8 8 18-18" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2>Application Submitted!</h2>
                <p>We've received your application for <strong>{selectedJob.title}</strong>.</p>
                <p>We'll review it and get back to you soon.</p>
              </div>
            ) : (
              <>
                <h2>Apply for {selectedJob.title}</h2>
                {selectedJob.location && (
                  <div className="modal-location">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                      <path d="M8 8.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor"/>
                      <path d="M8 1a5.5 5.5 0 0 0-5.5 5.5c0 2.5 3 6.5 5.5 9 2.5-2.5 5.5-6.5 5.5-9A5.5 5.5 0 0 0 8 1z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    {selectedJob.location}
                  </div>
                )}

                <form onSubmit={handleApplicationSubmit} className={`application-form needs-validation ${validated ? 'was-validated' : ''}`} noValidate>
                  <div className="mb-3">
                    <label htmlFor="applicantName" className="form-label">Full Name *</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-person"></i></span>
                      <input
                        id="applicantName"
                        type="text"
                        className="form-control"
                        placeholder="John Doe"
                        value={applicationData.applicantName}
                        onChange={(e) => setApplicationData({...applicationData, applicantName: e.target.value})}
                        required
                        minLength="2"
                      />
                      <div className="invalid-feedback">
                        Please enter your full name (at least 2 characters).
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="applicantEmail" className="form-label">Email Address *</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                      <input
                        id="applicantEmail"
                        type="email"
                        className="form-control"
                        placeholder="john@example.com"
                        value={applicationData.applicantEmail}
                        onChange={(e) => setApplicationData({...applicationData, applicantEmail: e.target.value})}
                        required
                      />
                      <div className="invalid-feedback">
                        Please provide a valid email address.
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="resumeLink" className="form-label">Resume/Portfolio Link *</label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="bi bi-link-45deg"></i></span>
                      <input
                        id="resumeLink"
                        type="url"
                        className="form-control"
                        placeholder="https://linkedin.com/in/johndoe"
                        value={applicationData.resumeLink}
                        onChange={(e) => setApplicationData({...applicationData, resumeLink: e.target.value})}
                        required
                      />
                      <div className="invalid-feedback">
                        Please provide a valid URL (must start with http:// or https://).
                      </div>
                    </div>
                    <small className="form-text text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Please provide a link to your resume, LinkedIn, or portfolio
                    </small>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg w-100 btn-submit-application"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Application
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
