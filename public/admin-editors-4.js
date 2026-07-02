// public/admin-editors-4.js
// Editors: FAQ, Form & Footer

function renderFaqEditor(container) {
  const data = CONTENT.faq;

  const top = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Heading Section</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="faqEyebrow" value="${esc(data.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading
            <input class="input" id="faqHeading" value="${esc(data.heading)}">
          </label>
          <label class="label">
            Heading Accent
            <input class="input" id="faqHeadingAccent" value="${esc(data.headingAccent)}">
          </label>
        </div>
      </div>
      <div id="faqItemsList"></div>
      <button class="btnAdd" id="addFaqBtn">+ Tambah Pertanyaan</button>
    </div>
  `);
  container.appendChild(top);

  document.getElementById('faqEyebrow').addEventListener('input', (e) => { data.eyebrow = e.target.value; });
  document.getElementById('faqHeading').addEventListener('input', (e) => { data.heading = e.target.value; });
  document.getElementById('faqHeadingAccent').addEventListener('input', (e) => { data.headingAccent = e.target.value; });

  renderList();

  function renderList() {
    const list = document.getElementById('faqItemsList');
    list.innerHTML = '';
    data.items.forEach((item, i) => {
      const card = h(`
        <div class="card">
          <div class="cardHead">
            <strong>Q${i + 1}: ${esc(item.q)}</strong>
            <button class="btnDanger" data-action="remove">Hapus</button>
          </div>
          <div class="fieldGrid">
            <label class="label" style="grid-column:1/-1;">
              Pertanyaan
              <input class="input" data-field="q" value="${esc(item.q)}">
            </label>
            <label class="label" style="grid-column:1/-1;">
              Jawaban
              <textarea class="textarea" rows="3" data-field="a">${esc(item.a)}</textarea>
            </label>
          </div>
        </div>
      `);
      card.querySelectorAll('[data-field]').forEach(field => {
        field.addEventListener('input', (e) => { item[e.target.dataset.field] = e.target.value; });
      });
      card.querySelector('[data-action="remove"]').addEventListener('click', () => {
        if (data.items.length <= 1) { showToast('Minimal harus ada 1 FAQ.'); return; }
        if (!confirm('Hapus FAQ ini?')) return;
        data.items.splice(i, 1);
        renderList();
      });
      list.appendChild(card);
    });
  }

  document.getElementById('addFaqBtn').addEventListener('click', () => {
    data.items.push({ q: 'Pertanyaan baru?', a: 'Jawaban untuk pertanyaan baru ini.' });
    renderList();
  });
}

function renderFormFooterEditor(container) {
  const form = CONTENT.form;
  const footer = CONTENT.footer;
  const brand = CONTENT.brand;
  const nav = CONTENT.nav;

  const card = h(`
    <div class="editorList">
      <div class="card">
        <div class="cardHead"><strong>Brand</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Icon / Emoji Logo
            <input class="input" id="brandIcon" value="${esc(brand.logoIcon)}" maxlength="4">
          </label>
          <label class="label">
            Nama Brand
            <input class="input" id="brandName" value="${esc(brand.name)}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Teks Tombol CTA di Navbar
            <input class="input" id="navCtaLabel" value="${esc(nav.ctaLabel)}">
          </label>
        </div>
      </div>

      <div class="card">
        <div class="cardHead"><strong>Form Pendaftaran</strong></div>
        <div class="fieldGrid">
          <label class="label">
            Eyebrow
            <input class="input" id="formEyebrow" value="${esc(form.eyebrow)}">
          </label>
          <div></div>
          <label class="label">
            Heading
            <input class="input" id="formHeading" value="${esc(form.heading)}">
          </label>
          <label class="label">
            Heading Accent
            <input class="input" id="formHeadingAccent" value="${esc(form.headingAccent)}">
          </label>
          <label class="label">
            Teks Tombol Submit
            <input class="input" id="formSubmitLabel" value="${esc(form.submitLabel)}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Teks Consent (di bawah tombol submit)
            <input class="input" id="formConsentText" value="${esc(form.consentText)}">
          </label>
        </div>
      </div>

      <div class="card">
        <div class="cardHead"><strong>Footer</strong></div>
        <div class="fieldGrid">
          <label class="label" style="grid-column:1/-1;">
            Tagline Footer
            <textarea class="textarea" rows="2" id="footerTagline">${esc(footer.tagline)}</textarea>
          </label>
          <label class="label">
            Lokasi
            <input class="input" id="footerLocation" value="${esc(footer.location)}">
          </label>
          <label class="label">
            Email
            <input class="input" id="footerEmail" value="${esc(footer.email)}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Nomor WhatsApp (format: 628xxxxxxxxxx)
            <input class="input" id="footerWhatsapp" value="${esc(footer.whatsapp)}">
          </label>
          <label class="label" style="grid-column:1/-1;">
            Teks Copyright
            <input class="input" id="footerCopyright" value="${esc(footer.copyright)}">
          </label>
        </div>
      </div>
    </div>
  `);
  container.appendChild(card);

  document.getElementById('brandIcon').addEventListener('input', (e) => { brand.logoIcon = e.target.value; });
  document.getElementById('brandName').addEventListener('input', (e) => { brand.name = e.target.value; });
  document.getElementById('navCtaLabel').addEventListener('input', (e) => { nav.ctaLabel = e.target.value; });

  document.getElementById('formEyebrow').addEventListener('input', (e) => { form.eyebrow = e.target.value; });
  document.getElementById('formHeading').addEventListener('input', (e) => { form.heading = e.target.value; });
  document.getElementById('formHeadingAccent').addEventListener('input', (e) => { form.headingAccent = e.target.value; });
  document.getElementById('formSubmitLabel').addEventListener('input', (e) => { form.submitLabel = e.target.value; });
  document.getElementById('formConsentText').addEventListener('input', (e) => { form.consentText = e.target.value; });

  document.getElementById('footerTagline').addEventListener('input', (e) => { footer.tagline = e.target.value; });
  document.getElementById('footerLocation').addEventListener('input', (e) => { footer.location = e.target.value; });
  document.getElementById('footerEmail').addEventListener('input', (e) => { footer.email = e.target.value; });
  document.getElementById('footerWhatsapp').addEventListener('input', (e) => { footer.whatsapp = e.target.value.replace(/[^0-9]/g, ''); });
  document.getElementById('footerCopyright').addEventListener('input', (e) => { footer.copyright = e.target.value; });
}
