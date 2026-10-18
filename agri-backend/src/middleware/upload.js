const multer = require('multer');
const path = require('path');
const { ValidationError } = require('../utils/errors');

const storage = multer.memoryStorage();
const allowedExtensions = new Set(['.jpeg', '.jpg', '.jfif', '.png', '.gif', '.webp']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype.toLowerCase())) {
    return cb(null, true);
  }
  cb(new ValidationError('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const singleImage = (field) => (req, res, next) => {
  upload.single(field)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new ValidationError('Image must be 5MB or smaller'));
    }
    if (error instanceof ValidationError) return next(error);
    return next(new ValidationError(error.message || 'Invalid image upload'));
  });
};

const uploadProductImage = singleImage('image');
const uploadProfilePicture = singleImage('profilePicture');

module.exports = { uploadProductImage, uploadProfilePicture };
