import { z } from 'zod';

// Reserved codes that would collide with real routes/paths.
const RESERVED_ALIASES = new Set([
  'api', 'health', 'admin', 'auth', 'login', 'signup', 'logout',
  'dashboard', 'links', 'analytics', 'reset-password', 'forgot-password',
]);

// Block hosts that resolve to internal/link-local ranges (basic SSRF guard).
const isBlockedHost = (host) => {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h === '0.0.0.0' || h === '::1' || h.endsWith('.localhost')) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // cloud metadata
  }
  return false;
};

// only allow real web links — blocks javascript:, data:, file: etc.
const httpUrl = z.string()
  .url('Invalid URL — must include scheme (http:// or https://)')
  .refine((val) => /^https?:\/\//i.test(val), 'URL must start with http:// or https://')
  .refine((val) => {
    try { return !isBlockedHost(new URL(val).hostname); }
    catch { return false; }
  }, 'URL points to a disallowed internal address');

export const createLinkSchema = z.object({
  originalUrl: httpUrl,
  title: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  customAlias: z.string()
    .min(3, 'Custom alias must be at least 3 characters')
    .max(40, 'Custom alias cannot exceed 40 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_]*$/, 'Invalid custom alias — alphanumeric/hyphens/underscores only')
    .refine((v) => !RESERVED_ALIASES.has(v.toLowerCase()), 'This alias is reserved')
    .optional(),
});

export const updateLinkSchema = z.object({
  originalUrl: httpUrl.optional(),
  title: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});
