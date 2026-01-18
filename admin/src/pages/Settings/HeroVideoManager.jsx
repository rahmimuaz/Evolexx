import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faSave, faSpinner, faTrash } from '@fortawesome/free-solid-svg-icons';
import './HeroVideoManager.css';

const HeroVideoManager = () => {
  const [settings, setSettings] = useState({
    videoUrl: '',
    mobileVideoUrl: '',
    enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState({ desktop: false, mobile: false });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [videoFiles, setVideoFiles] = useState({
    desktopVideo: null,
    mobileVideo: null
  });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchHeroVideoSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHeroVideoSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/settings/hero-video`);
      
      // Handle different response formats
      let videoData = null;
      
      // Check if value exists and is an object
      if (response.data && response.data.value) {
        // Handle Mongoose Mixed type - could be object or already parsed
        if (typeof response.data.value === 'object' && response.data.value !== null) {
          videoData = response.data.value;
        } else {
          // Try to parse if it's a string
          try {
            videoData = typeof response.data.value === 'string' 
              ? JSON.parse(response.data.value) 
              : response.data.value;
          } catch (e) {
            // Failed to parse - use empty data
          }
        }
      } else if (response.data && (response.data.videoUrl || response.data.mobileVideoUrl)) {
        // If response.data is the settings object directly
        videoData = response.data;
      }
      
      // Always update settings, even if URLs are empty (to show enabled state)
      const newSettings = {
        videoUrl: (videoData && videoData.videoUrl) ? String(videoData.videoUrl).trim() : '',
        mobileVideoUrl: (videoData && videoData.mobileVideoUrl) ? String(videoData.mobileVideoUrl).trim() : '',
        enabled: videoData ? (videoData.enabled !== false) : true
      };
      
      setSettings(newSettings);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load hero video settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : ''
    }));
    setMessage({ type: '', text: '' });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (file) {
      setVideoFiles(prev => ({
        ...prev,
        [name]: file
      }));
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if we have at least one video
    const hasDesktopVideo = settings.videoUrl || videoFiles.desktopVideo;
    const hasMobileVideo = settings.mobileVideoUrl || videoFiles.mobileVideo;
    
    if (!hasDesktopVideo && !hasMobileVideo) {
      setMessage({ type: 'error', text: 'Please upload at least one video (desktop or mobile).' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      // Append video files
      if (videoFiles.desktopVideo) formData.append('desktopVideo', videoFiles.desktopVideo);
      if (videoFiles.mobileVideo) formData.append('mobileVideo', videoFiles.mobileVideo);
      
      formData.append('enabled', settings.enabled);
      
      await axios.put(
        `${API_BASE_URL}/api/settings/hero-video`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage({ type: 'success', text: 'Hero video settings updated successfully!' });
      
      // Clear file inputs after successful upload
      setVideoFiles({
        desktopVideo: null,
        mobileVideo: null
      });
      
      // Reset file input elements
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });
      
      // Refresh settings to show uploaded Cloudinary URLs
      fetchHeroVideoSettings();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update hero video settings.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type) => {
    if (!window.confirm(`Are you sure you want to delete the ${type} video? This action cannot be undone and will free up Cloudinary storage space.`)) {
      return;
    }

    setDeleting(prev => ({ ...prev, [type]: true }));
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(
        `${API_BASE_URL}/api/settings/hero-video/${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage({ type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} video deleted successfully!` });
      
      // Refresh settings
      fetchHeroVideoSettings();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to delete ${type} video.`;
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setDeleting(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading hero video settings...</p>
      </div>
    );
  }

  return (
    <div className="hero-video-manager">
      <div className="page-header">
        <h1 className="page-title">
          <FontAwesomeIcon icon={faVideo} /> Hero Video Manager
        </h1>
        <p className="page-subtitle">Upload and manage hero section videos</p>
      </div>

      <div className="settings-card">
        <form onSubmit={handleSubmit} className="hero-video-form">
          {/* Status Message */}
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Enable/Disable Toggle */}
          <div className="form-field-group">
            <label className="modern-label checkbox-label">
              <input
                type="checkbox"
                name="enabled"
                checked={settings.enabled}
                onChange={handleInputChange}
                className="modern-checkbox"
              />
              <span className="checkbox-text">
                Enable Hero Video
              </span>
            </label>
            <small className="field-hint">
              Toggle to show or hide the hero video on the homepage
            </small>
          </div>

          {/* Desktop Video Section */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                Desktop Video (Larger Screens)
              </h3>
              {settings.videoUrl && settings.videoUrl.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => handleDelete('desktop')}
                  disabled={deleting.desktop}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: deleting.desktop ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <FontAwesomeIcon icon={deleting.desktop ? faSpinner : faTrash} spin={deleting.desktop} />
                  {deleting.desktop ? 'Deleting...' : 'Delete Video'}
                </button>
              )}
            </div>

            {settings.videoUrl && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Current Desktop Video:</strong>
                  <br />
                  <a href={settings.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1', wordBreak: 'break-all' }}>
                    {settings.videoUrl}
                  </a>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <video 
                    src={settings.videoUrl} 
                    controls 
                    style={{ width: '100%', maxWidth: '500px', borderRadius: '6px', background: '#000' }}
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            <div className="form-field-group">
              <label className="modern-label">
                Upload Desktop Video <span className="required-star">*</span>
              </label>
              <input
                type="file"
                name="desktopVideo"
                accept="video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="modern-input"
              />
              <small className="field-hint">
                Upload MP4 video file (max 100MB). Video will be stored on Cloudinary.
              </small>
            </div>
          </div>

          {/* Mobile Video Section */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                Mobile Video (Smaller Screens - Optional)
              </h3>
              {settings.mobileVideoUrl && settings.mobileVideoUrl.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => handleDelete('mobile')}
                  disabled={deleting.mobile}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: deleting.mobile ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <FontAwesomeIcon icon={deleting.mobile ? faSpinner : faTrash} spin={deleting.mobile} />
                  {deleting.mobile ? 'Deleting...' : 'Delete Video'}
                </button>
              )}
            </div>

            {settings.mobileVideoUrl && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Current Mobile Video:</strong>
                  <br />
                  <a href={settings.mobileVideoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1', wordBreak: 'break-all' }}>
                    {settings.mobileVideoUrl}
                  </a>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <video 
                    src={settings.mobileVideoUrl} 
                    controls 
                    style={{ width: '100%', maxWidth: '500px', borderRadius: '6px', background: '#000' }}
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            <div className="form-field-group">
              <label className="modern-label">
                Upload Mobile Video
              </label>
              <input
                type="file"
                name="mobileVideo"
                accept="video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="modern-input"
              />
              <small className="field-hint">
                Optional: Upload separate MP4 video for mobile devices (max 100MB). If not set, desktop video will be used on mobile.
              </small>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || (!settings.videoUrl && !settings.mobileVideoUrl && !videoFiles.desktopVideo && !videoFiles.mobileVideo)}
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Uploading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} /> Save Videos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HeroVideoManager;
