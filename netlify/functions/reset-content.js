// netlify/functions/reset-content.js
// DELETE: admin-only, clears the stored content from Blobs so the site
// falls back to the bundled content.json on next GET request.
// This is useful when the content schema changes and old Blobs data is stale.

const { isAuthed, getBlobStore } = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  if (!isAuthed(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  try {
    const store = getBlobStore('rezz-vze-content');
    await store.delete('content');
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Content reset. Site will now use bundled content.json.' }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Nothing to delete or already cleared.' }),
    };
  }
};
