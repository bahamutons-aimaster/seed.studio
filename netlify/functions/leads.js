// netlify/functions/leads.js
// POST: public endpoint, stores a new registration submission (no auth — it's the public form)
// GET: admin-only, returns all leads
// PATCH: admin-only, update a lead's status (e.g. mark as contacted)

const { getStore } = require('@netlify/blobs');
const { isAuthed } = require('./_utils');
const crypto = require('crypto');

const STORE_NAME = 'rezz-vze-leads';
const INDEX_KEY = '_index';

function sanitize(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

exports.handler = async (event) => {
  const store = getStore(STORE_NAME);

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const umur = parseInt(body.umur, 10);

      // Server-side age gate — never trust the client alone.
      if (isNaN(umur) || umur < 18) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Pendaftaran hanya untuk usia 18 tahun ke atas.' }) };
      }

      const requiredFields = ['nama', 'domisili', 'status', 'instagram', 'whatsapp', 'alasan'];
      for (const f of requiredFields) {
        if (!body[f] || typeof body[f] !== 'string' || !body[f].trim()) {
          return { statusCode: 400, body: JSON.stringify({ error: `Field "${f}" wajib diisi.` }) };
        }
      }

      const id = crypto.randomBytes(8).toString('hex');
      const lead = {
        id,
        createdAt: new Date().toISOString(),
        nama: sanitize(body.nama, 100),
        umur,
        domisili: sanitize(body.domisili, 100),
        status: sanitize(body.status, 50),
        instagram: sanitize(body.instagram, 100),
        whatsapp: sanitize(body.whatsapp, 30),
        alasan: sanitize(body.alasan, 1000),
        leadStatus: 'new', // new | contacted | interviewed | accepted | rejected
      };

      await store.setJSON(`lead-${id}`, lead);

      // maintain an index of lead keys for fast listing
      let index = [];
      try {
        index = (await store.get(INDEX_KEY, { type: 'json' })) || [];
      } catch (e) { index = []; }
      index.unshift(id);
      await store.setJSON(INDEX_KEY, index);

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Data tidak valid.' }) };
    }
  }

  if (event.httpMethod === 'GET') {
    if (!isAuthed(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
      const index = (await store.get(INDEX_KEY, { type: 'json' })) || [];
      const leads = await Promise.all(
        index.map(async (id) => {
          try {
            return await store.get(`lead-${id}`, { type: 'json' });
          } catch (e) { return null; }
        })
      );
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(leads.filter(Boolean)),
      };
    } catch (e) {
      return { statusCode: 200, body: JSON.stringify([]) };
    }
  }

  if (event.httpMethod === 'PATCH') {
    if (!isAuthed(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    try {
      const body = JSON.parse(event.body || '{}');
      if (!body.id || !body.leadStatus) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing id or leadStatus' }) };
      }
      const lead = await store.get(`lead-${body.id}`, { type: 'json' });
      if (!lead) return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
      lead.leadStatus = body.leadStatus;
      await store.setJSON(`lead-${body.id}`, lead);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
    }
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
