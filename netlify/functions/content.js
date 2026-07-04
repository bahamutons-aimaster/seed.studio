const { isAuthed, getBlobStore } = require('./_utils');
const fallbackContent = require('../../data/content.json');
const KEY = 'content';

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    try {
      const store = getBlobStore('rezz-vze-content');
      const raw = await store.get(KEY);
      const data = raw ? JSON.parse(raw) : fallbackContent;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(data),
      };
    } catch (e) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(fallbackContent),
      };
    }
  }

  if (event.httpMethod === 'PUT') {
    if (!isAuthed(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
      const store = getBlobStore('rezz-vze-content');
      const parsed = JSON.parse(event.body || '{}');
      await store.set(KEY, JSON.stringify(parsed));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Gagal menyimpan: ' + e.message }) };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
