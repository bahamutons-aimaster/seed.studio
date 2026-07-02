// public/admin-editors-3.js
// Editors: Gallery, Requirements

function renderGalleryEditor(container) {
  const data = CONTENT.gallery;

  const top = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Heading Galeri</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="galEyebrow" value="${esc(data.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading
            <input class="input" id="galHeading" value="${esc(data.heading)}">
          </label>
          <label class="label">
            Heading Accent
            <input class="input" id="galHeadingAccent" value="${esc(data.headingAccent)}">
          </label>
        </div>
      </div>
      <div id="galImagesList" style="display:grid; grid-template-columns: repeat(2,1fr); gap:16px;"></div>
      <button class="btnAdd" id="addGalImgBtn">+ Tambah Foto Galeri</button>
    </div>
  `);
  container.appendChild(top);

  document.getElementById('galEyebrow').addEventListener('input', (e) => { data.eyebrow = e.target.value; });
  document.getElementById('galHeading').addEventListener('input', (e) => { data.heading = e.target.value; });
  document.getElementById('galHeadingAccent').addEventListener('input', (e) => { data.headingAccent = e.target.value; });

  renderImagesList();

  function renderImagesList() {
    const list = document.getElementById('galImagesList');
    list.innerHTML = '';
    data.images.forEach((img, i) => {
      const card = h(`
        <div class="card">
          <div class="cardHead">
            <strong>Foto ${i + 1}</strong>
            <button class="btnDanger" data-action="remove">Hapus</button>
          </div>
          <div id="galSlot-${i}"></div>
        </div>
      `);
      card.querySelector('[data-action="remove"]').addEventListener('click', () => {
        if (data.images.length <= 1) { showToast('Minimal harus ada 1 foto.'); return; }
        if (!confirm('Hapus foto ini?')) return;
        data.images.splice(i, 1);
        renderImagesList();
      });
      list.appendChild(card);
      attachUploadField(card.querySelector(`#galSlot-${i}`), 'Ganti Foto', img, (url) => { data.images[i] = url; });
    });
  }

  document.getElementById('addGalImgBtn').addEventListener('click', () => {
    data.images.push('https://picsum.photos/seed/rezznew' + Date.now() + '/500/650');
    renderImagesList();
  });
}

function renderRequirementsEditor(container) {
  const data = CONTENT.requirements;

  const top = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Heading Section</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="reqEyebrow" value="${esc(data.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading
            <input class="input" id="reqHeading" value="${esc(data.heading)}">
          </label>
          <label class="label">
            Heading Accent
            <input class="input" id="reqHeadingAccent" value="${esc(data.headingAccent)}">
          </label>
        </div>
        <div style="margin-top:14px; padding:14px; background:rgba(232,199,90,0.08); border-radius:8px; font-size:0.82rem; color:var(--muted); line-height:1.6;">
          Catatan: syarat di bawah ini sengaja tidak menyertakan kriteria gender atau target usia sekolah menengah, sesuai kesepakatan sebelumnya. Disarankan tetap dipertahankan demikian.
        </div>
      </div>

      <div class="card">
        <div class="cardHead"><strong>Daftar Syarat</strong></div>
        <div id="reqListItems"></div>
        <button class="btnAdd" id="addReqBtn" style="margin-top:14px;">+ Tambah Syarat</button>
      </div>
    </div>
  `);
  container.appendChild(top);

  document.getElementById('reqEyebrow').addEventListener('input', (e) => { data.eyebrow = e.target.value; });
  document.getElementById('reqHeading').addEventListener('input', (e) => { data.heading = e.target.value; });
  document.getElementById('reqHeadingAccent').addEventListener('input', (e) => { data.headingAccent = e.target.value; });

  renderReqList();

  function renderReqList() {
    const list = document.getElementById('reqListItems');
    list.innerHTML = '';
    data.list.forEach((r, i) => {
      const row = h(`
        <div style="border-bottom:1px solid var(--line); padding:12px 0; display:flex; gap:10px; align-items:start;">
          <span style="font-family:var(--mono); color:var(--green); font-size:0.78rem; padding-top:10px;">${String(i + 1).padStart(2, '0')}</span>
          <textarea class="textarea" rows="2" style="flex:1;">${esc(r)}</textarea>
          <button class="btnDanger" data-action="remove" style="margin-top:2px;">Hapus</button>
        </div>
      `);
      row.querySelector('textarea').addEventListener('input', (e) => { data.list[i] = e.target.value; });
      row.querySelector('[data-action="remove"]').addEventListener('click', () => {
        if (data.list.length <= 1) { showToast('Minimal harus ada 1 syarat.'); return; }
        if (!confirm('Hapus syarat ini?')) return;
        data.list.splice(i, 1);
        renderReqList();
      });
      list.appendChild(row);
    });
  }

  document.getElementById('addReqBtn').addEventListener('click', () => {
    data.list.push('Syarat baru di sini.');
    renderReqList();
  });
}
