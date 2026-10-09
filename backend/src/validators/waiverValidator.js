import { z } from 'zod';

export const createWaiverTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  category: z.string().min(1, 'Category is required').max(100).default('Adoption'),
  body: z.string().min(10, 'Waiver text must be at least 10 characters'),
  status: z.enum(['Active', 'Draft']).default('Active'),
});

export const updateWaiverTemplateSchema = createWaiverTemplateSchema.partial();

export const generateWaiverSchema = z.object({
  templateIds: z.array(z.string().uuid('Invalid template ID format')).min(1, 'Select at least one template'),
});
