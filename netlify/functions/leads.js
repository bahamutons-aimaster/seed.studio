const { isAuthed, getBlobStore } = require('./_utils');
const crypto = require('crypto');
const INDEX_KEY = '_index';

function sanitize(str, max=500) { return typeof str==='string' ? str.trim().slice(0,max) : ''; }

exports.handler = async (event) => {
  const store = getBlobStore('rezz-vze-leads');

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const umur = parseInt(body.umur, 10);
      if (isNaN(umur) || umur < 18) return { statusCode:400, body: JSON.stringify({ error:'Pendaftaran hanya untuk usia 18 tahun ke atas.' }) };
      for (const f of ['nama','domisili','status','instagram','whatsapp','alasan']) {
        if (!body[f]?.trim()) return { statusCode:400, body: JSON.stringify({ error:`Field "${f}" wajib diisi.` }) };
      }
      const id = crypto.randomBytes(8).toString('hex');
      const lead = { id, createdAt: new Date().toISOString(), nama:sanitize(body.nama,100), umur, domisili:sanitize(body.domisili,100), status:sanitize(body.status,50), instagram:sanitize(body.instagram,100), whatsapp:sanitize(body.whatsapp,30), alasan:sanitize(body.alasan,1000), leadStatus:'new' };
      await store.setJSON(`lead-${id}`, lead);
      let index = await store.get(INDEX_KEY, { type:'json' }).catch(()=>null) || [];
      index.unshift(id);
      await store.setJSON(INDEX_KEY, index);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    } catch(e) { return { statusCode:400, body: JSON.stringify({ error:'Data tidak valid.' }) }; }
  }

  if (event.httpMethod === 'GET') {
    if (!isAuthed(event)) return { statusCode:401, body: JSON.stringify({ error:'Unauthorized' }) };
    try {
      const index = await store.get(INDEX_KEY, { type:'json' }).catch(()=>null) || [];
      const leads = await Promise.all(index.map(id => store.get(`lead-${id}`, { type:'json' }).catch(()=>null)));
      return { statusCode:200, headers:{'Content-Type':'application/json','Cache-Control':'no-store'}, body: JSON.stringify(leads.filter(Boolean)) };
    } catch(e) { return { statusCode:200, body: JSON.stringify([]) }; }
  }

  if (event.httpMethod === 'PATCH') {
    if (!isAuthed(event)) return { statusCode:401, body: JSON.stringify({ error:'Unauthorized' }) };
    try {
      const body = JSON.parse(event.body || '{}');
      const lead = await store.get(`lead-${body.id}`, { type:'json' });
      if (!lead) return { statusCode:404, body: JSON.stringify({ error:'Lead not found' }) };
      lead.leadStatus = body.leadStatus;
      await store.setJSON(`lead-${body.id}`, lead);
      return { statusCode:200, body: JSON.stringify({ ok:true }) };
    } catch(e) { return { statusCode:400, body: JSON.stringify({ error:'Invalid request' }) }; }
  }

  return { statusCode:405, body:'Method not allowed' };
};
