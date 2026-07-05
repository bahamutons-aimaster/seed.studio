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

  // ---- Scarcity Bar ----
  if (data.scarcity && data.scarcity.enabled) {
    const remaining = data.scarcity.totalSlots - data.scarcity.takenSlots;
    const bar = document.getElementById('scarcityBar');
    if (bar) {
      bar.innerHTML = `
        <div class="scarcity-left">
          <span class="scarcity-pulse"></span>
          <span class="scarcity-text">Hanya <strong>${remaining} ${esc(data.scarcity.label)}</strong> yang tersedia saat ini</span>
          <div class="scarcity-slots">
            ${Array.from({length: data.scarcity.totalSlots}, (_, i) =>
              `<div class="scarcity-slot${i < data.scarcity.takenSlots ? ' taken' : ''}"></div>`
            ).join('')}
          </div>
        </div>
        <span class="scarcity-urgency">${esc(data.scarcity.urgencyText)}</span>
      `;
    }
  }

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


  // ---- Cafe Section ----
  document.getElementById('cafeEyebrow').textContent = data.cafeSection.eyebrow;
  document.getElementById('cafeHeading').innerHTML = `${esc(data.cafeSection.heading)} <span class="accent">${esc(data.cafeSection.headingAccent)}</span>`;
  document.getElementById('cafeSubtitle').textContent = data.cafeSection.subtitle;
  document.getElementById('cafeMapsEmbed').src = data.cafeSection.mapsEmbedUrl;

  document.getElementById('cafeAreas').innerHTML = data.cafeSection.areas
    .map(a => `<div class="cafe-area-chip">${esc(a)}</div>`).join('');

  // Illustrated area cards — unique SVG per city
  const AREA_ILLUS = [
    // Mojokerto — temple/candi silhouette
    { name: 'Mojokerto', desc: 'Kota Sejarah & Kopi', color1:'#1A2E20', color2:'#0F1A14',
      svg: `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1A2E20"/><stop offset="100%" stop-color="#0F1A14"/></linearGradient></defs>
        <rect width="220" height="160" fill="url(#g1)"/>
        <!-- stars -->
        <circle cx="40" cy="20" r="1.2" fill="#4ADE80" opacity=".6"/><circle cx="90" cy="14" r="1" fill="#4ADE80" opacity=".4"/><circle cx="150" cy="22" r="1.4" fill="#4ADE80" opacity=".5"/><circle cx="190" cy="12" r="1" fill="#4ADE80" opacity=".3"/>
        <!-- moon -->
        <circle cx="180" cy="28" r="14" fill="#1e3a28"/><circle cx="186" cy="22" r="11" fill="#0F1A14"/>
        <!-- ground -->
        <rect x="0" y="130" width="220" height="30" fill="#0a120c"/>
        <!-- candi base -->
        <rect x="70" y="100" width="80" height="30" fill="#162018" rx="2"/>
        <!-- candi body -->
        <rect x="85" y="75" width="50" height="28" fill="#1a2a1e" rx="2"/>
        <!-- candi middle -->
        <rect x="95" y="58" width="30" height="20" fill="#1e3028" rx="2"/>
        <!-- candi top tiers -->
        <rect x="100" y="46" width="20" height="14" fill="#233824" rx="2"/>
        <rect x="104" y="36" width="12" height="12" fill="#2a4530" rx="2"/>
        <!-- spire -->
        <polygon points="110,18 106,36 114,36" fill="#4ADE80" opacity=".8"/>
        <!-- trees -->
        <ellipse cx="30" cy="115" rx="18" ry="26" fill="#0e1f12"/>
        <rect x="27" y="125" width="6" height="15" fill="#0a1209"/>
        <ellipse cx="190" cy="112" rx="16" ry="22" fill="#0e1f12"/>
        <rect x="187" y="120" width="6" height="20" fill="#0a1209"/>
        <!-- green accent line -->
        <rect x="0" y="128" width="220" height="2" fill="#4ADE80" opacity=".15"/>
      </svg>` },
    // Malang — mountain/gunung with city lights
    { name: 'Malang', desc: 'Kota Apel & Sejuk', color1:'#1a2030', color2:'#0e1420',
      svg: `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a2030"/><stop offset="100%" stop-color="#0e1420"/></linearGradient></defs>
        <rect width="220" height="160" fill="url(#g2)"/>
        <!-- stars -->
        <circle cx="20" cy="18" r="1.2" fill="#5FA8E8" opacity=".5"/><circle cx="70" cy="10" r="1" fill="#fff" opacity=".4"/><circle cx="130" cy="16" r="1.4" fill="#5FA8E8" opacity=".6"/><circle cx="200" cy="8" r="1" fill="#fff" opacity=".3"/>
        <!-- mountain left -->
        <polygon points="0,130 60,45 120,130" fill="#121c2e"/>
        <!-- mountain right (higher) -->
        <polygon points="80,130 150,25 220,130" fill="#0f1828"/>
        <!-- snow cap -->
        <polygon points="150,25 138,55 162,55" fill="#5FA8E8" opacity=".6"/>
        <!-- city lights -->
        <rect x="0" y="128" width="220" height="32" fill="#0a1018"/>
        <circle cx="30" cy="138" r="2" fill="#E8C75A" opacity=".8"/>
        <circle cx="55" cy="142" r="1.5" fill="#E8C75A" opacity=".6"/>
        <circle cx="80" cy="136" r="2" fill="#E8C75A" opacity=".7"/>
        <circle cx="110" cy="140" r="1.5" fill="#F2A65A" opacity=".8"/>
        <circle cx="145" cy="137" r="2" fill="#E8C75A" opacity=".6"/>
        <circle cx="175" cy="141" r="1.5" fill="#E8C75A" opacity=".7"/>
        <circle cx="200" cy="136" r="2" fill="#F2A65A" opacity=".8"/>
        <!-- foreground hill -->
        <ellipse cx="110" cy="155" rx="140" ry="40" fill="#0c1520"/>
        <rect x="0" y="128" width="220" height="2" fill="#5FA8E8" opacity=".15"/>
      </svg>` },
    // Batu — apple orchard / buah + hills
    { name: 'Batu', desc: 'Kota Wisata Sejuk', color1:'#201a10', color2:'#140f08',
      svg: `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#201a10"/><stop offset="100%" stop-color="#140f08"/></linearGradient></defs>
        <rect width="220" height="160" fill="url(#g3)"/>
        <!-- sky glow sunrise -->
        <ellipse cx="110" cy="160" rx="160" ry="80" fill="#2a1a08" opacity=".8"/>
        <ellipse cx="110" cy="160" rx="100" ry="50" fill="#E8B84B" opacity=".12"/>
        <!-- hills -->
        <ellipse cx="30" cy="140" rx="80" ry="50" fill="#1a1208"/>
        <ellipse cx="190" cy="145" rx="70" ry="45" fill="#181006"/>
        <ellipse cx="110" cy="135" rx="90" ry="40" fill="#1e1509"/>
        <!-- apple trees row -->
        <g opacity=".9">
          <ellipse cx="55" cy="102" rx="16" ry="20" fill="#1a2e10"/>
          <rect x="52" y="115" width="5" height="18" fill="#0f1a09"/>
          <circle cx="50" cy="96" r="3.5" fill="#E8B84B" opacity=".9"/>
          <circle cx="62" cy="100" r="3" fill="#F2A65A" opacity=".8"/>

          <ellipse cx="110" cy="98" rx="18" ry="22" fill="#1e3414"/>
          <rect x="107" y="112" width="5" height="20" fill="#0f1a09"/>
          <circle cx="103" cy="90" r="3.5" fill="#E8B84B" opacity=".9"/>
          <circle cx="118" cy="95" r="3" fill="#4ADE80" opacity=".6"/>

          <ellipse cx="165" cy="104" rx="16" ry="20" fill="#1a2e10"/>
          <rect x="162" y="117" width="5" height="18" fill="#0f1a09"/>
          <circle cx="170" cy="97" r="3.5" fill="#F2A65A" opacity=".9"/>
          <circle cx="158" cy="101" r="3" fill="#E8B84B" opacity=".8"/>
        </g>
        <!-- ground -->
        <rect x="0" y="128" width="220" height="32" fill="#120d06"/>
        <rect x="0" y="128" width="220" height="2" fill="#E8B84B" opacity=".2"/>
      </svg>` },
    // Pandaan — highway/jalan tol + industrial
    { name: 'Pandaan', desc: 'Jalur Strategis Jatim', color1:'#1a1a28', color2:'#0e0e1c',
      svg: `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a1a28"/><stop offset="100%" stop-color="#0e0e1c"/></linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1a1a28"/><stop offset="50%" stop-color="#22223a"/><stop offset="100%" stop-color="#1a1a28"/></linearGradient></defs>
        <rect width="220" height="160" fill="url(#g4)"/>
        <!-- stars -->
        <circle cx="25" cy="15" r="1" fill="#B98FE8" opacity=".5"/><circle cx="80" cy="22" r="1.2" fill="#fff" opacity=".4"/><circle cx="160" cy="10" r="1" fill="#B98FE8" opacity=".6"/>
        <!-- buildings skyline -->
        <rect x="10" y="75" width="22" height="55" fill="#14142a" rx="2"/>
        <rect x="15" y="68" width="12" height="10" fill="#14142a"/>
        <rect x="40" y="85" width="28" height="45" fill="#12122a" rx="2"/>
        <rect x="160" y="70" width="20" height="60" fill="#14142a" rx="2"/>
        <rect x="185" y="80" width="25" height="50" fill="#12122a" rx="2"/>
        <!-- building windows -->
        <rect x="14" y="82" width="4" height="4" fill="#B98FE8" opacity=".5" rx="1"/>
        <rect x="22" y="82" width="4" height="4" fill="#B98FE8" opacity=".3" rx="1"/>
        <rect x="14" y="92" width="4" height="4" fill="#B98FE8" opacity=".4" rx="1"/>
        <rect x="44" y="92" width="4" height="4" fill="#5FA8E8" opacity=".4" rx="1"/>
        <rect x="53" y="92" width="4" height="4" fill="#5FA8E8" opacity=".3" rx="1"/>
        <rect x="163" y="78" width="4" height="4" fill="#B98FE8" opacity=".5" rx="1"/>
        <rect x="172" y="78" width="4" height="4" fill="#B98FE8" opacity=".3" rx="1"/>
        <!-- highway perspective -->
        <rect x="0" y="128" width="220" height="32" fill="#090910"/>
        <polygon points="60,128 160,128 185,160 35,160" fill="#0e0e20"/>
        <!-- road markings -->
        <rect x="105" y="132" width="10" height="6" fill="#E8C75A" opacity=".6" rx="1"/>
        <rect x="105" y="144" width="10" height="6" fill="#E8C75A" opacity=".6" rx="1"/>
        <rect x="105" y="156" width="10" height="4" fill="#E8C75A" opacity=".6" rx="1"/>
        <!-- car lights -->
        <circle cx="75" cy="142" r="3" fill="#E8C75A" opacity=".9"/>
        <circle cx="82" cy="142" r="3" fill="#E8C75A" opacity=".9"/>
        <circle cx="148" cy="148" r="2.5" fill="#e85a5a" opacity=".9"/>
        <circle cx="155" cy="148" r="2.5" fill="#e85a5a" opacity=".9"/>
        <rect x="0" y="128" width="220" height="2" fill="#B98FE8" opacity=".2"/>
      </svg>` },
    // Pasuruan — coast/pantai + fishing
    { name: 'Pasuruan', desc: 'Kota Pesisir Timur', color1:'#0e1c28', color2:'#081018',
      svg: `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="g5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0e1c28"/><stop offset="100%" stop-color="#081018"/></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0e2030"/><stop offset="100%" stop-color="#050e16"/></linearGradient></defs>
        <rect width="220" height="160" fill="url(#g5)"/>
        <!-- moon reflection -->
        <circle cx="110" cy="30" r="18" fill="#0e2030"/><circle cx="116" cy="24" r="14" fill="#081018"/>
        <circle cx="110" cy="30" r="12" fill="#E8C75A" opacity=".15"/>
        <!-- stars -->
        <circle cx="30" cy="18" r="1.2" fill="#5FA8E8" opacity=".5"/><circle cx="170" cy="12" r="1" fill="#fff" opacity=".4"/><circle cx="60" cy="25" r="1" fill="#5FA8E8" opacity=".3"/>
        <!-- sea -->
        <rect x="0" y="100" width="220" height="60" fill="url(#sea)"/>
        <!-- waves -->
        <path d="M0,108 Q27,102 55,108 Q82,114 110,108 Q137,102 165,108 Q192,114 220,108" stroke="#5FA8E8" stroke-width="1.5" fill="none" opacity=".3"/>
        <path d="M0,118 Q27,112 55,118 Q82,124 110,118 Q137,112 165,118 Q192,124 220,118" stroke="#5FA8E8" stroke-width="1" fill="none" opacity=".2"/>
        <!-- moon reflection on water -->
        <ellipse cx="110" cy="130" rx="20" ry="5" fill="#E8C75A" opacity=".12"/>
        <!-- land -->
        <ellipse cx="50" cy="112" rx="70" ry="20" fill="#0a1620"/>
        <ellipse cx="180" cy="115" rx="55" ry="18" fill="#091420"/>
        <!-- fishing boat -->
        <path d="M90,100 Q110,96 130,100 L126,108 Q110,110 94,108 Z" fill="#14283a"/>
        <line x1="110" y1="96" x2="110" y2="74" stroke="#1e3a50" stroke-width="2"/>
        <polygon points="110,74 130,86 110,90" fill="#E8C75A" opacity=".6"/>
        <!-- dock -->
        <rect x="155" y="98" width="4" height="20" fill="#0e2030"/>
        <rect x="165" y="98" width="4" height="18" fill="#0e2030"/>
        <rect x="155" y="98" width="14" height="3" fill="#122030"/>
        <rect x="0" y="100" width="220" height="2" fill="#5FA8E8" opacity=".2"/>
      </svg>` },
  ];

  const areaCardsEl = document.getElementById('cafeAreaCards');
  if (areaCardsEl) {
    areaCardsEl.innerHTML = AREA_ILLUS.map(area => `
      <div class="cafe-area-card">
        ${area.svg}
        <div class="cafe-area-card-body">
          <div class="cafe-area-card-name">${area.name}</div>
          <div class="cafe-area-card-desc">${area.desc}</div>
        </div>
        <div class="cafe-area-card-overlay">Meet Up</div>
      </div>
    `).join('');
  }

  // Logo marquee — 4x duplicate for seamless infinite loop
  const logoBase = data.cafeSection.cafeLogos;
  const logoItems = [...logoBase, ...logoBase, ...logoBase, ...logoBase];
  document.getElementById('logoMarquee').innerHTML = logoItems.map(c => `
    <div class="cafe-logo-card">
      <img src="${c.logo}" alt="${esc(c.name)}" title="${esc(c.name)}">
    </div>
  `).join('');

  // Photo marquee — 4x duplicate for seamless infinite loop
  const photoBase = data.cafeSection.cafePhotos;
  const photoItems = [...photoBase, ...photoBase, ...photoBase, ...photoBase];
  document.getElementById('photoMarquee').innerHTML = photoItems.map((p, i) => `
    <div class="cafe-photo-card">
      <img src="${p}" alt="Cafe ${(i % photoBase.length) + 1}" loading="lazy">
    </div>
  `).join('');

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

  // ---- Testimonials ----
  if (data.testimonials) {
    document.getElementById('testiEyebrow').textContent = data.testimonials.eyebrow;
    document.getElementById('testiHeading').innerHTML = `${esc(data.testimonials.heading)} <span class="accent">${esc(data.testimonials.headingAccent)}</span>`;
    document.getElementById('testiGrid').innerHTML = data.testimonials.items.map(t => `
      <div class="testi-card">
        <div class="testi-stars">${'<span class="testi-star">★</span>'.repeat(t.rating)}</div>
        <p class="testi-quote">${esc(t.quote)}</p>
        <div class="testi-author">
          <img class="testi-avatar" src="${t.avatar}" alt="${esc(t.name)}">
          <div>
            <div class="testi-name">${esc(t.name)}</div>
            <div class="testi-role">${esc(t.role)}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ---- WA Links (floating + sticky + chat panel) ----
  const waNumber = data.footer.whatsapp;
  const waMsg = encodeURIComponent('Halo, saya mau tanya soal Creator Assistant Program rezz.vze!');
  const waHref = `https://wa.me/${waNumber}?text=${waMsg}`;

  const waFloatBtn = document.getElementById('waFloatBtn');
  if (waFloatBtn) waFloatBtn.href = waHref;

  // Sticky CTA — muncul setelah scroll 600px
  const stickyCta = document.getElementById('stickyCta');
  if (stickyCta) {
    window.addEventListener('scroll', () => {
      stickyCta.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
  }

  // ---- Footer ----
  document.getElementById('footerTagline').textContent = data.footer.tagline;
  document.getElementById('footerSocials').innerHTML = data.footer.socials.map(s => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('');
  document.getElementById('footerQuickLinks').innerHTML = data.footer.quickLinks.map(l => `<a href="${l.href}">${esc(l.label)}</a>`).join('');
  document.getElementById('footerLocation').textContent = data.footer.location;
  document.getElementById('footerEmail').textContent = data.footer.email;
  document.getElementById('footerCopyright').textContent = data.footer.copyright;

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
  setupForm();
  trackPageView();
})();
