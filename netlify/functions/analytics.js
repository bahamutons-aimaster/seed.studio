// netlify/functions/analytics.js
// GET: admin-only, returns aggregated analytics summary for the dashboard

const { getStore } = require('@netlify/blobs');
const { isAuthed } = require('./_utils');

const STORE_NAME = 'rezz-vze-analytics';

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  if (!isAuthed(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const store = getStore(STORE_NAME);
    const dayIndex = (await store.get('_dayIndex', { type: 'json' }).catch(() => null)) || [];

    // last 60 days max, to keep payload reasonable
    const recentDays = dayIndex.slice(-60);

    const days = await Promise.all(
      recentDays.map(async (day) => {
        const data = await store.get(`day-${day}`, { type: 'json' }).catch(() => null);
        if (!data) return null;
        return {
          date: data.date,
          views: data.views || 0,
          unique: (data.uniqueVisitors || []).length,
          pages: data.pages || {},
        };
      })
    );

    const validDays = days.filter(Boolean);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayData = validDays.find(d => d.date === todayStr);

    let totalViews = 0;
    let totalUniqueSet = new Set();
    const pagesAgg = {};
    const devicesAgg = { desktop: 0, mobile: 0, tablet: 0 };

    for (const day of recentDays) {
      const raw = await store.get(`day-${day}`, { type: 'json' }).catch(() => null);
      if (!raw) continue;
      totalViews += raw.views || 0;
      (raw.uniqueVisitors || []).forEach(v => totalUniqueSet.add(v));
      Object.entries(raw.pages || {}).forEach(([p, c]) => { pagesAgg[p] = (pagesAgg[p] || 0) + c; });
      Object.entries(raw.devices || {}).forEach(([d, c]) => { devicesAgg[d] = (devicesAgg[d] || 0) + c; });
    }

    const topPages = Object.entries(pagesAgg)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const summary = {
      totalViews,
      totalUnique: totalUniqueSet.size,
      todayViews: todayData ? todayData.views : 0,
      todayUnique: todayData ? todayData.unique : 0,
      topPages,
      daily: validDays,
      devices: devicesAgg,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(summary),
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        totalViews: 0, totalUnique: 0, todayViews: 0, todayUnique: 0,
        topPages: [], daily: [], devices: { desktop: 0, mobile: 0, tablet: 0 },
      }),
    };
  }
};
