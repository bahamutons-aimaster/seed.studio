// netlify/functions/content.js
// GET: returns current site content (public, no auth needed — used by the landing page itself)
// PUT: saves new content (requires admin auth)

const { getStore } = require('@netlify/blobs');
const { isAuthed } = require('./_utils');
const fallbackContent = require('../../data/content.json');

const STORE_NAME = 'rezz-vze-content';
const KEY = 'content';

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);

  if (event.httpMethod === 'GET') {
    try {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackContent),
      };
    }
  }

  if (event.httpMethod === 'PUT') {
    if (!isAuthed(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
      const body = event.body || '{}';
      JSON.parse(body); // validate it's real JSON before saving
      await store.set(KEY, body);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
