// public/admin-editors-2.js
// Editors: Benefits, How It Works

function renderBenefitsEditor(container) {
  const data = CONTENT.benefits;
  const colorOptions = ['green', 'blue', 'orange', 'gold', 'purple'];

  const top = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Heading Section</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="benEyebrow" value="${esc(data.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading
            <input class="input" id="benHeading" value="${esc(data.heading)}">
          </label>
          <label class="label">
            Heading Accent
            <input class="input" id="benHeadingAccent" value="${esc(data.headingAccent)}">
          </label>
        </div>
      </div>
      <div id="benItemsList"></div>
      <button class="btnAdd" id="addBenItemBtn">+ Tambah Benefit</button>
    </div>
  `);
  container.appendChild(top);

  document.getElementById('benEyebrow').addEventListener('input', (e) => { data.eyebrow = e.target.value; });
  document.getElementById('benHeading').addEventListener('input', (e) => { data.heading = e.target.value; });
  document.getElementById('benHeadingAccent').addEventListener('input', (e) => { data.headingAccent = e.target.value; });

  renderItemsList();

  function renderItemsList() {
    const list = document.getElementById('benItemsList');
    list.innerHTML = '';
    data.items.forEach((item, i) => {
      const card = h(`
        <div class="card">
          <div class="cardHead">
            <strong>${item.icon} ${esc(item.title)}</strong>
            <button class="btnDanger" data-action="remove">Hapus</button>
          </div>
          <div class="fieldGrid">
            <label class="label">
              Emoji / Icon
              <input class="input" data-field="icon" value="${esc(item.icon)}" maxlength="4">
            </label>
            <label class="label">
              Warna
              <select class="select" data-field="color">
                ${colorOptions.map(o => `<option value="${o}" ${item.color === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </label>
            <label class="label" style="grid-column:1/-1;">
              Judul
              <input class="input" data-field="title" value="${esc(item.title)}">
            </label>
            <label class="label" style="grid-column:1/-1;">
              Deskripsi
              <textarea class="textarea" rows="2" data-field="desc">${esc(item.desc)}</textarea>
            </label>
          </div>
        </div>
      `);
      card.querySelectorAll('[data-field]').forEach(field => {
        field.addEventListener('input', (e) => { item[e.target.dataset.field] = e.target.value; });
        field.addEventListener('change', (e) => { item[e.target.dataset.field] = e.target.value; });
      });
      card.querySelector('[data-action="remove"]').addEventListener('click', () => {
        if (data.items.length <= 1) { showToast('Minimal harus ada 1 benefit.'); return; }
        if (!confirm('Hapus benefit ini?')) return;
        data.items.splice(i, 1);
        renderItemsList();
      });
      list.appendChild(card);
    });
  }

  document.getElementById('addBenItemBtn').addEventListener('click', () => {
    data.items.push({ icon: '✨', title: 'Benefit Baru', desc: 'Deskripsi benefit baru ini.', color: 'green' });
    renderItemsList();
  });
}

function renderHowItWorksEditor(container) {
  const data = CONTENT.howItWorks;
  const colorOptions = ['green', 'blue', 'orange', 'purple'];

  const top = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Heading Section</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="hiwEyebrow" value="${esc(data.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading
            <input class="input" id="hiwHeading" value="${esc(data.heading)}">
          </label>
          <label class="label">
            Heading Accent
            <input class="input" id="hiwHeadingAccent" value="${esc(data.headingAccent)}">
          </label>
        </div>
      </div>
      <div id="stepsListWrap"></div>
      <button class="btnAdd" id="addStepBtn">+ Tambah Langkah</button>
    </div>
  `);
  container.appendChild(top);

  document.getElementById('hiwEyebrow').addEventListener('input', (e) => { data.eyebrow = e.target.value; });
  document.getElementById('hiwHeading').addEventListener('input', (e) => { data.heading = e.target.value; });
  document.getElementById('hiwHeadingAccent').addEventListener('input', (e) => { data.headingAccent = e.target.value; });

  renderStepsList();

  function renderStepsList() {
    const list = document.getElementById('stepsListWrap');
    list.innerHTML = '';
    data.steps.forEach((step, i) => {
      const card = h(`
        <div class="card">
          <div class="cardHead">
            <strong>Langkah ${i + 1}: ${esc(step.title)}</strong>
            <button class="btnDanger" data-action="remove">Hapus</button>
          </div>
          <div class="fieldGrid">
            <label class="label">
              Emoji / Icon
              <input class="input" data-field="icon" value="${esc(step.icon)}" maxlength="4">
            </label>
            <label class="label">
              Warna Nomor
              <select class="select" data-field="color">
                ${colorOptions.map(o => `<option value="${o}" ${step.color === o ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </label>
            <label class="label" style="grid-column:1/-1;">
              Judul Langkah
              <input class="input" data-field="title" value="${esc(step.title)}">
            </label>
            <label class="label" style="grid-column:1/-1;">
              Deskripsi
              <textarea class="textarea" rows="2" data-field="desc">${esc(step.desc)}</textarea>
            </label>
          </div>
        </div>
      `);
      card.querySelectorAll('[data-field]').forEach(field => {
        field.addEventListener('input', (e) => { step[e.target.dataset.field] = e.target.value; });
        field.addEventListener('change', (e) => { step[e.target.dataset.field] = e.target.value; });
      });
      card.querySelector('[data-action="remove"]').addEventListener('click', () => {
        if (data.steps.length <= 1) { showToast('Minimal harus ada 1 langkah.'); return; }
        if (!confirm('Hapus langkah ini?')) return;
        data.steps.splice(i, 1);
        renderStepsList();
      });
      list.appendChild(card);
    });
  }

  document.getElementById('addStepBtn').addEventListener('click', () => {
    data.steps.push({ icon: '✨', title: 'Langkah Baru', desc: 'Deskripsi langkah baru ini.', color: 'green' });
    renderStepsList();
  });
}
