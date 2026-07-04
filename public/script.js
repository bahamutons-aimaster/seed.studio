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

function render(data) {
  // ---- Nav / brand ----
  function renderBrandIcon(el) {
    if (data.brand.logoSvg && data.brand.logoSvg.trim().startsWith('<')) {
      el.innerHTML = data.brand.logoSvg;
      el.style.fontSize = '';
    } else {
      el.textContent = data.brand.logoIcon || '🌱';
    }
  }
  renderBrandIcon(document.getElementById('brandIcon'));
  renderBrandIcon(document.getElementById('footerBrandIcon'));
  document.getElementById('brandName').textContent = data.brand.name;
  document.getElementById('footerBrandName').textContent = data.brand.name;

  const navLinks = document.getElementById('navLinks');
  navLinks.innerHTML = data.nav.links.map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join('');
  document.getElementById('navCta').textContent = data.nav.ctaLabel;

  // ---- Hero ----
  document.getElementById('heroBadge').textContent = data.hero.badge;
  document.getElementById('heroCtaPrimary').textContent = data.hero.ctaPrimary.label;
  document.getElementById('heroCtaPrimary').href = data.hero.ctaPrimary.href;
  document.getElementById('heroCtaSecondary').textContent = data.hero.ctaSecondary.label;
  document.getElementById('heroCtaSecondary').href = data.hero.ctaSecondary.href;
  document.getElementById('heroAvatars').innerHTML = data.hero.socialProof.avatars
    .map(a => `<img src="${a}" alt="">`).join('');
  document.getElementById('heroSocialText').textContent = data.hero.socialProof.text;

  // Build slide text panels
  const slidesText = document.getElementById('heroSlidesText');
  data.hero.slides.forEach((slide, i) => {
    const div = document.createElement('div');
    div.className = 'hero-slide-text' + (i === 0 ? ' active' : '');
    div.dataset.i = i;
    div.innerHTML = `
      <h1 class="hero-headline">${slide.headlineLines.map((line, idx) =>
        idx === slide.headlineAccentIndex
          ? `<span class="accent">${esc(line)}</span>`
          : esc(line)
      ).join('<br>')}</h1>
      <p class="hero-sub">${esc(slide.subtitle)}</p>
    `;
    slidesText.appendChild(div);
  });

  // Build images
  const imgWrap = document.getElementById('heroImgWrap');
  data.hero.slides.forEach((slide, i) => {
    const img = document.createElement('img');
    img.src = slide.image;
    img.alt = '';
    if (i === 0) img.classList.add('active');
    imgWrap.appendChild(img);
  });

  // Build dots
  const dotsEl = document.getElementById('heroDots');
  data.hero.slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.dataset.i = i;
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dotsEl.appendChild(dot);
  });

  let currentSlide = 0;
  let autoTimer = null;

  function goToSlide(idx) {
    const slides = data.hero.slides;
    const n = slides.length;
    const next = (idx + n) % n;

    // text panels
    document.querySelectorAll('.hero-slide-text').forEach(el => el.classList.remove('active'));
    document.querySelector(`.hero-slide-text[data-i="${next}"]`).classList.add('active');

    // images
    imgWrap.querySelectorAll('img').forEach((img, i) => img.classList.toggle('active', i === next));

    // dots
    document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === next));

    // stat card + quote card
    const slide = slides[next];
    document.getElementById('heroStatLabel').textContent = slide.statLabel;
    document.getElementById('heroStatValue').textContent = slide.statValue;
    document.getElementById('heroStatDesc').textContent = slide.statDesc;
    document.getElementById('heroQuoteIcon').textContent = slide.quoteIcon;
    document.getElementById('heroQuoteText').textContent = slide.quoteText;

    currentSlide = next;
  }

  // init first slide stat/quote
  goToSlide(0);

  // dot clicks
  dotsEl.querySelectorAll('.hero-dot').forEach(dot => {
    dot.addEventListener('click', () => { resetTimer(); goToSlide(+dot.dataset.i); });
  });

  // arrow clicks
  document.getElementById('heroPrev').addEventListener('click', () => { resetTimer(); goToSlide(currentSlide - 1); });
  document.getElementById('heroNext').addEventListener('click', () => { resetTimer(); goToSlide(currentSlide + 1); });

  function resetTimer() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(() => goToSlide(currentSlide + 1), 6000);
  }
  if (data.hero.slides.length > 1) resetTimer();

  // ---- Stats ----
  const STAT_SVG = {
    users: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    coffee: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    video: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  };

  // parse a stat value string into numeric + suffix (e.g. "30+" → {num:30, suffix:"+"})
  function parseStatValue(val) {
    const match = String(val).match(/^([\d.]+)(.*)$/);
    if (!match) return { num: null, suffix: val };
    return { num: parseFloat(match[1]), suffix: match[2] };
  }

  const statItems = [];
  document.getElementById('statsBar').innerHTML = data.stats.map((s, i) => `
    <div class="stat-item">
      <div class="stat-icon-wrap ${s.color}">${STAT_SVG[s.icon] || STAT_SVG.bolt}</div>
      <div class="stat-value" data-stat-i="${i}">0</div>
      <div class="stat-label">${esc(s.label)}</div>
    </div>
  `).join('');

  // store parsed targets for counter animation
  data.stats.forEach((s, i) => statItems.push({ el: document.querySelector(`[data-stat-i="${i}"]`), ...parseStatValue(s.value) }));

  // Intersection Observer — start counter when stats bar enters viewport
  const statsBar = document.getElementById('statsBar');
  let countersStarted = false;
  function startCounters() {
    if (countersStarted) return;
    countersStarted = true;
    statItems.forEach(({ el, num, suffix }) => {
      if (num === null) { el.textContent = suffix; return; }
      const duration = 1600;
      const steps = 50;
      const inc = num / steps;
      let current = 0;
      let step = 0;
      const isDecimal = String(num).includes('.');
      const timer = setInterval(() => {
        step++;
        current = step >= steps ? num : current + inc;
        el.textContent = (isDecimal ? current.toFixed(1) : Math.round(current)) + suffix;
        if (step >= steps) clearInterval(timer);
      }, duration / steps);
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) startCounters();
    }, { threshold: 0.3 }).observe(statsBar);
  } else {
    startCounters();
  }

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
  // ---- Benefits ----
  const BENEFIT_SVG = {
    clock: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    wallet: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="16" cy="15" r="1" fill="currentColor" stroke="none"/></svg>`,
    graduation: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    rocket: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
    coffee: `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  };

  // Map by index order — order in content.json benefits.items matches these keys
  const BENEFIT_ICON_KEYS = ['clock', 'wallet', 'graduation', 'rocket', 'camera', 'coffee'];

  document.getElementById('benefitsEyebrow').textContent = data.benefits.eyebrow;
  document.getElementById('benefitsHeading').innerHTML = `${esc(data.benefits.heading)} <span class="accent">${esc(data.benefits.headingAccent)}</span>`;
  document.getElementById('benefitsGrid').innerHTML = data.benefits.items.map((b, i) => {
    const iconKey = BENEFIT_ICON_KEYS[i] || 'rocket';
    const svg = BENEFIT_SVG[iconKey];
    return `
      <div class="benefit-card">
        <div class="benefit-icon-wrap ${b.color}">${svg}</div>
        <div class="benefit-title ${b.color}">${esc(b.title)}</div>
        <div class="benefit-desc">${esc(b.desc)}</div>
      </div>
    `;
  }).join('');

  // ---- How it works ----
  document.getElementById('howEyebrow').textContent = data.howItWorks.eyebrow;
  document.getElementById('howHeading').innerHTML = `${esc(data.howItWorks.heading)} <span class="accent">${esc(data.howItWorks.headingAccent)}</span>`;

  const STEP_SVG = [
    // Step 1: Isi Form
    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    // Step 2: Interview Santai
    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    // Step 3: Training 3x
    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    // Step 4: Mulai Ngonten
    `<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  ];

  document.getElementById('stepsRow').innerHTML = data.howItWorks.steps.map((s, i) => `
    <div class="step-item">
      <div class="step-num ${s.color}">${i + 1}</div>
      <div class="step-icon-svg step-icon-${s.color}">${STEP_SVG[i] || STEP_SVG[0]}</div>
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
