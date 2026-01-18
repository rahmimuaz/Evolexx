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
  const [videoFiles, setVideoFiles] = useState({
    desktopVideo: null,
    desktopWebm: null,
    mobileVideo: null,
    mobileWebm: null
  });
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
          videoUrl: response.data.value.videoUrl || '',
          webmUrl: response.data.value.webmUrl || '',
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
    
    // Check if we have at least one video (URL or file)
    const hasDesktopVideo = settings.videoUrl || videoFiles.desktopVideo;
    const hasMobileVideo = settings.mobileVideoUrl || videoFiles.mobileVideo;
    
    if (!hasDesktopVideo && !hasMobileVideo) {
      setMessage({ type: 'error', text: 'Please provide at least one desktop or mobile video (upload file or enter URL).' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('authToken');
      
      // Use FormData if files are being uploaded, otherwise use JSON
      const hasFiles = videoFiles.desktopVideo || videoFiles.desktopWebm || 
                       videoFiles.mobileVideo || videoFiles.mobileWebm;
      
      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Append video files
        if (videoFiles.desktopVideo) formData.append('desktopVideo', videoFiles.desktopVideo);
        if (videoFiles.desktopWebm) formData.append('desktopWebm', videoFiles.desktopWebm);
        if (videoFiles.mobileVideo) formData.append('mobileVideo', videoFiles.mobileVideo);
        if (videoFiles.mobileWebm) formData.append('mobileWebm', videoFiles.mobileWebm);
        
        // Append URL fields (if no file is uploaded for that field, use URL)
        if (!videoFiles.desktopVideo && settings.videoUrl) formData.append('videoUrl', settings.videoUrl);
        if (!videoFiles.desktopWebm && settings.webmUrl) formData.append('webmUrl', settings.webmUrl);
        if (!videoFiles.mobileVideo && settings.mobileVideoUrl) formData.append('mobileVideoUrl', settings.mobileVideoUrl);
        if (!videoFiles.mobileWebm && settings.mobileWebmUrl) formData.append('mobileWebmUrl', settings.mobileWebmUrl);
        
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
      } else {
        // Use JSON if no files (URLs only)
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
      }

      setMessage({ type: 'success', text: 'Hero video settings updated successfully!' });
      
      // Clear file inputs after successful upload
      setVideoFiles({
        desktopVideo: null,
        desktopWebm: null,
        mobileVideo: null,
        mobileWebm: null
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

          {/* Desktop Video Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
              Desktop Video (Larger Screens)
            </h3>

            {/* Desktop MP4 Video - File Upload */}
            <div className="form-field-group">
              <label className="modern-label">
                Desktop MP4 Video (Upload to Cloudinary) <span className="required-star">*</span>
              </label>
              <input
                type="file"
                name="desktopVideo"
                accept="video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="modern-input"
              />
              <small className="field-hint">
                Upload MP4 video file (max 100MB). Videos are stored on Cloudinary.
              </small>
            </div>

            {/* Desktop MP4 Video - URL (Alternative) */}
            <div className="form-field-group">
              <label className="modern-label">
                Desktop MP4 Video URL (Alternative - if not uploading file)
              </label>
              <input
                type="text"
                name="videoUrl"
                value={settings.videoUrl}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="https://res.cloudinary.com/.../video/upload/... or https://example.com/video.mp4"
                disabled={!!videoFiles.desktopVideo}
              />
              <small className="field-hint">
                Or enter Cloudinary URL or external video URL (disabled when file is selected)
              </small>
            </div>

            {/* Desktop WebM Video - File Upload */}
            <div className="form-field-group">
              <label className="modern-label">
                Desktop WebM Video (Upload to Cloudinary - Optional)
              </label>
              <input
                type="file"
                name="desktopWebm"
                accept="video/webm"
                onChange={handleFileChange}
                className="modern-input"
              />
              <small className="field-hint">
                Optional: Upload WebM video file for better compression
              </small>
            </div>

            {/* Desktop WebM Video - URL (Alternative) */}
            <div className="form-field-group">
              <label className="modern-label">
                Desktop WebM Video URL (Alternative - if not uploading file)
              </label>
              <input
                type="text"
                name="webmUrl"
                value={settings.webmUrl}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="https://res.cloudinary.com/.../video/upload/... or https://example.com/video.webm"
                disabled={!!videoFiles.desktopWebm}
              />
              <small className="field-hint">
                Or enter Cloudinary URL or external video URL (disabled when file is selected)
              </small>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
              Mobile Video (Optional)
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Set a separate video for mobile devices. If not set, desktop video will be used on mobile.
            </p>

            {/* Mobile MP4 Video - File Upload */}
            <div className="form-field-group">
              <label className="modern-label">
                Mobile MP4 Video (Upload to Cloudinary - Optional)
              </label>
              <input
                type="file"
                name="mobileVideo"
                accept="video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="modern-input"
              />
              <small className="field-hint">
                Optional: Upload separate MP4 video for mobile devices (max 100MB)
              </small>
            </div>

            {/* Mobile MP4 Video - URL (Alternative) */}
            <div className="form-field-group">
              <label className="modern-label">
                Mobile MP4 Video URL (Alternative - if not uploading file)
              </label>
              <input
                type="text"
                name="mobileVideoUrl"
                value={settings.mobileVideoUrl}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="https://res.cloudinary.com/.../video/upload/... or https://example.com/video-mobile.mp4"
                disabled={!!videoFiles.mobileVideo}
              />
              <small className="field-hint">
                Or enter Cloudinary URL or external video URL (disabled when file is selected)
              </small>
            </div>

            {/* Mobile WebM Video - File Upload */}
            <div className="form-field-group">
              <label className="modern-label">
                Mobile WebM Video (Upload to Cloudinary - Optional)
              </label>
              <input
                type="file"
                name="mobileWebm"
                accept="video/webm"
                onChange={handleFileChange}
                className="modern-input"
              />
              <small className="field-hint">
                Optional: Upload WebM format for mobile video (better compression)
              </small>
            </div>

            {/* Mobile WebM Video - URL (Alternative) */}
            <div className="form-field-group">
              <label className="modern-label">
                Mobile WebM Video URL (Alternative - if not uploading file)
              </label>
              <input
                type="text"
                name="mobileWebmUrl"
                value={settings.mobileWebmUrl}
                onChange={handleInputChange}
                className="modern-input"
                placeholder="https://res.cloudinary.com/.../video/upload/... or https://example.com/video-mobile.webm"
                disabled={!!videoFiles.mobileWebm}
              />
              <small className="field-hint">
                Or enter Cloudinary URL or external video URL (disabled when file is selected)
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
              <li><strong>Upload Video Files:</strong> Use the file upload inputs to upload videos directly to Cloudinary (recommended). Maximum file size: 100MB per video.</li>
              <li><strong>Use Cloudinary URLs:</strong> If you already have videos on Cloudinary, paste the Cloudinary URL in the URL fields.</li>
              <li><strong>External URLs:</strong> You can also use external video URLs (e.g., <code>https://example.com/video.mp4</code>).</li>
              <li><strong>Format:</strong> MP4 is required for desktop. WebM is optional but provides better compression.</li>
              <li><strong>Mobile Videos:</strong> Optionally set separate videos for mobile devices (screens smaller than 768px).</li>
              <li><strong>Note:</strong> When you upload a file, it replaces any existing URL for that field. The file is uploaded to Cloudinary and the URL is automatically saved.</li>
            </ul>
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
