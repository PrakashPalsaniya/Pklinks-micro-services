import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import { enqueue } from './batcher.js';

// MongoDB field paths can't contain '.' or start with '$', so make any value
// derived from user-controlled input (UA, referer) safe to use as a key.
const safeKey = (v) => String(v ?? 'Unknown').replace(/[.$]/g, '_').slice(0, 64) || 'Unknown';

export async function processClickEvent(data) {
  const { eventId, code, originalUrl, ip, userAgent, referer, timestamp } = data;

  if (!code || !originalUrl) {
    throw new Error('Invalid click event: missing code or originalUrl');
  }

  const parser = new UAParser(userAgent || '');
  const ua = parser.getResult();

  const browser = ua.browser.name || 'Unknown';
  const os      = ua.os.name      || 'Unknown';
  const device  = ua.device.type === 'mobile' ? 'mobile'
                : ua.device.type === 'tablet' ? 'tablet'
                : 'desktop';

  let country = 'Unknown';
  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    const cleanIp = ip.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIp);
    if (geo && geo.country) {
      country = geo.country;
    }
  }

  const clickedAt = timestamp ? new Date(timestamp) : new Date();

  const day = new Date(clickedAt);
  day.setUTCHours(0, 0, 0, 0);

  let refKey = 'Direct';
  if (referer && referer !== 'Direct') {
    try {
      refKey = new URL(referer).hostname.replace(/\./g, '_');
    } catch (e) {
      refKey = referer.replace(/\./g, '_');
    }
  }

  return enqueue({
    code,
    click: {
      eventId,
      code,
      originalUrl,
      ip:      ip || '',
      browser,
      os,
      device,
      referer: referer || 'Direct',
      country,
      clickedAt,
    },
    analyticsKey: {
      id:   `${code}|${day.toISOString()}`,
      code,
      date: day,
      inc: {
        totalClicks:                       1,
        [`byBrowser.${safeKey(browser)}`]: 1,
        [`byOs.${safeKey(os)}`]:           1,
        [`byDevice.${safeKey(device)}`]:   1,
        [`byReferer.${safeKey(refKey)}`]:  1,
        [`byCountry.${safeKey(country)}`]: 1,
      },
    },
  });
}
