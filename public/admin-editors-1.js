// public/admin-editors-1.js
// Editors: Hero, Stats Bar, Why Join

function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderHeroEditor(container) {
  const data = CONTENT.hero;

  const top = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Pengaturan Umum Hero</strong></div>
        <div class="fieldGrid">
          <label class="label" style="grid-column:1/-1;">
            Badge kecil di atas headline
            <input class="input" id="heroBadge" value="${esc(data.badge)}">
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
          <label class="label" style="grid-column:1/-1;">
            Teks Social Proof (cth: Bergabung bersama 30+...)
            <input class="input" id="heroSocialText" value="${esc(data.socialProof.text)}">
          </label>
        </div>
      </div>

      <div id="heroSlidesList"></div>
      <button class="btnAdd" id="addSlideBtn">+ Tambah Slide</button>
    </div>
  `);
  container.appendChild(top);

  document.getElementById('heroBadge').addEventListener('input', e => { data.badge = e.target.value; });
  document.getElementById('heroCtaPrimaryLabel').addEventListener('input', e => { data.ctaPrimary.label = e.target.value; });
  document.getElementById('heroCtaPrimaryHref').addEventListener('input', e => { data.ctaPrimary.href = e.target.value; });
  document.getElementById('heroCtaSecondaryLabel').addEventListener('input', e => { data.ctaSecondary.label = e.target.value; });
  document.getElementById('heroCtaSecondaryHref').addEventListener('input', e => { data.ctaSecondary.href = e.target.value; });
  document.getElementById('heroSocialText').addEventListener('input', e => { data.socialProof.text = e.target.value; });

  renderSlidesList();

  function renderSlidesList() {
    const list = document.getElementById('heroSlidesList');
    list.innerHTML = '';
    data.slides.forEach((slide, i) => {
      const card = h(`
        <div class="card">
          <div class="cardHead">
            <strong>Slide ${i + 1}: ${esc(slide.headlineLines.join(' '))}</strong>
            <button class="btnDanger" data-action="remove">Hapus</button>
          </div>
          <div class="fieldGrid">
            <label class="label" style="grid-column:1/-1;">
              Baris Headline (satu per baris)
              <textarea class="textarea" rows="3" data-field="headlineLines">${esc(slide.headlineLines.join('\n'))}</textarea>
            </label>
            <label class="label">
              Baris ke berapa yang diwarnai hijau (mulai dari 1)
              <input class="input" type="number" min="1" data-field="headlineAccentIndex" value="${slide.headlineAccentIndex + 1}">
            </label>
            <div></div>
            <label class="label" style="grid-column:1/-1;">
              Subjudul
              <textarea class="textarea" rows="2" data-field="subtitle">${esc(slide.subtitle)}</textarea>
            </label>
            <label class="label">
              Label Stat (kecil, di atas angka)
              <input class="input" data-field="statLabel" value="${esc(slide.statLabel)}">
            </label>
            <label class="label">
              Nilai Stat (angka besar)
              <input class="input" data-field="statValue" value="${esc(slide.statValue)}">
            </label>
            <label class="label" style="grid-column:1/-1;">
              Deskripsi Stat
              <textarea class="textarea" rows="2" data-field="statDesc">${esc(slide.statDesc)}</textarea>
            </label>
            <label class="label">
              Icon Quote (emoji)
              <input class="input" data-field="quoteIcon" value="${esc(slide.quoteIcon)}" maxlength="4">
            </label>
            <label class="label">
              Teks Quote Card
              <input class="input" data-field="quoteText" value="${esc(slide.quoteText)}">
            </label>
          </div>
          <div id="heroSlideUpload-${i}"></div>
        </div>
      `);

      card.querySelectorAll('[data-field]').forEach(field => {
        field.addEventListener('input', e => {
          const key = e.target.dataset.field;
          if (key === 'headlineLines') {
            slide.headlineLines = e.target.value.split('\n').filter(Boolean);
          } else if (key === 'headlineAccentIndex') {
            slide.headlineAccentIndex = Math.max(0, (+e.target.value || 1) - 1);
          } else {
            slide[key] = e.target.value;
          }
        });
      });

      card.querySelector('[data-action="remove"]').addEventListener('click', () => {
        if (data.slides.length <= 1) { showToast('Minimal harus ada 1 slide.'); return; }
        if (!confirm('Hapus slide ini?')) return;
        data.slides.splice(i, 1);
        renderSlidesList();
      });

      attachUploadField(
        card.querySelector(`#heroSlideUpload-${i}`),
        'Ganti Foto Slide Ini',
        slide.image,
        url => { slide.image = url; }
      );

      list.appendChild(card);
    });
  }

  document.getElementById('addSlideBtn').addEventListener('click', () => {
    data.slides.push({
      id: `slide-${Date.now()}`,
      headlineLines: ['Judul', 'Slide', 'Baru.'],
      headlineAccentIndex: 2,
      subtitle: 'Deskripsi singkat slide ini.',
      image: 'https://picsum.photos/seed/rezznewslide' + Date.now() + '/1200/900',
      statLabel: 'Label Stat',
      statValue: '0',
      statDesc: 'Deskripsi stat ini.',
      quoteIcon: '🌱',
      quoteText: 'Teks quote card slide ini.',
    });
    renderSlidesList();
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
