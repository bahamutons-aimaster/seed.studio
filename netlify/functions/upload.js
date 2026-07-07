// netlify/functions/upload.js
// Receives file as base64 JSON body, stores in Netlify Blobs, returns URL.

const { getBlobStore } = require('./_utils');
const { isAuthed } = require('./_utils');
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  if (!isAuthed(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { data: base64Data, mimeType, filename } = body;

    if (!base64Data || !mimeType) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing data or mimeType' }) };
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      return { statusCode: 400, body: JSON.stringify({ error: 'File terlalu besar. Maksimal 8MB.' }) };
    }

    const ext = (filename || 'jpg').split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const id = crypto.randomBytes(8).toString('hex');
    const key = `${Date.now()}-${id}.${ext}`;

    const store = getBlobStore('rezz-vze-images');
    await store.set(key, buffer, { metadata: { mimeType } });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `/.netlify/functions/get-image?key=${encodeURIComponent(key)}` }),
    };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Upload gagal: ' + e.message }) };
  }
};
