const { getBlobStore } = require('./_utils');
const crypto = require('crypto');

function todayKey() { return new Date().toISOString().slice(0, 10); }

function detectDevice(ua) {
  const u = (ua || '').toLowerCase();
  if (/tablet|ipad/.test(u)) return 'tablet';
  if (/mobile|android|iphone/.test(u)) return 'mobile';
  return 'desktop';
}

function hashIp(ip, salt) {
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const store = getBlobStore('rezz-vze-analytics');
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
    if (!dayData.uniqueVisitors.includes(visitorHash) && dayData.uniqueVisitors.length < 5000) {
      dayData.uniqueVisitors.push(visitorHash);
    }
    await store.setJSON(dayKey, dayData);

    let dayIndex = await store.get('_dayIndex', { type: 'json' }).catch(() => null) || [];
    if (!dayIndex.includes(day)) {
      dayIndex.push(day);
      dayIndex.sort();
      await store.setJSON('_dayIndex', dayIndex);
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false }) };
  }
};
