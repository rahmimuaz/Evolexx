// backend/middleware/uploadVideo.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure Cloudinary storage for videos
const cloudinaryVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hero-videos',
    allowedFormats: ['mp4', 'webm', 'mov', 'avi'],
    resource_type: 'video',
    // Cloudinary video transformations (optional)
    // transformation: [{ quality: 'auto:good' }],
  },
});

// Use Cloudinary storage for videos
const uploadVideo = multer({ 
  storage: cloudinaryVideoStorage,
  fileFilter: function (req, file, cb) {
    // Check file type - allow video formats
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  }
});

console.log('✅ Using Cloudinary for video uploads');

export default uploadVideo;
