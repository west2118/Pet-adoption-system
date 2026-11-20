/**
 * The upload endpoint stores raster images only, so every file picker uses the
 * same `accept` list and the same client-side check (PDFs, DOCX, SVG, … are
 * rejected before a request is made).
 */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

const ALLOWED_IMAGE_TYPES = new Set(IMAGE_ACCEPT.split(','));

// Some browsers report an empty MIME type for a picked file; fall back to the
// extension so a valid photo is not rejected.
const ALLOWED_IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif)$/i;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPE_MESSAGE = 'Please select a JPEG, PNG, WebP or GIF image.';
export const IMAGE_SIZE_MESSAGE = 'Image must be 5MB or smaller.';

export const isAllowedImageFile = (file: File): boolean =>
  ALLOWED_IMAGE_TYPES.has(file.type) ||
  (file.type === '' && ALLOWED_IMAGE_EXTENSION.test(file.name));
