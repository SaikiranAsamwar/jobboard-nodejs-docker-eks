import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './Profile.css';

function Profile({ userEmail, userType, onLogout }) {
  const [userData, setUserData] = useState(null);
  const [applications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail,
    phone: '',
    location: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
          email: data.email || userEmail,
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || ''
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setUserData(updatedData);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" fill="url(#avatarGradient)" />
                <circle cx="40" cy="32" r="12" fill="white" />
                <path d="M20 65c0-11 9-20 20-20s20 9 20 20" fill="white" />
                <defs>
                  <linearGradient id="avatarGradient" x1="0" y1="0" x2="80" y2="80">
                    <stop offset="0%" stopColor="#4A90E2" />
                    <stop offset="100%" stopColor="#87CEEB" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h3>{formData.name || userEmail}</h3>
            <p className="user-type-badge">
              {userType === 'recruiter' ? 'Recruiter' : 'Job Seeker'}
            </p>
            <p className="member-since">
              Member since {formatDate(userData?.createdAt)}
            </p>
            <div className="profile-actions">
              {editing ? null : (
                <button className="btn-edit-profile" onClick={() => setEditing(true)}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M13 2l3 3-9 9H4v-3l9-9z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Edit Profile
                </button>
              )}
              <button className="btn-logout" onClick={onLogout}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M7 16H3a2 2 0 01-2-2V4a2 2 0 012-2h4M12 12l4-4-4-4M16 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="profile-main">
          {editing ? (
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="form-section">
                <h2>Personal Information</h2>
                
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State/Country"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    rows="4"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="profile-view">
              <div className="info-section">
                <h2>Personal Information</h2>
                
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <p>{formData.name || 'Not provided'}</p>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Email Address</span>
                    <p>{formData.email}</p>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Phone Number</span>
                    <p>{formData.phone || 'Not provided'}</p>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <p>{formData.location || 'Not provided'}</p>
                  </div>

                  <div className="info-item full-width">
                    <span className="info-label">Bio</span>
                    <p>{formData.bio || 'No bio added yet'}</p>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Account Type</span>
                    <p className="account-type">
                      <span className={`type-badge ${userType}`}>
                        {userType === 'recruiter' ? 'Recruiter Account' : 'Job Seeker Account'}
                      </span>
                    </p>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Account Status</span>
                    <p>
                      <span className="status-badge active">Active</span>
                    </p>
                  </div>
                </div>
              </div>

              {userType === 'jobseeker' && (
                <div className="info-section">
                  <h2>Application History</h2>
                  <div className="applications-list">
                    {applications.length === 0 ? (
                      <div className="empty-state">
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                          <circle cx="30" cy="30" r="28" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                          <path d="M30 20v15M30 40h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <p>No applications yet</p>
                        <span>Your job applications will appear here</span>
                      </div>
                    ) : (
                      applications.map(app => (
                        <div key={app.id} className="application-item">
                          <h4>{app.job.title}</h4>
                          <p>{app.job.company}</p>
                          <span className={`app-status ${app.status}`}>{app.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Profile.propTypes = {
  userEmail: PropTypes.string.isRequired,
  userType: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default Profile;
