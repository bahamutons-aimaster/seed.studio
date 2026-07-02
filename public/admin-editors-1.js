// public/admin-editors-1.js
// Editors: Hero, Stats Bar, Why Join

function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderHeroEditor(container) {
  const data = CONTENT.hero;

  const card = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Hero Section</strong></div>
        <div class="fieldGrid">
          <label class="label" style="grid-column:1/-1;">
            Badge kecil di atas headline
            <input class="input" id="heroBadge" value="${esc(data.badge)}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Baris Headline (satu per baris)
            <textarea class="textarea" rows="3" id="heroHeadlineLines">${esc(data.headlineLines.join('\n'))}</textarea>
          </label>
          <label class="label">
            Baris ke berapa yang diwarnai hijau (mulai dari 1)
            <input class="input" type="number" min="1" id="heroAccentIndex" value="${data.headlineAccentIndex + 1}">
          </label>
          <div></div>
          <label class="label" style="grid-column:1/-1;">
            Subjudul
            <textarea class="textarea" rows="3" id="heroSub">${esc(data.subtitle)}</textarea>
          </label>
          <label class="label">
            Teks Tombol CTA Utama
            <input class="input" id="heroCtaPrimaryLabel" value="${esc(data.ctaPrimary.label)}">
          </label>
          <label class="label">
            Link Tombol CTA Utama
            <input class="input" id="heroCtaPrimaryHref" value="${esc(data.ctaPrimary.href)}">
          </label>
          <label class="label">
            Teks Tombol CTA Sekunder
            <input class="input" id="heroCtaSecondaryLabel" value="${esc(data.ctaSecondary.label)}">
          </label>
          <label class="label">
            Link Tombol CTA Sekunder
            <input class="input" id="heroCtaSecondaryHref" value="${esc(data.ctaSecondary.href)}">
          </label>
        </div>
        <div id="heroImgUpload"></div>
      </div>

      <div class="card">
        <div class="cardHead"><strong>Quote Card (overlay di foto)</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Icon / Emoji
            <input class="input" id="heroQuoteIcon" value="${esc(data.quoteCard.icon)}" maxlength="4">
          </label>
          <div></div>
          <label class="label" style="grid-column:1/-1;">
            Teks Quote
            <textarea class="textarea" rows="2" id="heroQuoteText">${esc(data.quoteCard.text)}</textarea>
          </label>
        </div>
      </div>

      <div class="card">
        <div class="cardHead"><strong>Social Proof (avatar + teks "bergabung bersama...")</strong></div>
        <label class="label" style="margin-bottom:14px;">
          Teks Social Proof
          <input class="input" id="heroSocialText" value="${esc(data.socialProof.text)}">
        </label>
        <div id="avatarUploads" style="display:grid; grid-template-columns:repeat(3,1fr); gap:14px;"></div>
      </div>
    </div>
  `);
  container.appendChild(card);

  document.getElementById('heroBadge').addEventListener('input', (e) => { data.badge = e.target.value; });
  document.getElementById('heroHeadlineLines').addEventListener('input', (e) => {
    data.headlineLines = e.target.value.split('\n').filter(Boolean);
  });
  document.getElementById('heroAccentIndex').addEventListener('input', (e) => {
    data.headlineAccentIndex = Math.max(0, (+e.target.value || 1) - 1);
  });
  document.getElementById('heroSub').addEventListener('input', (e) => { data.subtitle = e.target.value; });
  document.getElementById('heroCtaPrimaryLabel').addEventListener('input', (e) => { data.ctaPrimary.label = e.target.value; });
  document.getElementById('heroCtaPrimaryHref').addEventListener('input', (e) => { data.ctaPrimary.href = e.target.value; });
  document.getElementById('heroCtaSecondaryLabel').addEventListener('input', (e) => { data.ctaSecondary.label = e.target.value; });
  document.getElementById('heroCtaSecondaryHref').addEventListener('input', (e) => { data.ctaSecondary.href = e.target.value; });
  document.getElementById('heroQuoteIcon').addEventListener('input', (e) => { data.quoteCard.icon = e.target.value; });
  document.getElementById('heroQuoteText').addEventListener('input', (e) => { data.quoteCard.text = e.target.value; });
  document.getElementById('heroSocialText').addEventListener('input', (e) => { data.socialProof.text = e.target.value; });

  attachUploadField(document.getElementById('heroImgUpload'), 'Ganti Foto Hero Utama', data.image, (url) => { data.image = url; });

  const avatarWrap = document.getElementById('avatarUploads');
  data.socialProof.avatars.forEach((avatar, i) => {
    const slot = h(`<div></div>`);
    avatarWrap.appendChild(slot);
    attachUploadField(slot, `Avatar ${i + 1}`, avatar, (url) => { data.socialProof.avatars[i] = url; });
  });
}

function renderStatsEditor(container) {
  const data = CONTENT.stats;
  const colorOptions = ['green', 'blue', 'orange', 'gold', 'purple'];
  const iconOptions = ['users', 'coffee', 'video', 'star', 'bolt'];

  const top = h(`<div class="editorList"><div id="statsList"></div><button class="btnAdd" id="addStatBtn">+ Tambah Stat</button></div>`);
  container.appendChild(top);

  renderList();

  function renderList() {
    const list = document.getElementById('statsList');
    list.innerHTML = '';
    data.forEach((stat, i) => {
      const card = h(`
        <div class="card">
          <div class="cardHead">
            <strong>${esc(stat.value)} — ${esc(stat.label)}</strong>
            <button class="btnDanger" data-action="remove">Hapus</button>
          </div>
          <div class="fieldGrid">
            <label class="label">
              Icon
              <select class="select" data-field="icon">
                ${iconOptions.map(o => `<option value="${o}" ${stat.icon === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </label>
            <label class="label">
              Warna
              <select class="select" data-field="color">
                ${colorOptions.map(o => `<option value="${o}" ${stat.color === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </label>
            <label class="label">
              Nilai (cth: 30+, 4.9/5)
              <input class="input" data-field="value" value="${esc(stat.value)}">
            </label>
            <label class="label">
              Label
              <input class="input" data-field="label" value="${esc(stat.label)}">
            </label>
          </div>
        </div>
      `);
      card.querySelectorAll('[data-field]').forEach(field => {
        field.addEventListener('input', (e) => { stat[e.target.dataset.field] = e.target.value; });
        field.addEventListener('change', (e) => { stat[e.target.dataset.field] = e.target.value; });
      });
      card.querySelector('[data-action="remove"]').addEventListener('click', () => {
        if (data.length <= 1) { showToast('Minimal harus ada 1 stat.'); return; }
        if (!confirm('Hapus stat ini?')) return;
        data.splice(i, 1);
        renderList();
      });
      list.appendChild(card);
    });
  }

  document.getElementById('addStatBtn').addEventListener('click', () => {
    data.push({ icon: 'star', value: '0', label: 'Label baru', color: 'green' });
    renderList();
  });
}

function renderWhyJoinEditor(container) {
  const data = CONTENT.whyJoin;

  const card = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Why Join Section</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="wjEyebrow" value="${esc(data.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading (bagian putih)
            <input class="input" id="wjHeading" value="${esc(data.heading)}">
          </label>
          <label class="label">
            Heading Accent (bagian hijau)
            <input class="input" id="wjHeadingAccent" value="${esc(data.headingAccent)}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Body Paragraf
            <textarea class="textarea" rows="3" id="wjBody">${esc(data.body)}</textarea>
          </label>
          <label class="label" style="grid-column:1/-1;">
            Checklist Pain Point (satu per baris)
            <textarea class="textarea" rows="6" id="wjChecklist">${esc(data.checklist.join('\n'))}</textarea>
          </label>
          <label class="label" style="grid-column:1/-1;">
            Kalimat Penutup
            <input class="input" id="wjClosing" value="${esc(data.closingLine)}">
          </label>
        </div>
        <div id="wjImgUpload"></div>
      </div>
    </div>
  `);
  container.appendChild(card);

  document.getElementById('wjEyebrow').addEventListener('input', (e) => { data.eyebrow = e.target.value; });
  document.getElementById('wjHeading').addEventListener('input', (e) => { data.heading = e.target.value; });
  document.getElementById('wjHeadingAccent').addEventListener('input', (e) => { data.headingAccent = e.target.value; });
  document.getElementById('wjBody').addEventListener('input', (e) => { data.body = e.target.value; });
  document.getElementById('wjChecklist').addEventListener('input', (e) => {
    data.checklist = e.target.value.split('\n').filter(Boolean);
  });
  document.getElementById('wjClosing').addEventListener('input', (e) => { data.closingLine = e.target.value; });

  attachUploadField(document.getElementById('wjImgUpload'), 'Ganti Foto Section Ini', data.image, (url) => { data.image = url; });
}
