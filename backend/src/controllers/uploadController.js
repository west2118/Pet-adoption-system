import { uploadImage } from '../services/storageService.js';
import { sendSuccess } from '../utils/respond.js';
import { AppError } from '../utils/AppError.js';

const ALLOWED_FOLDERS = new Set(['pets', 'shelters']);

/**
 * POST /uploads — multipart form with `image` (file) and `folder`
 * (`pets` | `shelters`). Returns the public URL to store in the database.
 */
export const uploadImageHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Attach an image file in the `image` field.', 400);
    }
    const folder = String(req.body?.folder ?? '').trim();
    if (!ALLOWED_FOLDERS.has(folder)) {
      throw new AppError('folder must be `pets` or `shelters`.', 400);
    }

    const url = await uploadImage({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname,
      folder,
    });

    return sendSuccess(res, { url }, 'Image uploaded.');
  } catch (error) {
    return next(error);
  }
};
