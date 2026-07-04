// public/admin.js
// Vanilla JS admin panel for rezz.vze landing page CMS.

const app = document.getElementById('app');
let CONTENT = null;
let AUTHED = false;

// ---------- helpers ----------
function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = h(`<div class="toast">${msg}</div>`);
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('hide'), 2200);
  setTimeout(() => toast.remove(), 2600);
}

async function api(path, opts = {}) {
  const res = await fetch(`/api/${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'same-origin',
  });
  return res;
}

async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
  if (!res.ok) throw new Error('Upload gagal');
  const data = await res.json();
  return data.url;
}

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

// ---------- LOGIN VIEW ----------
function renderLogin() {
  app.innerHTML = '';
  const node = h(`
    <div class="loginPage">
      <div class="loginCard">
        <div class="loginBrand">
          <span class="loginDot"></span>
          <span class="loginBrandName">REZZ.VZE ADMIN</span>
        </div>
        <h1 class="loginTitle">Selamat datang</h1>
        <p class="loginSub">Masuk untuk mengelola konten landing page.</p>
        <form id="loginForm">
          <input type="password" class="loginInput" id="pwInput" placeholder="Password" autocomplete="current-password" autofocus required>
          <div class="loginErr" id="loginErr" style="display:none;"></div>
          <button type="submit" class="loginBtn" id="loginBtn">Masuk ke Panel</button>
        </form>
      </div>
    </div>
  `);
  app.appendChild(node);

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('pwInput').value;
    const btn = document.getElementById('loginBtn');
    const errBox = document.getElementById('loginErr');
    btn.disabled = true;
    btn.textContent = 'Memeriksa...';
    errBox.style.display = 'none';
    try {
      const res = await api('auth', { method: 'POST', body: JSON.stringify({ password: pw }) });
      if (res.ok) {
        AUTHED = true;
        await boot();
      } else {
        const data = await res.json().catch(() => ({}));
        errBox.textContent = data.error || 'Password salah. Coba lagi.';
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Masuk ke Panel';
      }
    } catch (e) {
      errBox.textContent = 'Terjadi kesalahan. Coba lagi.';
      errBox.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Masuk ke Panel';
    }
  });
}

// ---------- SHELL ----------
const TABS = [
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'leads', label: 'Pendaftar', icon: '📨' },
  { id: 'hero', label: 'Hero', icon: '🖼️' },
  { id: 'stats', label: 'Stats Bar', icon: '🔢' },
  { id: 'whyJoin', label: 'Why Join', icon: '🌱' },
  { id: 'cafeSection', label: 'Cafe & Maps', icon: '☕' },
  { id: 'benefits', label: 'Benefits', icon: '💰' },
  { id: 'howItWorks', label: 'How It Works', icon: '🪜' },
  { id: 'gallery', label: 'Galeri', icon: '🎞️' },
  { id: 'requirements', label: 'Syarat', icon: '✅' },
  { id: 'faq', label: 'FAQ', icon: '❓' },
  { id: 'form', label: 'Form & Footer', icon: '⚙️' },
];

let currentTab = 'analytics';

function renderShell() {
  app.innerHTML = '';
  const node = h(`
    <div class="shell">
      <aside class="sidebar">
        <div class="sideHead">
          <span class="sideTitle">rezz.vze</span>
          <button class="logoutBtn" id="logoutBtn">✕ Logout</button>
        </div>
        <nav class="sideNav" id="sideNav"></nav>
        <a href="/" class="viewSite" target="_blank" rel="noopener">↗ Lihat Situs</a>
      </aside>
      <main class="main">
        <div class="topBar">
          <h2 class="pageTitle" id="pageTitle"></h2>
          <button class="saveBtn" id="saveBtn">💾 Simpan Semua</button>
        </div>
        <div id="tabContent"></div>
      </main>
    </div>
  `);
  app.appendChild(node);

  const sideNav = document.getElementById('sideNav');
  TABS.forEach(t => {
    const btn = h(`<button class="sideLink" data-tab="${t.id}"><span>${t.icon}</span><span>${t.label}</span></button>`);
    btn.addEventListener('click', () => { currentTab = t.id; renderTab(); });
    sideNav.appendChild(btn);
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('auth', { method: 'DELETE' });
    AUTHED = false;
    CONTENT = null;
    renderLogin();
  });

  document.getElementById('saveBtn').addEventListener('click', saveContent);

  renderTab();
}

async function saveContent() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan…';
  try {
    const res = await api('content', { method: 'PUT', body: JSON.stringify(CONTENT) });
    if (!res.ok) throw new Error('save failed');
    btn.textContent = '✓ Tersimpan!';
    showToast('Perubahan berhasil disimpan.');
  } catch (e) {
    btn.textContent = '✕ Gagal simpan';
    showToast('Gagal menyimpan. Coba lagi.');
  }
  setTimeout(() => { btn.disabled = false; btn.textContent = '💾 Simpan Semua'; }, 2000);
}

async function renderTab() {
  document.querySelectorAll('.sideLink').forEach(el => {
    el.classList.toggle('sideLinkActive', el.dataset.tab === currentTab);
  });
  const tab = TABS.find(t => t.id === currentTab);
  document.getElementById('pageTitle').textContent = tab.label;
  const container = document.getElementById('tabContent');
  container.innerHTML = '';

  const isDashboardTab = currentTab === 'analytics' || currentTab === 'leads';
  document.getElementById('saveBtn').style.display = isDashboardTab ? 'none' : 'inline-flex';

  // Capture the tab this render was requested for, so a stale async
  // response can't overwrite a newer tab the user has since switched to.
  const requestedTab = currentTab;

  const renderers = {
    analytics: renderAnalyticsTab,
    leads: renderLeadsTab,
    hero: renderHeroEditor,
    stats: renderStatsEditor,
    whyJoin: renderWhyJoinEditor,
    cafeSection: renderCafeSectionEditor,
    benefits: renderBenefitsEditor,
    howItWorks: renderHowItWorksEditor,
    gallery: renderGalleryEditor,
    requirements: renderRequirementsEditor,
    faq: renderFaqEditor,
    form: renderFormFooterEditor,
  };
  await renderers[currentTab](container);
  if (requestedTab !== currentTab) {
    // user navigated away before this finished — don't leave stale content visible
    return;
  }
}

// ---------- UPLOAD FIELD COMPONENT ----------
function attachUploadField(container, label, currentUrl, onUploaded) {
  const wrap = h(`
    <div class="uploadRow">
      ${currentUrl ? `<img src="${currentUrl}" class="previewImg" alt="">` : ''}
      <label class="uploadLabel">
        <input type="file" accept="image/*" class="fileInput">
        <span class="uploadLabelText">📎 ${label}</span>
      </label>
    </div>
  `);
  const input = wrap.querySelector('.fileInput');
  const labelText = wrap.querySelector('.uploadLabelText');
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    labelText.textContent = 'Uploading…';
    try {
      const url = await uploadFile(file);
      onUploaded(url);
      labelText.textContent = '✓ Berhasil diupload!';
      setTimeout(() => { labelText.textContent = `📎 ${label}`; }, 2000);
      renderTab(); // re-render to show new preview
    } catch (err) {
      labelText.textContent = '✕ Upload gagal';
      setTimeout(() => { labelText.textContent = `📎 ${label}`; }, 2000);
    }
    input.value = '';
  });
  container.appendChild(wrap);
}

// ---------- BOOT ----------
async function boot() {
  const contentRes = await api('content');
  CONTENT = await contentRes.json();
  renderShell();
}

async function init() {
  try {
    const res = await api('auth');
    const data = await res.json();
    AUTHED = !!data.authed;
  } catch (e) {
    AUTHED = false;
  }
  if (AUTHED) {
    await boot();
  } else {
    renderLogin();
  }
}

init();
