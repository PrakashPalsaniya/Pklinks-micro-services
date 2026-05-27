import client from "./client";
import { decorateLink } from "../utils/shortUrl";

// Helper to turn backend { key: val } into sorted list for charts
function formatMap(obj = {}) {
  return Object.entries(obj)
    .map(([label, count]) => ({ 
      label: label || "Unknown", 
      count: Number(count) || 0 
    }))
    .sort((a, b) => b.count - a.count);
}

// Transform the raw API response into something the UI likes
function adaptData(data, code) {
  const stats = data.analytics || {};

  // If link info is missing, just build a dummy one
  const link = stats.link 
    ? decorateLink(stats.link) 
    : decorateLink({ code, originalUrl: "", isActive: true });

  const recentClicks = (stats.recentClicks || []).map(click => ({
    id: click._id,
    occurredAt: click.clickedAt,
    country: click.country,
    referrer: click.referer || "Direct",
    deviceType: click.device,
    browser: click.browser
  }));

  return {
    link,
    overview: {
      totalClicks: stats.totalClicks || 0,
      lastClickedAt: recentClicks[0]?.occurredAt || null
    },
    chartData: (stats.dailyClicks || []).map(row => ({
      date: row.date,
      clicks: row.clicks || 0
    })),
    countries: formatMap(stats.byCountry),
    devices:   formatMap(stats.byDevice),
    referrers: formatMap(stats.byReferer),
    browsers:  formatMap(stats.byBrowser),
    recentClicks
  };
}

// GET /links/:code/analytics
export async function fetchLinkAnalytics(code, { from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to)   params.to = to;

  const data = await client.get(`/links/${code}/analytics`, { params });
  return adaptData(data, code);
}
