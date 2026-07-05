import { jest } from '@jest/globals';

// 1. Mock dependencies
jest.unstable_mockModule('../models/url.model.js', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  }
}));

jest.unstable_mockModule('@pklinks/utils/rabbitmq', () => ({
  publish: jest.fn(),
}));

jest.unstable_mockModule('nanoid', () => ({
  nanoid: jest.fn(() => 'mock123'),
}));

// 2. Dynamically import the modules under test after mocking
const { createLink } = await import('./link.service.js');
const Url = (await import('../models/url.model.js')).default;
const { publish } = await import('@pklinks/utils/rabbitmq');

describe('Link Service (Isolated)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLink', () => {
    it('should generate a nanoid short code if no custom alias is provided', async () => {
      // Mock that the generated code is unique
      Url.findOne.mockResolvedValueOnce(null);
      Url.create.mockImplementationOnce((data) => Promise.resolve({ ...data, _id: '123' }));

      const result = await createLink({
        originalUrl: 'https://example.com',
        title: 'Example',
        userId: 'user1'
      });

      expect(Url.findOne).toHaveBeenCalledWith({ code: 'mock123' });
      expect(Url.create).toHaveBeenCalledWith(expect.objectContaining({
        code: 'mock123',
        originalUrl: 'https://example.com'
      }));
      expect(publish).toHaveBeenCalledWith('link.created', expect.any(Object));
      expect(result.code).toBe('mock123');
    });

    it('should use custom alias if provided and available', async () => {
      // Mock that the custom alias is available
      Url.findOne.mockResolvedValueOnce(null);
      Url.create.mockImplementationOnce((data) => Promise.resolve({ ...data, _id: '456' }));

      const result = await createLink({
        originalUrl: 'https://example.com',
        customAlias: 'my-sale',
        userId: 'user1'
      });

      expect(Url.findOne).toHaveBeenCalledWith({ code: 'my-sale' });
      expect(Url.create).toHaveBeenCalledWith(expect.objectContaining({
        code: 'my-sale'
      }));
      expect(result.code).toBe('my-sale');
    });

    it('should throw an error if custom alias is already taken', async () => {
      // Mock that the custom alias already exists in the DB
      Url.findOne.mockResolvedValueOnce({ _id: '789', code: 'taken-alias' });

      await expect(createLink({
        originalUrl: 'https://example.com',
        customAlias: 'taken-alias',
        userId: 'user1'
      })).rejects.toThrow('This custom alias is already taken.');

      expect(Url.create).not.toHaveBeenCalled();
    });
  });
});
