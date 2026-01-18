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
    
    // Validate input
    if (videoUrl === undefined && webmUrl === undefined && mobileVideoUrl === undefined && mobileWebmUrl === undefined && enabled === undefined) {
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
    if (videoUrl !== undefined) settingsValue.videoUrl = videoUrl;
    if (webmUrl !== undefined) settingsValue.webmUrl = webmUrl;
    if (mobileVideoUrl !== undefined) settingsValue.mobileVideoUrl = mobileVideoUrl;
    if (mobileWebmUrl !== undefined) settingsValue.mobileWebmUrl = mobileWebmUrl;
    if (enabled !== undefined) settingsValue.enabled = enabled;
    
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
