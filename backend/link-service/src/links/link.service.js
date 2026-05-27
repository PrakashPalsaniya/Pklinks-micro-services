import { nanoid } from 'nanoid';
import Url from '../models/url.model.js';
import { publish } from '@pklinks/utils/rabbitmq';

function validateUrl(rawUrl) {
  try {
    new URL(rawUrl);
  } catch {
    const err = new Error('Invalid URL — must include scheme (http:// or https://)');
    err.statusCode = 400;
    throw err;
  }
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nanoid(6);
    const exists = await Url.findOne({ code });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique code — please try again');
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
  validateUrl(originalUrl);

  let code;
  if (customAlias) {
    const trimmedAlias = customAlias.trim();
    const aliasPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_]{2,39}$/;
    
    if (!aliasPattern.test(trimmedAlias)) {
      const err = new Error('Invalid custom alias — 3-40 chars, alphanumeric/hyphens/underscores only.');
      err.statusCode = 400;
      throw err;
    }

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

  const link = await Url.create({
    code,
    originalUrl,
    title:     title || '',
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    userId,
    isActive: true,
  });

  publish('link.created', {
    code:        link.code,
    originalUrl: link.originalUrl,
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

  if (safeUpdates.originalUrl) {
    validateUrl(safeUpdates.originalUrl);
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

  publish('link.updated', {
    code:        link.code,
    originalUrl: link.originalUrl,
    isActive:    link.isActive,
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
