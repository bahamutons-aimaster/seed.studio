// public/script.js
// Renders content.json into the landing page, handles FAQ accordion,
// gallery carousel, registration form submission, and page-view tracking.

function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.html !== undefined) node.innerHTML = opts.html;
  if (opts.text !== undefined) node.textContent = opts.text;
  return node;
}

function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadContent() {
  try {
    const res = await fetch('/api/content', { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch failed');
    return await res.json();
  } catch (e) {
    console.error('Gagal memuat konten.', e);
    return null;
  }
}

function waLink(number, text) {
  const msg = encodeURIComponent(text || 'Halo, saya mau tanya soal Creator Assistant Program.');
  return `https://wa.me/${number}?text=${msg}`;
}

const STAT_ICONS = {
  users: '👥', coffee: '☕', video: '🎬', star: '⭐', bolt: '⚡',
};

function render(data) {
  // ---- Nav / brand ----
  document.getElementById('brandIcon').textContent = data.brand.logoIcon;
  document.getElementById('brandName').textContent = data.brand.name;
  document.getElementById('footerBrandIcon').textContent = data.brand.logoIcon;
  document.getElementById('footerBrandName').textContent = data.brand.name;

  const navLinks = document.getElementById('navLinks');
  navLinks.innerHTML = data.nav.links.map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join('');
  document.getElementById('navCta').textContent = data.nav.ctaLabel;

  // ---- Hero ----
  document.getElementById('heroBadge').textContent = data.hero.badge;
  const lines = data.hero.headlineLines;
  document.getElementById('heroHeadline').innerHTML = lines
    .map((line, idx) => idx === data.hero.headlineAccentIndex ? `<span class="accent">${esc(line)}</span>` : esc(line))
    .join('<br>');
  document.getElementById('heroSub').textContent = data.hero.subtitle;
  document.getElementById('heroCtaPrimary').textContent = data.hero.ctaPrimary.label;
  document.getElementById('heroCtaPrimary').href = data.hero.ctaPrimary.href;
  document.getElementById('heroCtaSecondary').textContent = data.hero.ctaSecondary.label;
  document.getElementById('heroCtaSecondary').href = data.hero.ctaSecondary.href;
  document.getElementById('heroImage').src = data.hero.image;
  document.getElementById('heroQuoteIcon').textContent = data.hero.quoteCard.icon;
  document.getElementById('heroQuoteText').textContent = data.hero.quoteCard.text;
  document.getElementById('heroAvatars').innerHTML = data.hero.socialProof.avatars
    .map(a => `<img src="${a}" alt="">`).join('');
  document.getElementById('heroSocialText').textContent = data.hero.socialProof.text;

  // ---- Stats ----
  document.getElementById('statsBar').innerHTML = data.stats.map(s => `
    <div class="stat-item">
      <div class="stat-icon ${s.color}">${STAT_ICONS[s.icon] || '✨'}</div>
      <div class="stat-value">${esc(s.value)}</div>
      <div class="stat-label">${esc(s.label)}</div>
    </div>
  `).join('');

  // ---- Why join ----
  document.getElementById('whyJoinImage').src = data.whyJoin.image;
  document.getElementById('whyEyebrow').textContent = data.whyJoin.eyebrow;
  document.getElementById('whyHeading').innerHTML = `${esc(data.whyJoin.heading)} <span class="accent">${esc(data.whyJoin.headingAccent)}</span>`;
  document.getElementById('whyBody').textContent = data.whyJoin.body;
  document.getElementById('whyChecklist').innerHTML = data.whyJoin.checklist.map(c => `
    <div class="check-item"><span class="check-icon">✓</span><span>${esc(c)}</span></div>
  `).join('');
  document.getElementById('whyClosing').innerHTML = data.whyJoin.closingLine.replace(
    /(\S+)$/, '<span class="accent">$1</span>'
  );

  // ---- Benefits ----
  document.getElementById('benefitsEyebrow').textContent = data.benefits.eyebrow;
  document.getElementById('benefitsHeading').innerHTML = `${esc(data.benefits.heading)} <span class="accent">${esc(data.benefits.headingAccent)}</span>`;
  document.getElementById('benefitsGrid').innerHTML = data.benefits.items.map(b => `
    <div class="benefit-card">
      <div class="benefit-icon-wrap ${b.color}">${b.icon}</div>
      <div class="benefit-title ${b.color}">${esc(b.title)}</div>
      <div class="benefit-desc">${esc(b.desc)}</div>
    </div>
  `).join('');

  // ---- How it works ----
  document.getElementById('howEyebrow').textContent = data.howItWorks.eyebrow;
  document.getElementById('howHeading').innerHTML = `${esc(data.howItWorks.heading)} <span class="accent">${esc(data.howItWorks.headingAccent)}</span>`;
  document.getElementById('stepsRow').innerHTML = data.howItWorks.steps.map((s, i) => `
    <div class="step-item">
      <div class="step-num ${s.color}">${i + 1}</div>
      <div class="step-icon">${s.icon}</div>
      <div class="step-title">${esc(s.title)}</div>
      <div class="step-desc">${esc(s.desc)}</div>
      <div class="step-connector"></div>
    </div>
  `).join('');

  // ---- Gallery ----
  document.getElementById('galleryEyebrow').textContent = data.gallery.eyebrow;
  document.getElementById('galleryHeading').innerHTML = `${esc(data.gallery.heading)} <span class="accent">${esc(data.gallery.headingAccent)}</span>`;
  document.getElementById('galleryTrack').innerHTML = data.gallery.images.map(img => `<img src="${img}" alt="" loading="lazy">`).join('');
  setupGalleryCarousel();

  // ---- Requirements ----
  document.getElementById('reqEyebrow').textContent = data.requirements.eyebrow;
  document.getElementById('reqHeading').innerHTML = `${esc(data.requirements.heading)} <span class="accent">${esc(data.requirements.headingAccent)}</span>`;
  document.getElementById('reqList').innerHTML = data.requirements.list.map(r => `
    <li><span class="check-icon">✓</span><span>${esc(r)}</span></li>
  `).join('');

  // ---- FAQ ----
  document.getElementById('faqEyebrow').textContent = data.faq.eyebrow;
  document.getElementById('faqHeading').innerHTML = `${esc(data.faq.heading)} <span class="accent">${esc(data.faq.headingAccent)}</span>`;
  document.getElementById('faqList').innerHTML = data.faq.items.map((item, i) => `
    <div class="faq-item" data-i="${i}">
      <button class="faq-q" type="button">
        <span>${esc(item.q)}</span>
        <span class="faq-q-plus">+</span>
      </button>
      <div class="faq-a"><div class="faq-a-inner">${esc(item.a)}</div></div>
    </div>
  `).join('');
  setupFaqAccordion();

  // ---- Form ----
  document.getElementById('formEyebrow').textContent = data.form.eyebrow;
  document.getElementById('formHeading').innerHTML = `${esc(data.form.heading)} <span class="accent">${esc(data.form.headingAccent)}</span>`;
  document.getElementById('formSubmitBtn').textContent = data.form.submitLabel;
  document.getElementById('formConsent').textContent = data.form.consentText;

  // ---- Footer ----
  document.getElementById('footerTagline').textContent = data.footer.tagline;
  document.getElementById('footerSocials').innerHTML = data.footer.socials.map(s => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('');
  document.getElementById('footerQuickLinks').innerHTML = data.footer.quickLinks.map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join('');
  document.getElementById('footerLocation').textContent = data.footer.location;
  document.getElementById('footerEmail').textContent = data.footer.email;
  document.getElementById('footerCopyright').textContent = data.footer.copyright;

  const waHref = waLink(data.footer.whatsapp);
  document.getElementById('chatWaBtn').href = waHref;

  setupActiveNav();
}

function setupFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

function setupGalleryCarousel() {
  const track = document.getElementById('galleryTrack');
  const prevBtn = document.getElementById('galPrev');
  const nextBtn = document.getElementById('galNext');
  if (!track || !track.children.length) return;
  const itemWidth = 260 + 16; // image width + gap
  let position = 0;
  const maxScroll = Math.max(0, track.children.length * itemWidth - track.parentElement.offsetWidth);

  function update() {
    track.style.transform = `translateX(-${position}px)`;
  }
  nextBtn.addEventListener('click', () => {
    position = Math.min(position + itemWidth * 2, maxScroll);
    update();
  });
  prevBtn.addEventListener('click', () => {
    position = Math.max(position - itemWidth * 2, 0);
    update();
  });
}

function setupActiveNav() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  if (!sections.length || !navLinks.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });
  sections.forEach(s => observer.observe(s));
}

function setupChatBubble() {
  const bubble = document.getElementById('chatBubble');
  const panel = document.getElementById('chatPanel');
  bubble.addEventListener('click', () => {
    panel.classList.toggle('open');
    bubble.textContent = panel.classList.contains('open') ? '✕' : '💬';
  });
}

function setupForm() {
  const form = document.getElementById('regForm');
  const errBox = document.getElementById('formErr');
  const successBox = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('formSubmitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.style.display = 'none';

    const formData = new FormData(form);
    const umur = parseInt(formData.get('umur'), 10);
    if (isNaN(umur) || umur < 18) {
      errBox.textContent = 'Maaf, program ini hanya untuk usia 18 tahun ke atas.';
      errBox.style.display = 'block';
      return;
    }
    if (!formData.get('confirmAge')) {
      errBox.textContent = 'Mohon konfirmasi bahwa usia kamu 18 tahun ke atas.';
      errBox.style.display = 'block';
      return;
    }

    const payload = {
      nama: formData.get('nama'),
      umur: umur,
      domisili: formData.get('domisili'),
      status: formData.get('status'),
      instagram: formData.get('instagram'),
      whatsapp: formData.get('whatsapp'),
      alasan: formData.get('alasan'),
    };

    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Mengirim…';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal mengirim form.');
      }
      form.style.display = 'none';
      successBox.style.display = 'block';
      successBox.innerHTML = `
        <div class="form-success">
          <div class="form-success-icon">🌱</div>
          <h4>Pendaftaran Berhasil!</h4>
          <p>Terima kasih sudah mendaftar. Tim kami akan menghubungi kamu lewat WhatsApp untuk langkah selanjutnya.</p>
        </div>
      `;
    } catch (err) {
      errBox.textContent = err.message || 'Terjadi kesalahan. Coba lagi.';
      errBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

// ---- Page view tracking (fire and forget, never blocks rendering) ----
function trackPageView() {
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* tracking should never break the page */ }
}

(async function init() {
  const data = await loadContent();
  if (data) render(data);
  setupChatBubble();
  setupForm();
  trackPageView();
})();
