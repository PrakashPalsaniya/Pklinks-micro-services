import * as linkService from './link.service.js';

export async function listLinks(req, res, next) {
  try {
    const links = await linkService.listLinks(req.userId);
    res.json({ links });
  } catch (err) {
    next(err);
  }
}

export async function getLink(req, res, next) {
  try {
    const link = await linkService.getLinkByCode(req.params.code, req.userId);
    res.json({ link });
  } catch (err) {
    next(err);
  }
}

export async function createLink(req, res, next) {
  try {
    const { originalUrl, title, expiresAt, customAlias } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ message: 'originalUrl is required' });
    }

    const link = await linkService.createLink({ 
      originalUrl, 
      title, 
      expiresAt, 
      userId: req.userId,
      customAlias 
    });
    res.status(201).json({ link });
  } catch (err) {
    next(err);
  }
}

export async function updateLink(req, res, next) {
  try {
    const link = await linkService.updateLink(req.params.code, req.userId, req.body);
    res.json({ link });
  } catch (err) {
    next(err);
  }
}

export async function deleteLink(req, res, next) {
  try {
    await linkService.deleteLink(req.params.code, req.userId);
    res.json({ message: 'Link deleted successfully' });
  } catch (err) {
    next(err);
  }
}
