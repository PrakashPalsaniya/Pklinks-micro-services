import { z } from 'zod';

export const createLinkSchema = z.object({
  originalUrl: z.string().url('Invalid URL — must include scheme (http:// or https://)'),
  title: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  customAlias: z.string()
    .min(3, 'Custom alias must be at least 3 characters')
    .max(40, 'Custom alias cannot exceed 40 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/, 'Invalid custom alias — alphanumeric/hyphens/underscores only')
    .optional(),
});

export const updateLinkSchema = z.object({
  originalUrl: z.string().url('Invalid URL — must include scheme (http:// or https://)').optional(),
  title: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});
