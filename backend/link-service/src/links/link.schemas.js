import { z } from 'zod';

// only allow real web links — blocks javascript:, data:, file: etc.
const httpUrl = z.string()
  .url('Invalid URL — must include scheme (http:// or https://)')
  .refine((val) => /^https?:\/\//i.test(val), 'URL must start with http:// or https://');

export const createLinkSchema = z.object({
  originalUrl: httpUrl,
  title: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  customAlias: z.string()
    .min(3, 'Custom alias must be at least 3 characters')
    .max(40, 'Custom alias cannot exceed 40 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/, 'Invalid custom alias — alphanumeric/hyphens/underscores only')
    .optional(),
});

export const updateLinkSchema = z.object({
  originalUrl: httpUrl.optional(),
  title: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});
