import { z } from 'zod';

export const createShelterSchema = z.object({
  name: z.string().min(1, 'Shelter name is required').max(255),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required').max(50),
  email: z.string().email('Invalid email format'),
  operatingHours: z.string().min(1, 'Operating hours are required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  imageUrl: z.string().url('Invalid image URL format'),
  // Optional precise coordinates; when omitted the backend derives the city centre.
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
});

export const updateShelterSchema = createShelterSchema.partial();
