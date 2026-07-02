// netlify/functions/track.js
// POST: public endpoint, records a page view (no PII stored — IP is hashed, never reversible)

const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

const STORE_NAME = 'rezz-vze-analytics';

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function detectDevice(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}

function hashIp(ip, salt) {
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const store = getStore(STORE_NAME);
    const body = JSON.parse(event.body || '{}');
    const path = typeof body.path === 'string' ? body.path.slice(0, 100) : '/';

    const salt = process.env.ADMIN_SESSION_SECRET || 'fallback-salt';
    const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
    const visitorHash = hashIp(ip, salt);
    const device = detectDevice(event.headers['user-agent']);
    const day = todayKey();

    const dayKey = `day-${day}`;
    let dayData = await store.get(dayKey, { type: 'json' }).catch(() => null);
    if (!dayData) {
      dayData = { date: day, views: 0, uniqueVisitors: [], pages: {}, devices: { desktop: 0, mobile: 0, tablet: 0 } };
    }

    dayData.views += 1;
    dayData.pages[path] = (dayData.pages[path] || 0) + 1;
    dayData.devices[device] = (dayData.devices[device] || 0) + 1;

    // Track unique visitors per day (cap stored list to avoid unbounded growth)
    if (!dayData.uniqueVisitors.includes(visitorHash)) {
      if (dayData.uniqueVisitors.length < 5000) {
        dayData.uniqueVisitors.push(visitorHash);
      }
    }

    await store.setJSON(dayKey, dayData);

    // maintain index of day keys
    let dayIndex = (await store.get('_dayIndex', { type: 'json' }).catch(() => null)) || [];
    if (!dayIndex.includes(day)) {
      dayIndex.push(day);
      dayIndex.sort();
      await store.setJSON('_dayIndex', dayIndex);
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    // Tracking failures should never surface as errors to the visitor.
    return { statusCode: 200, body: JSON.stringify({ ok: false }) };
  }
};
