// netlify/functions/get-image.js
// GET /.netlify/functions/get-image?key=xxx -> serves the stored binary image

const { getBlobStore } = require('./_utils');

exports.handler = async (event) => {
  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) return { statusCode: 400, body: 'Missing key' };

  try {
    const store = getBlobStore('rezz-vze-images');
    const result = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!result || !result.data) return { statusCode: 404, body: 'Not found' };

    const mimeType = (result.metadata && result.metadata.mimeType) || 'image/jpeg';
    const buffer = Buffer.from(result.data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (e) {
    return { statusCode: 404, body: 'Not found: ' + e.message };
  }
};
