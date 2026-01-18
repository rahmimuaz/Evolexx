import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './HeroVideoManager.css';

const HeroVideoManager = () => {
  const [settings, setSettings] = useState({
    videoUrl: '',
    webmUrl: '',
    mobileVideoUrl: '',
    mobileWebmUrl: '',
    enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [previewError, setPreviewError] = useState(false);
  const videoRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchHeroVideoSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload video when URLs change
  useEffect(() => {
    if (videoRef.current && settings.videoUrl) {
      videoRef.current.load();
    }
  }, [settings.videoUrl, settings.webmUrl]);

  const fetchHeroVideoSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/settings/hero-video`);
      
      if (response.data && response.data.value) {
        setSettings({
          videoUrl: response.data.value.videoUrl || '/hero-video.mp4',
          webmUrl: response.data.value.webmUrl || '/hero-video.webm',
          mobileVideoUrl: response.data.value.mobileVideoUrl || '',
          mobileWebmUrl: response.data.value.mobileWebmUrl || '',
          enabled: response.data.value.enabled !== false
        });
      }
    } catch (error) {
      console.error('Error fetching hero video settings:', error);
      setMessage({ type: 'error', text: 'Failed to load hero video settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setMessage({ type: '', text: '' }); // Clear message on change
    setPreviewError(false); // Clear preview error when URL changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings.videoUrl && !settings.mobileVideoUrl) {
      setMessage({ type: 'error', text: 'Please provide at least one desktop or mobile video URL.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_BASE_URL}/api/settings/hero-video`,
        {
          videoUrl: settings.videoUrl || undefined,
          webmUrl: settings.webmUrl || undefined,
          mobileVideoUrl: settings.mobileVideoUrl || undefined,
          mobileWebmUrl: settings.mobileWebmUrl || undefined,
          enabled: settings.enabled
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setMessage({ type: 'success', text: 'Hero video settings updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error updating hero video settings:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update hero video settings.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
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
        <p className="page-subtitle">Manage the hero section video on your homepage</p>
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

          {/* MP4 Video URL */}
          <div className="form-field-group">
            <label className="modern-label">
              MP4 Video URL <span className="required-star">*</span>
            </label>
            <input
              type="text"
              name="videoUrl"
              value={settings.videoUrl}
              onChange={handleInputChange}
              className="modern-input"
              placeholder="/hero-video.mp4 or https://example.com/video.mp4"
              required
            />
            <small className="field-hint">
              Enter the path or URL to your MP4 video file (required for most browsers)
            </small>
          </div>

          {/* WebM Video URL */}
          <div className="form-field-group">
            <label className="modern-label">
              WebM Video URL (Optional)
            </label>
            <input
              type="text"
              name="webmUrl"
              value={settings.webmUrl}
              onChange={handleInputChange}
              className="modern-input"
              placeholder="/hero-video.webm or https://example.com/video.webm"
            />
            <small className="field-hint">
              Optional: WebM format for better compression (browsers will use this if available)
            </small>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
              Mobile Video (Optional)
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Set a separate video for mobile devices. If not set, desktop video will be used on mobile.
            </p>

            {/* Mobile MP4 Video URL */}
            <div className="form-field-group">
              <label className="modern-label">
                Mobile MP4 Video URL
              </label>
              <input
                type="text"
                name="mobileVideoUrl"
                value={settings.mobileVideoUrl}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="/hero-video-mobile.mp4 or https://example.com/video-mobile.mp4"
              />
              <small className="field-hint">
                Optional: Separate MP4 video for mobile devices (screens smaller than 768px)
              </small>
            </div>

            {/* Mobile WebM Video URL */}
            <div className="form-field-group">
              <label className="modern-label">
                Mobile WebM Video URL (Optional)
              </label>
              <input
                type="text"
                name="mobileWebmUrl"
                value={settings.mobileWebmUrl}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="/hero-video-mobile.webm or https://example.com/video-mobile.webm"
              />
              <small className="field-hint">
                Optional: WebM format for mobile video (better compression)
              </small>
            </div>
          </div>

          {/* Video Preview */}
          {settings.videoUrl && (
            <div className="form-field-group">
              <label className="modern-label">Preview</label>
              <div className="video-preview-container">
                {previewError && settings.videoUrl.startsWith('http') && (
                  <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center', 
                    color: '#ef4444',
                    background: '#fee2e2',
                    borderRadius: '8px',
                    border: '1px solid #f87171'
                  }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>Could not load video preview.</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Please check if the URL is correct and accessible.</p>
                  </div>
                )}
                <video
                  key={`${settings.videoUrl}-${settings.webmUrl || ''}`}
                  ref={videoRef}
                  className="video-preview"
                  controls
                  muted
                  preload="auto"
                  style={{ display: previewError && settings.videoUrl.startsWith('http') ? 'none' : 'block' }}
                  onError={(e) => {
                    // Only show error for full URLs (http/https) as relative paths are expected to fail in admin preview
                    if (settings.videoUrl.startsWith('http')) {
                      console.error('Video preview error for URL:', settings.videoUrl);
                      setPreviewError(true);
                    } else {
                      // For relative paths, this is expected - they work on client but not in admin preview
                      console.log('Relative path video preview unavailable (this is expected)');
                    }
                  }}
                  onLoadedData={() => {
                    setPreviewError(false);
                  }}
                >
                  {settings.videoUrl && (
                    <source src={settings.videoUrl} type="video/mp4" />
                  )}
                  {settings.webmUrl && (
                    <source src={settings.webmUrl} type="video/webm" />
                  )}
                  Your browser does not support the video tag.
                </video>
              </div>
              <small className="field-hint">
                This is a preview of how the video will appear (controls are for preview only)
              </small>
              {!settings.videoUrl.startsWith('http') && (
                <small className="field-hint" style={{ display: 'block', marginTop: '0.5rem', color: '#6b7280', fontStyle: 'italic' }}>
                  Note: Relative paths (like <code>/hero-video.mp4</code>) work on your homepage but may not preview here. Use a full URL (http://...) for preview.
                </small>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="info-box">
            <h3>Instructions:</h3>
            <ul>
              <li>You can use relative paths (e.g., <code>/hero-video.mp4</code>) for videos in your public folder</li>
              <li>Or use full URLs (e.g., <code>https://example.com/video.mp4</code>) for external videos</li>
              <li>MP4 format is required and works in all modern browsers</li>
              <li>WebM format is optional but provides better compression</li>
              <li>Make sure your video files are optimized for web (compressed, reasonable file size)</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || (!settings.videoUrl && !settings.mobileVideoUrl)}
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} /> Save Settings
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
