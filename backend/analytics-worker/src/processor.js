import UAParser from 'ua-parser-js';
import geoip from 'geoip-lite';
import Click from './models/click.model.js';
import Analytics from './models/analytics.model.js';
import Url from './models/link.model.js';

export async function processClickEvent(data) {
  const { code, originalUrl, ip, userAgent, referer, timestamp } = data;

  if (!code || !originalUrl) {
    throw new Error('Invalid click event: missing code or originalUrl');
  }

  // 1. Parse User Agent for Browser, OS, and Device
  const parser = new UAParser(userAgent || '');
  const ua = parser.getResult();
  
  const browser = ua.browser.name || 'Unknown';
  const os      = ua.os.name      || 'Unknown';
  const device  = ua.device.type === 'mobile' ? 'mobile' 
                : ua.device.type === 'tablet' ? 'tablet' 
                : 'desktop';

  // 2. Country enrichment via geoip-lite (offline, no API key required)
  let country = 'Unknown';
  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    // Strip IPv6-mapped IPv4 prefix (e.g. "::ffff:1.2.3.4" → "1.2.3.4")
    const cleanIp = ip.replace(/^::ffff:/, '');
    const geo = geoip.lookup(cleanIp);
    if (geo && geo.country) {
      country = geo.country; // ISO 3166-1 alpha-2, e.g. "US", "IN", "GB"
    }
  }

  const clickedAt = timestamp ? new Date(timestamp) : new Date();

  // 3. Save individual click log (Raw Data)
  await Click.create({
    code,
    originalUrl,
    ip:      ip || '',
    browser,
    os,
    device,
    referer: referer || 'Direct',
    country,
    clickedAt,
  });

  // 4. Update daily aggregates (Pre-calculated Data)
  const day = new Date(clickedAt);
  day.setUTCHours(0, 0, 0, 0);

  // Clean referer for use as a MongoDB key
  let refKey = 'Direct';
  if (referer && referer !== 'Direct') {
    try {
      refKey = new URL(referer).hostname.replace(/\./g, '_');
    } catch (e) {
      refKey = referer.replace(/\./g, '_');
    }
  }

  await Analytics.findOneAndUpdate(
    { code, date: day },
    {
      $inc: {
        totalClicks:              1,
        [`byBrowser.${browser}`]: 1,
        [`byOs.${os}`]:           1,
        [`byDevice.${device}`]:   1,
        [`byReferer.${refKey}`]:  1,
        [`byCountry.${country}`]: 1,
      },
    },
    { upsert: true }
  );

  // 5. Increment global click counter on the URL
  await Url.findOneAndUpdate({ code }, { $inc: { clicks: 1 } });

  console.log(`Processed click: ${code} (${browser}, ${country})`);
}
