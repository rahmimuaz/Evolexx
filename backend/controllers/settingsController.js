// backend/controllers/settingsController.js

import Settings from '../models/Settings.js';
import cloudinary from '../config/cloudinary.js';

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
    const { enabled } = req.body;
    
    // Handle uploaded video files from Cloudinary
    let desktopVideoUrl = null;
    let mobileVidUrl = null;
    
    // Check for uploaded video files (from multer)
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const fieldname = file.fieldname || '';
        const cloudinaryUrl = file.path; // Cloudinary URL from multer
        
        // Map file fields to settings
        if (fieldname === 'desktopVideo') {
          desktopVideoUrl = cloudinaryUrl;
        } else if (fieldname === 'mobileVideo') {
          mobileVidUrl = cloudinaryUrl;
        }
      });
    }
    
    // Parse enabled from FormData (might be string 'true'/'false') or JSON
    let enabledValue = enabled;
    if (enabled !== undefined && typeof enabled === 'string') {
      enabledValue = enabled === 'true' || enabled === '1';
    }
    
    // Validate input - check if we have at least one video file or enabled setting
    const hasAnyInput = desktopVideoUrl || mobileVidUrl || enabledValue !== undefined || 
                       (req.files && req.files.length > 0);
    
    if (!hasAnyInput) {
      return res.status(400).json({ message: 'At least one video file must be uploaded or enabled setting provided.' });
    }
    
    // Get existing settings or create new object
    let settings = await Settings.findOne({ key: 'heroVideo' });
    
    // Handle Mongoose Mixed type - convert to plain object
    const settingsValue = settings && settings.value 
      ? (typeof settings.value === 'object' && settings.value.constructor === Object 
          ? { ...settings.value } 
          : JSON.parse(JSON.stringify(settings.value)))
      : {};
    
    // Update only provided fields (only update if file was uploaded)
    if (desktopVideoUrl !== null) settingsValue.videoUrl = desktopVideoUrl;
    if (mobileVidUrl !== null) settingsValue.mobileVideoUrl = mobileVidUrl;
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

/**
 * Delete hero video (desktop or mobile)
 * @route DELETE /api/settings/hero-video/:type
 * @access Private (admin only)
 * @param {string} type - 'desktop' or 'mobile'
 */
export const deleteHeroVideo = async (req, res) => {
  try {
    const { type } = req.params; // 'desktop' or 'mobile'
    
    if (!['desktop', 'mobile'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Must be "desktop" or "mobile".' });
    }

    // Get existing settings
    let settings = await Settings.findOne({ key: 'heroVideo' });
    
    if (!settings || !settings.value) {
      return res.status(404).json({ message: 'Hero video settings not found.' });
    }

    const settingsValue = typeof settings.value === 'object' && settings.value.constructor === Object 
      ? { ...settings.value } 
      : JSON.parse(JSON.stringify(settings.value));

    // Determine which URL to delete
    let videoUrlToDelete = null;
    let fieldToClear = null;

    if (type === 'desktop') {
      videoUrlToDelete = settingsValue.videoUrl;
      fieldToClear = 'videoUrl';
    } else if (type === 'mobile') {
      videoUrlToDelete = settingsValue.mobileVideoUrl;
      fieldToClear = 'mobileVideoUrl';
    }

    // Delete video from Cloudinary if it's a Cloudinary URL
    if (videoUrlToDelete && videoUrlToDelete.includes('cloudinary.com')) {
      try {
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/video/upload/v{version}/hero-videos/{filename}.mp4
        // Public ID format: hero-videos/{filename} (without version and extension)
        const urlParts = videoUrlToDelete.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        
        if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
          // Get parts after 'upload'
          const partsAfterUpload = urlParts.slice(uploadIndex + 1);
          
          // Find the folder index (should be 'hero-videos')
          const folderIndex = partsAfterUpload.findIndex(part => part === 'hero-videos');
          
          if (folderIndex !== -1 && folderIndex < partsAfterUpload.length - 1) {
            // Get filename (last part, without extension)
            const filenameWithExt = partsAfterUpload[partsAfterUpload.length - 1];
            const filename = filenameWithExt.split('.')[0];
            
            // Construct public_id: hero-videos/filename
            const publicId = `hero-videos/${filename}`;
            
            console.log(`Attempting to delete Cloudinary video with public_id: ${publicId} from URL: ${videoUrlToDelete}`);
            const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
            console.log(`Cloudinary deletion result:`, result);
            
            if (result.result === 'ok') {
              console.log(`Cloudinary: Successfully deleted video ${publicId}`);
            } else {
              console.warn(`Cloudinary: Deletion returned result: ${result.result}`);
            }
          } else {
            console.warn('Could not find "hero-videos" folder in URL:', videoUrlToDelete);
          }
        } else {
          console.warn('Could not find "upload" in Cloudinary URL:', videoUrlToDelete);
        }
      } catch (cloudinaryError) {
        console.error(`Cloudinary: Failed to delete video. Error:`, cloudinaryError);
        // Continue even if Cloudinary deletion fails - still clear the URL from database
      }
    }

    // Clear the video URL in settings
    settingsValue[fieldToClear] = '';

    // Update settings
    settings.value = settingsValue;
    await settings.save();

    res.status(200).json({
      message: `${type} hero video deleted successfully`,
      settings: settings
    });
  } catch (error) {
    console.error('Error deleting hero video:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};
