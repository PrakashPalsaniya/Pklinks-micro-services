import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas.js';

describe('Auth Zod Schemas', () => {
  describe('signupSchema', () => {
    it('should validate correctly with valid data', () => {
      const data = { email: 'test@example.com', password: 'password123', displayName: 'Test User' };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should validate correctly without optional displayName', () => {
      const data = { email: 'test@example.com', password: 'password123' };
      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if email is invalid', () => {
      const result = signupSchema.safeParse({ email: 'invalid-email', password: 'password123' });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Invalid email address');
    });

    it('should fail if password is too short', () => {
      const result = signupSchema.safeParse({ email: 'test@example.com', password: 'short' });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    });
  });

  describe('loginSchema', () => {
    it('should validate with valid data', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
      expect(result.success).toBe(true);
    });

    it('should fail if password is missing', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com', password: '' });
      expect(result.success).toBe(false);
    });
  });
});
