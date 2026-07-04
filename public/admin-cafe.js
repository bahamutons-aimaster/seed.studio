// public/admin-cafe.js
// Editor: Cafe Section (maps embed, areas, logo marquee, photo marquee)

function renderCafeSectionEditor(container) {
  const data = CONTENT.cafeSection;

  const top = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Heading & Info</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="cafeEyebrow" value="${esc(data.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading
            <input class="input" id="cafeHeading" value="${esc(data.heading)}">
          </label>
          <label class="label">
            Heading Accent (hijau)
            <input class="input" id="cafeHeadingAccent" value="${esc(data.headingAccent)}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Subjudul
            <textarea class="textarea" rows="2" id="cafeSubtitle">${esc(data.subtitle)}</textarea>
          </label>
          <label class="label" style="grid-column:1/-1;">
            Area Coverage (pisahkan dengan koma)
            <input class="input" id="cafeAreas" value="${esc(data.areas.join(', '))}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Google Maps Embed URL
            <textarea class="textarea" rows="3" id="cafeMapsUrl" style="font-family:var(--mono); font-size:0.76rem;">${esc(data.mapsEmbedUrl)}</textarea>
          </label>
        </div>
        <div style="margin-top:14px; padding:14px; background:rgba(74,222,128,0.06); border-radius:8px; font-size:0.78rem; color:var(--muted); line-height:1.6;">
          Cara dapat Maps Embed URL: buka Google Maps → cari area → klik Share → Embed a map → copy URL dari src="..." di dalam kode iframe yang muncul.
        </div>
      </div>

      <div class="card">
        <div class="cardHead"><strong>Logo Cafe (Marquee Kanan ke Kiri)</strong></div>
        <div id="cafeLogosList"></div>
        <button class="btnAdd" id="addCafeLogoBtn" style="margin-top:14px;">+ Tambah Logo</button>
      </div>

      <div class="card">
        <div class="cardHead"><strong>Foto Cafe (Marquee Kiri ke Kanan)</strong></div>
        <div id="cafePhotosList" style="display:grid; grid-template-columns:1fr 1fr; gap:14px;"></div>
        <button class="btnAdd" id="addCafePhotoBtn" style="margin-top:14px;">+ Tambah Foto</button>
      </div>
    </div>
  `);
  container.appendChild(top);

  document.getElementById('cafeEyebrow').addEventListener('input', e => { data.eyebrow = e.target.value; });
  document.getElementById('cafeHeading').addEventListener('input', e => { data.heading = e.target.value; });
  document.getElementById('cafeHeadingAccent').addEventListener('input', e => { data.headingAccent = e.target.value; });
  document.getElementById('cafeSubtitle').addEventListener('input', e => { data.subtitle = e.target.value; });
  document.getElementById('cafeAreas').addEventListener('input', e => {
    data.areas = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
  });
  document.getElementById('cafeMapsUrl').addEventListener('input', e => { data.mapsEmbedUrl = e.target.value; });

  renderLogosList();
  renderPhotosList();

  function renderLogosList() {
    const list = document.getElementById('cafeLogosList');
    list.innerHTML = '';
    data.cafeLogos.forEach((logo, i) => {
      const row = h(`
        <div style="display:flex; gap:12px; align-items:center; padding:10px 0; border-bottom:1px solid var(--line);">
          ${logo.logo ? `<img src="${logo.logo}" style="width:60px; height:40px; object-fit:contain; border-radius:6px; background:var(--bg-card); border:1px solid var(--line); flex-shrink:0;">` : '<div style="width:60px; height:40px; background:var(--bg-card); border-radius:6px; border:1px solid var(--line); flex-shrink:0;"></div>'}
          <input class="input" value="${esc(logo.name)}" placeholder="Nama cafe" style="flex:1;">
          <button class="btnDanger" data-action="remove">Hapus</button>
          <div data-upload-slot></div>
        </div>
      `);
      row.querySelector('input').addEventListener('input', e => { logo.name = e.target.value; });
      row.querySelector('[data-action="remove"]').addEventListener('click', () => {
        data.cafeLogos.splice(i, 1); renderLogosList();
      });
      attachUploadField(row.querySelector('[data-upload-slot]'), 'Upload Logo', logo.logo, url => {
        logo.logo = url; renderLogosList();
      });
      list.appendChild(row);
    });
  }

  document.getElementById('addCafeLogoBtn').addEventListener('click', () => {
    data.cafeLogos.push({ name: 'Nama Cafe', logo: '' });
    renderLogosList();
  });

  function renderPhotosList() {
    const list = document.getElementById('cafePhotosList');
    list.innerHTML = '';
    data.cafePhotos.forEach((photo, i) => {
      const card = h(`
        <div class="card">
          <div class="cardHead">
            <strong>Foto ${i + 1}</strong>
            <button class="btnDanger" data-action="remove">Hapus</button>
          </div>
          <div id="cafePhotoSlot-${i}"></div>
        </div>
      `);
      card.querySelector('[data-action="remove"]').addEventListener('click', () => {
        data.cafePhotos.splice(i, 1); renderPhotosList();
      });
      list.appendChild(card);
      attachUploadField(
        card.querySelector(`#cafePhotoSlot-${i}`),
        'Upload Foto Cafe', photo,
        url => { data.cafePhotos[i] = url; }
      );
    });
  }

  document.getElementById('addCafePhotoBtn').addEventListener('click', () => {
    data.cafePhotos.push('');
    renderPhotosList();
  });
}
