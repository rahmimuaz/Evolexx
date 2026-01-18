import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './HeroVideoManager.css';

const HeroVideoManager = () => {
  const [settings, setSettings] = useState({
    videoUrl: '',
    webmUrl: '',
    enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    fetchHeroVideoSettings();
  }, []);

  const fetchHeroVideoSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/settings/hero-video`);
      
      if (response.data && response.data.value) {
        setSettings({
          videoUrl: response.data.value.videoUrl || '/hero-video.mp4',
          webmUrl: response.data.value.webmUrl || '/hero-video.webm',
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings.videoUrl && !settings.webmUrl) {
      setMessage({ type: 'error', text: 'Please provide at least one video URL (MP4 or WebM).' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.put(
        `${API_BASE_URL}/api/settings/hero-video`,
        {
          videoUrl: settings.videoUrl || undefined,
          webmUrl: settings.webmUrl || undefined,
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

          {/* Video Preview */}
          {settings.videoUrl && (
            <div className="form-field-group">
              <label className="modern-label">Preview</label>
              <div className="video-preview-container">
                <video
                  className="video-preview"
                  controls
                  muted
                  preload="metadata"
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
              disabled={saving || !settings.videoUrl}
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
