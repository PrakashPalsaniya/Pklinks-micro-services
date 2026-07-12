import Click from './models/click.model.js';
import Analytics from './models/analytics.model.js';
import Url from './models/link.model.js';

// Buffers click writes and flushes them in bulk. Each enqueued event returns a
// promise that only settles once its batch is persisted, so the caller can hold
// the RabbitMQ ack until the data is durable.
const FLUSH_INTERVAL = parseInt(process.env.ANALYTICS_FLUSH_INTERVAL_MS || '2000', 10);
const MAX_BUFFER      = parseInt(process.env.ANALYTICS_FLUSH_MAX || '500', 10);

let buffer = [];
let waiters = [];
let timer = null;

export function enqueue(item) {
  return new Promise((resolve, reject) => {
    buffer.push(item);
    waiters.push({ resolve, reject });

    if (buffer.length >= MAX_BUFFER) {
      void flush();
    }
  });
}

export async function flush() {
  if (buffer.length === 0) return;

  const batch    = buffer;
  const settlers = waiters;
  buffer  = [];
  waiters = [];

  // Raw clicks are the source of truth. Insert first, deduped by eventId.
  const duplicates = new Set();
  try {
    await Click.insertMany(batch.map((b) => b.click), { ordered: false });
  } catch (e) {
    if (e.code === 11000 || Array.isArray(e.writeErrors)) {
      for (const we of e.writeErrors || []) {
        const idx = we.index ?? we.err?.index;
        if (typeof idx === 'number') duplicates.add(idx);
      }
    } else {
      // Not persisted — let RabbitMQ redeliver.
      for (const s of settlers) s.reject(e);
      return;
    }
  }

  // Raw data is durable; safe to ack.
  for (const s of settlers) s.resolve();

  // Aggregates are derived and rebuildable — only count newly-inserted clicks
  // so redelivered messages don't inflate totals, and never fail the batch.
  try {
    const analyticsInc = new Map();
    const urlInc       = new Map();

    batch.forEach(({ analyticsKey, code }, i) => {
      if (duplicates.has(i)) return;

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
    });

    const analyticsOps = [...analyticsInc.values()].map((a) => ({
      updateOne: {
        filter: { code: a.code, date: a.date },
        update: { $inc: a.inc },
        upsert: true,
      },
    }));
    if (analyticsOps.length) {
      await Analytics.bulkWrite(analyticsOps, { ordered: false });
    }

    const urlOps = [...urlInc.entries()].map(([code, count]) => ({
      updateOne: {
        filter: { code },
        update: { $inc: { clicks: count } },
      },
    }));
    if (urlOps.length) {
      await Url.bulkWrite(urlOps, { ordered: false });
    }
  } catch (e) {
    console.error('[batcher] Failed to update analytics aggregates:', e.message);
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
