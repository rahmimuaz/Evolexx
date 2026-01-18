// backend/controllers/settingsController.js

import Settings from '../models/Settings.js';

/**
 * Get hero video settings
 * @route GET /api/settings/hero-video
 * @access Public (can be made private if needed)
 */
export const getHeroVideo = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'heroVideo' });
    
    // If no settings exist, return default values
    if (!settings) {
      return res.status(200).json({
        key: 'heroVideo',
        value: {
          videoUrl: '/hero-video.mp4',
          webmUrl: '/hero-video.webm',
          mobileVideoUrl: '',
          mobileWebmUrl: '',
          enabled: true
        }
      });
    }
    
    // Convert Mongoose document to plain object for JSON response
    const settingsObj = settings.toObject ? settings.toObject() : settings;
    res.status(200).json(settingsObj);
  } catch (error) {
    console.error('Error fetching hero video settings:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

/**
 * Update hero video settings
 * @route PUT /api/settings/hero-video
 * @access Private (admin only)
 */
export const updateHeroVideo = async (req, res) => {
  try {
    const { videoUrl, webmUrl, mobileVideoUrl, mobileWebmUrl, enabled } = req.body;
    
    // Handle uploaded video files from Cloudinary (files take priority over URLs)
    let desktopVideoUrl = null;
    let desktopWebmUrl = null;
    let mobileVidUrl = null;
    let mobileWebm = null;
    
    // Check for uploaded video files (from multer) - these take priority
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fieldname = file.fieldname || '';
        const cloudinaryUrl = file.path; // Cloudinary URL from multer
        
        // Map file fields to settings
        if (fieldname === 'desktopVideo') {
          desktopVideoUrl = cloudinaryUrl;
        } else if (fieldname === 'desktopWebm') {
          desktopWebmUrl = cloudinaryUrl;
        } else if (fieldname === 'mobileVideo') {
          mobileVidUrl = cloudinaryUrl;
        } else if (fieldname === 'mobileWebm') {
          mobileWebm = cloudinaryUrl;
        }
      });
    }
    
    // If no file was uploaded for a field, use the URL from body (if provided)
    if (!desktopVideoUrl && videoUrl) {
      desktopVideoUrl = videoUrl;
    }
    if (!desktopWebmUrl && webmUrl) {
      desktopWebmUrl = webmUrl;
    }
    if (!mobileVidUrl && mobileVideoUrl) {
      mobileVidUrl = mobileVideoUrl;
    }
    if (!mobileWebm && mobileWebmUrl) {
      mobileWebm = mobileWebmUrl;
    }
    
    // Parse enabled from FormData (might be string 'true'/'false') or JSON
    let enabledValue = enabled;
    if (enabled !== undefined && typeof enabled === 'string') {
      enabledValue = enabled === 'true' || enabled === '1';
    }
    
    // Validate input - check if we have at least one video URL or file
    const hasAnyInput = desktopVideoUrl || desktopWebmUrl || mobileVidUrl || 
                       mobileWebm || enabledValue !== undefined || 
                       (req.files && req.files.length > 0);
    
    if (!hasAnyInput) {
      return res.status(400).json({ message: 'At least one field must be provided.' });
    }
    
    // Get existing settings or create new object
    let settings = await Settings.findOne({ key: 'heroVideo' });
    
    // Handle Mongoose Mixed type - convert to plain object
    const settingsValue = settings && settings.value 
      ? (typeof settings.value === 'object' && settings.value.constructor === Object 
          ? { ...settings.value } 
          : JSON.parse(JSON.stringify(settings.value)))
      : {};
    
    // Update only provided fields
    if (desktopVideoUrl !== null) settingsValue.videoUrl = desktopVideoUrl;
    if (desktopWebmUrl !== null) settingsValue.webmUrl = desktopWebmUrl;
    if (mobileVidUrl !== null) settingsValue.mobileVideoUrl = mobileVidUrl;
    if (mobileWebm !== null) settingsValue.mobileWebmUrl = mobileWebm;
    if (enabledValue !== undefined) settingsValue.enabled = enabledValue;
    
    // Save or update settings
    if (settings) {
      settings.value = settingsValue;
      await settings.save();
    } else {
      settings = new Settings({
        key: 'heroVideo',
        value: settingsValue
      });
      await settings.save();
    }
    
    res.status(200).json({
      message: 'Hero video settings updated successfully',
      settings: settings
    });
  } catch (error) {
    console.error('Error updating hero video settings:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};
