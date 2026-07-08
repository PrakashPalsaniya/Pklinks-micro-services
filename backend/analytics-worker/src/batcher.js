import Click from './models/click.model.js';
import Analytics from './models/analytics.model.js';
import Url from './models/link.model.js';

// Buffers click writes and flushes them in bulk on a timer to cut DB load.
const FLUSH_INTERVAL = parseInt(process.env.ANALYTICS_FLUSH_INTERVAL_MS || '2000', 10);
const MAX_BUFFER      = parseInt(process.env.ANALYTICS_FLUSH_MAX || '500', 10);

let clicks = [];
let analyticsInc = new Map();
let urlInc = new Map();
let timer = null;

export function enqueue({ click, analyticsKey, code }) {
  clicks.push(click);

  const existing = analyticsInc.get(analyticsKey.id);
  if (existing) {
    for (const [field, val] of Object.entries(analyticsKey.inc)) {
      existing.inc[field] = (existing.inc[field] || 0) + val;
    }
  } else {
    analyticsInc.set(analyticsKey.id, {
      code: analyticsKey.code,
      date: analyticsKey.date,
      inc:  { ...analyticsKey.inc },
    });
  }

  urlInc.set(code, (urlInc.get(code) || 0) + 1);

  if (clicks.length >= MAX_BUFFER) {
    void flush();
  }
}

export async function flush() {
  if (clicks.length === 0) return;

  const clicksBatch    = clicks;
  const analyticsBatch = analyticsInc;
  const urlBatch       = urlInc;
  clicks = [];
  analyticsInc = new Map();
  urlInc = new Map();

  try {
    await Click.insertMany(clicksBatch, { ordered: false });
  } catch (e) {
    if (e.code !== 11000 && !e.writeErrors) throw e;
  }

  const analyticsOps = [...analyticsBatch.values()].map((a) => ({
    updateOne: {
      filter: { code: a.code, date: a.date },
      update: { $inc: a.inc },
      upsert: true,
    },
  }));
  if (analyticsOps.length) {
    await Analytics.bulkWrite(analyticsOps, { ordered: false });
  }

  const urlOps = [...urlBatch.entries()].map(([code, count]) => ({
    updateOne: {
      filter: { code },
      update: { $inc: { clicks: count } },
    },
  }));
  if (urlOps.length) {
    await Url.bulkWrite(urlOps, { ordered: false });
  }
}

export function startBatcher() {
  if (!timer) {
    timer = setInterval(() => { void flush(); }, FLUSH_INTERVAL);
  }
}

export async function stopBatcher() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  await flush();
}
