import { nanoid } from 'nanoid';
import Url from '../models/url.model.js';
import { publish } from '@pklinks/utils/rabbitmq';

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nanoid(6);
    const exists = await Url.findOne({ code });
    if (!exists) return code;
  }

  const err = new Error('Could not generate a unique short code — please try again.');
  err.statusCode = 503;
  throw err;
}

export async function listLinks(userId) {
  return Url.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getLinkByCode(code, userId) {
  const link = await Url.findOne({ code, userId }).lean();
  if (!link) {
    const err = new Error('Link not found');
    err.statusCode = 404;
    throw err;
  }
  return link;
}

export async function createLink({ originalUrl, title, expiresAt, userId, customAlias }) {
  const isCustom = Boolean(customAlias);
  let code;

  if (isCustom) {
    const trimmedAlias = customAlias.trim();

    const exists = await Url.findOne({ code: trimmedAlias });
    if (exists) {
      const err = new Error('This custom alias is already taken.');
      err.statusCode = 400;
      throw err;
    }
    code = trimmedAlias;
  } else {
    code = await generateUniqueCode();
  }

  let link;
  try {
    link = await Url.create({
      code,
      originalUrl,
      title:     title || '',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      userId,
      isActive: true,
    });
  } catch (e) {
    // Concurrent alias/code collision
    if (e.code === 11000) {
      const err = isCustom
        ? new Error('This custom alias is already taken.')
        : new Error('Could not generate a unique short code — please try again.');
      err.statusCode = isCustom ? 400 : 503;
      throw err;
    }
    throw e;
  }

  publish('link.created', {
    code:        link.code,
    originalUrl: link.originalUrl,
    expiresAt:   link.expiresAt,
    isActive:    link.isActive,
    userId:      userId.toString(),
    timestamp:   new Date().toISOString(),
  });

  return link;
}

export async function updateLink(code, userId, updates) {
  const allowedFields = ['originalUrl', 'title', 'expiresAt', 'isActive'];
  const safeUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  const link = await Url.findOneAndUpdate(
    { code, userId },
    safeUpdates,
    { new: true }
  );

  if (!link) {
    const err = new Error('Link not found or you do not have permission to edit it');
    err.statusCode = 404;
    throw err;
  }

  // Treat an expired link as inactive so the cache isn't primed with a stale URL
  const notExpired = !link.expiresAt || new Date(link.expiresAt) > new Date();

  publish('link.updated', {
    code:        link.code,
    originalUrl: link.originalUrl,
    expiresAt:   link.expiresAt,
    isActive:    link.isActive && notExpired,
    timestamp:   new Date().toISOString(),
  });

  return link;
}

export async function deleteLink(code, userId) {
  const link = await Url.findOneAndUpdate(
    { code, userId },
    { isActive: false },
    { new: true }
  );

  if (!link) {
    const err = new Error('Link not found or you do not have permission to delete it');
    err.statusCode = 404;
    throw err;
  }

  publish('link.deleted', {
    code:      link.code,
    userId:    userId.toString(),
    timestamp: new Date().toISOString(),
  });

  return link;
}
