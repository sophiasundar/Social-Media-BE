const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Define storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image'; // Detect file type
    return {
      folder: 'social-media-posts',
      allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'gif'], // Allowed formats
      resource_type: resourceType, // Explicitly set resource type for videos
    };
  },
});


// Set up multer with Cloudinary storage and file size limit
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Max file size 100MB
});

// Export upload
module.exports = upload;
