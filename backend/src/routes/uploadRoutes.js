import { Router } from 'express';
import multer from 'multer';
import { uploadImageHandler } from '../controllers/uploadController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { uploadImage as receiveImageFile } from '../middlewares/upload.js';
import { AppError } from '../utils/AppError.js';

/**
 * JPEG/PNG/WebP/GIF only, max 5MB (see middlewares/upload.js). Multer's own errors are
 * translated so clients get a readable 400 instead of a 500.
 */
const receiveImage = (req, res, next) => {
  receiveImageFile.single('image')(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Image must be 5MB or smaller.'
          : 'Invalid image upload.';
      return next(new AppError(message, 400));
    }
    return next(error);
  });
};

export const uploadRoutes = Router();

// Onboarding tokens and full sessions are both accepted, so a shelter can
// upload its logo before the application is approved.
uploadRoutes.post('/', authenticate, receiveImage, uploadImageHandler);
