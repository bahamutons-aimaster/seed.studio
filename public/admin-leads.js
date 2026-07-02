// public/admin-leads.js
// Leads tab — view and manage registration submissions from the public form.

const LEAD_STATUS_LABELS = {
  new: 'Baru',
  contacted: 'Dihubungi',
  interviewed: 'Interview',
  accepted: 'Diterima',
  rejected: 'Ditolak',
};
const LEAD_STATUS_COLORS = {
  new: '#E8C75A',
  contacted: '#5FA8E8',
  interviewed: '#B98FE8',
  accepted: '#4ADE80',
  rejected: '#e5736b',
};

async function renderLeadsTab(container) {
  container.innerHTML = `<div style="padding:60px 32px; text-align:center; color:var(--muted); font-family:var(--mono);">Memuat data pendaftar…</div>`;

  let leads;
  try {
    const res = await api('leads');
    if (!res.ok) throw new Error('failed');
    leads = await res.json();
  } catch (e) {
    container.innerHTML = `<div style="padding:60px 32px; text-align:center; color:#e5736b;">Gagal memuat data pendaftar. Coba refresh halaman.</div>`;
    return;
  }

  let filter = 'all';

  function draw() {
    container.innerHTML = '';
    const wrap = h(`<div style="padding:28px 32px 60px; display:flex; flex-direction:column; gap:16px; max-width:920px;"></div>`);

    const header = h(`
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <span style="font-family:var(--display); font-size:1.3rem;">${leads.length} Pendaftar</span>
      </div>
    `);
    const newCount = leads.filter(l => l.leadStatus === 'new').length;
    if (newCount > 0) {
      header.appendChild(h(`<span style="background:var(--green); color:#06140C; font-size:0.74rem; font-weight:700; padding:3px 10px; border-radius:20px;">${newCount} baru</span>`));
    }
    wrap.appendChild(header);

    const filters = ['all', 'new', 'contacted', 'interviewed', 'accepted', 'rejected'];
    const filterRow = h(`<div style="display:flex; gap:6px; flex-wrap:wrap;"></div>`);
    filters.forEach(f => {
      const btn = h(`
        <button style="padding:5px 14px; border-radius:20px; border:1px solid ${filter === f ? 'var(--green)' : 'var(--line-strong)'};
          background:${filter === f ? 'var(--green)' : 'transparent'}; color:${filter === f ? '#06140C' : 'var(--muted)'};
          font-size:0.78rem; cursor:pointer; text-transform:capitalize;">
          ${f === 'all' ? 'Semua' : LEAD_STATUS_LABELS[f]}
        </button>
      `);
      btn.addEventListener('click', () => { filter = f; draw(); });
      filterRow.appendChild(btn);
    });
    wrap.appendChild(filterRow);

    const filtered = filter === 'all' ? leads : leads.filter(l => l.leadStatus === filter);

    if (filtered.length === 0) {
      wrap.appendChild(h(`<div style="color:var(--muted); text-align:center; padding:48px 0; font-size:0.9rem; font-family:var(--mono);">Belum ada pendaftar di kategori ini.</div>`));
    }

    filtered.forEach(lead => {
      const card = h(`
        <div class="card" style="border-left:3px solid ${LEAD_STATUS_COLORS[lead.leadStatus] || '#333'};">
          <div class="cardHead">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <strong>${esc(lead.nama)}</strong>
              <span class="badge">${lead.umur} th</span>
              <span class="badge">${esc(lead.status)}</span>
              <span class="badge">${esc(lead.domisili)}</span>
            </div>
            <select class="select" style="min-width:120px; border-color:${LEAD_STATUS_COLORS[lead.leadStatus]};"></select>
          </div>
          <p style="color:var(--paper); font-size:0.9rem; line-height:1.6; margin:8px 0 12px;">${esc(lead.alasan)}</p>
          <div style="display:flex; gap:18px; font-size:0.76rem; color:var(--muted); flex-wrap:wrap;">
            <span>📅 ${new Date(lead.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            <span>📷 ${esc(lead.instagram)}</span>
            <a href="https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" style="color:var(--green);">💬 ${esc(lead.whatsapp)}</a>
          </div>
        </div>
      `);

      const select = card.querySelector('select');
      Object.entries(LEAD_STATUS_LABELS).forEach(([k, v]) => {
        const opt = document.createElement('option');
        opt.value = k; opt.textContent = v;
        if (k === lead.leadStatus) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        try {
          await api('leads', { method: 'PATCH', body: JSON.stringify({ id: lead.id, leadStatus: newStatus }) });
          lead.leadStatus = newStatus;
          showToast('Status pendaftar diperbarui.');
          draw();
        } catch (err) {
          showToast('Gagal memperbarui status.');
        }
      });

      wrap.appendChild(card);
    });

    container.appendChild(wrap);
  }

  draw();
}
