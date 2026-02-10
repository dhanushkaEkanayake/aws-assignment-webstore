/**
 * Multer File Upload Configuration
 * ----------------------------------
 * Configures Multer for handling product image uploads.
 * - Stores files in memory (buffer) for direct S3 upload
 * - Validates file type (images only)
 * - Limits file size to 5MB
 */

const multer = require('multer');
const path = require('path');

// Use memory storage so files can be streamed directly to S3
const storage = multer.memoryStorage();

// File filter: only allow image files
function fileFilter(req, file, cb) {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

module.exports = upload;
