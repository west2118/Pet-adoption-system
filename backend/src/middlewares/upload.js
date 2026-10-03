import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WebP) are allowed.', 400));
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});
