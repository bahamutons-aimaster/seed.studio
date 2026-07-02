// netlify/functions/upload.js
// POST multipart/form-data with field "file" -> stores image in Netlify Blobs, returns a public URL
// served via the get-image function.

const { getStore } = require('@netlify/blobs');
const { isAuthed } = require('./_utils');
const crypto = require('crypto');

const STORE_NAME = 'rezz-vze-images';

function parseMultipart(body, contentType) {
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) throw new Error('No boundary found');
  const boundary = '--' + boundaryMatch[1];
  const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'binary');
  const parts = [];
  let start = bodyBuffer.indexOf(boundary);
  while (start !== -1) {
    const next = bodyBuffer.indexOf(boundary, start + boundary.length);
    if (next === -1) break;
    const part = bodyBuffer.slice(start + boundary.length, next);
    parts.push(part);
    start = next;
  }

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const header = part.slice(0, headerEnd).toString('utf8');
    if (!header.includes('filename=')) continue;
    const filenameMatch = header.match(/filename="(.+?)"/);
    const typeMatch = header.match(/Content-Type:\s*(.+)/i);
    const filename = filenameMatch ? filenameMatch[1] : `upload-${Date.now()}`;
    const mimeType = typeMatch ? typeMatch[1].trim() : 'application/octet-stream';
    let data = part.slice(headerEnd + 4);
    // strip trailing \r\n before next boundary
    if (data.slice(-2).toString() === '\r\n') data = data.slice(0, -2);
    return { filename, mimeType, data };
  }
  throw new Error('No file part found');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  if (!isAuthed(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf8');

    const { filename, mimeType, data } = parseMultipart(bodyBuffer, contentType);

    const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
    const id = crypto.randomBytes(8).toString('hex');
    const key = `${Date.now()}-${id}.${ext}`;

    const store = getStore(STORE_NAME);
    await store.set(key, data, { metadata: { mimeType } });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `/.netlify/functions/get-image?key=${encodeURIComponent(key)}` }),
    };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Upload failed: ' + e.message }) };
  }
};
