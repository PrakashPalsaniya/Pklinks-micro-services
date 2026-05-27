import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  code:        String,
  date:        Date,
  totalClicks: Number,
  byBrowser:   { type: Map, of: Number },
  byOs:        { type: Map, of: Number },
  byDevice:    { type: Map, of: Number },
  byReferer:   { type: Map, of: Number },
  byCountry:   { type: Map, of: Number },
});

const clickSchema = new mongoose.Schema({
  code:        String,
  originalUrl: String,
  ip:          String,
  browser:     String,
  os:          String,
  device:      String,
  referer:     String,
  country:     String,
  clickedAt:   Date,
});

const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);
const Click     = mongoose.models.Click     || mongoose.model('Click', clickSchema);
const Url       = mongoose.models.Url || mongoose.model('Url', new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: '',
    },
    originalUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { collection: 'urls' }
));

function redactIp(ip) {
  if (!ip) return '';

  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean);
    return parts.length ? `${parts.slice(0, 2).join(':')}:*` : '*';
  }

  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.*`;
  }

  return '*';
}

export async function getAnalytics(code, userId, filters = {}) {
  const { from, to } = filters;
  const link = await Url.findOne({ code, userId }).lean();

  if (!link) {
    const err = new Error('Link not found');
    err.statusCode = 404;
    throw err;
  }

  const match = { code };

  // Setup date filtering for raw clicks
  if (from || to) {
    match.clickedAt = {};
    if (from) match.clickedAt.$gte = new Date(from);
    if (to)   match.clickedAt.$lte = new Date(to);
  }

  // Execute high-performance aggregation
  const [aggregated] = await Click.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          { $count: "count" }
        ],
        byBrowser: [
          { $group: { _id: "$browser", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        byOs: [
          { $group: { _id: "$os", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        byDevice: [
          { $group: { _id: "$device", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        byReferer: [
          { $group: { _id: "$referer", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 15 }
        ],
        byCountry: [
          { $group: { _id: "$country", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        dailyClicks: [
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  // Transform aggregation result back to the expected app format
  const formatMap = (arr) => {
    const obj = {};
    arr.forEach(item => { if (item._id) obj[item._id] = item.count; });
    return obj;
  };

  const result = {
    code,
    link: {
      code: link.code,
      title: link.title || '',
      originalUrl: link.originalUrl || '',
      isActive: link.isActive !== false,
    },
    totalClicks: aggregated.totals[0]?.count || 0,
    byBrowser:   formatMap(aggregated.byBrowser),
    byOs:        formatMap(aggregated.byOs),
    byDevice:    formatMap(aggregated.byDevice),
    byReferer:   formatMap(aggregated.byReferer),
    byCountry:   formatMap(aggregated.byCountry),
    dailyClicks: aggregated.dailyClicks.map(d => ({ date: d._id, clicks: d.count })),
    recentClicks: []
  };

  // Get the 10 most recent raw click events (separate query for simplicity/readability)
  result.recentClicks = await Click.find({ code })
    .sort({ clickedAt: -1 })
    .limit(10)
    .lean()
    .then((clicks) => clicks.map((click) => ({
      ...click,
      ip: redactIp(click.ip),
    })));

  return result;
}
