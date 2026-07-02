// public/admin-analytics.js
// Analytics dashboard tab — visitor counts, daily chart, top pages, device breakdown.

async function renderAnalyticsTab(container) {
  container.innerHTML = `<div style="padding:60px 32px; text-align:center; color:var(--muted); font-family:var(--mono);">Memuat data analytics…</div>`;

  let data;
  try {
    const res = await api('analytics');
    if (!res.ok) throw new Error('failed');
    data = await res.json();
  } catch (e) {
    container.innerHTML = `<div style="padding:60px 32px; text-align:center; color:#e5736b;">Gagal memuat analytics. Coba refresh halaman.</div>`;
    return;
  }

  const days = data.daily.slice(-30);
  const maxViews = Math.max(...days.map(d => d.views), 1);
  const totalDevices = (data.devices.desktop || 0) + (data.devices.mobile || 0) + (data.devices.tablet || 0) || 1;

  function fmtDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  const STAT_CARDS = [
    { label: 'Total Kunjungan', value: data.totalViews.toLocaleString('id-ID'), sub: '30 hari terakhir', color: '#4ADE80' },
    { label: 'Visitor Unik', value: data.totalUnique.toLocaleString('id-ID'), sub: '30 hari terakhir', color: '#5FA8E8' },
    { label: 'Hari Ini', value: data.todayViews.toLocaleString('id-ID'), sub: 'kunjungan hari ini', color: '#F2A65A' },
    { label: 'Unik Hari Ini', value: data.todayUnique.toLocaleString('id-ID'), sub: 'visitor berbeda', color: '#B98FE8' },
  ];

  const wrap = h(`<div style="padding:28px 32px 60px; display:flex; flex-direction:column; gap:24px;"></div>`);

  // stat cards
  const statRow = h(`<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px;"></div>`);
  STAT_CARDS.forEach(c => {
    statRow.appendChild(h(`
      <div style="background:var(--bg-soft); border:1px solid var(--line); border-radius:12px; padding:20px 18px; border-top:3px solid ${c.color};">
        <div style="font-family:var(--mono); font-size:0.68rem; letter-spacing:0.1em; text-transform:uppercase; color:var(--muted); margin-bottom:8px;">${c.label}</div>
        <div style="font-family:var(--display); font-size:2rem; line-height:1;">${c.value}</div>
        <div style="font-size:0.74rem; color:var(--muted); margin-top:6px;">${c.sub}</div>
      </div>
    `));
  });
  wrap.appendChild(statRow);

  // bar chart
  const chartCard = h(`<div style="background:var(--bg-soft); border:1px solid var(--line); border-radius:12px; padding:22px 20px;"></div>`);
  chartCard.appendChild(h(`<h3 style="font-family:var(--display); font-size:1.05rem; margin-bottom:18px;">Kunjungan 30 Hari Terakhir</h3>`));

  if (days.length === 0) {
    chartCard.appendChild(h(`<p style="color:var(--muted); font-size:0.85rem;">Belum ada data kunjungan.</p>`));
  } else {
    const svgWidth = Math.max(days.length * 26, 300);
    const bars = days.map((d, i) => {
      const barH = Math.max(2, (d.views / maxViews) * 110);
      const x = i * 26 + 4;
      const isToday = d.date === new Date().toISOString().slice(0, 10);
      return `<rect x="${x}" y="${130 - barH}" width="16" height="${barH}" fill="${isToday ? '#4ADE80' : '#2A332D'}" rx="3"><title>${d.date}: ${d.views} views</title></rect>`;
    }).join('');
    const chartWrap = h(`<div style="overflow-x:auto;"><svg viewBox="0 0 ${svgWidth} 140" style="width:100%; min-width:${svgWidth}px; height:140px; display:block;">${bars}</svg></div>`);
    chartCard.appendChild(chartWrap);

    const labelsRow = h(`<div style="display:flex; justify-content:space-between; margin-top:8px;"></div>`);
    [days[0], days[Math.floor(days.length / 2)], days[days.length - 1]].forEach(d => {
      labelsRow.appendChild(h(`<span style="font-size:0.68rem; color:var(--muted); font-family:var(--mono);">${fmtDate(d.date)}</span>`));
    });
    chartCard.appendChild(labelsRow);
  }
  wrap.appendChild(chartCard);

  // bottom: top pages + devices
  const bottomGrid = h(`<div style="display:grid; grid-template-columns:1fr 300px; gap:14px;"></div>`);

  const topPagesCard = h(`<div style="background:var(--bg-soft); border:1px solid var(--line); border-radius:12px; padding:22px 20px;"></div>`);
  topPagesCard.appendChild(h(`<h3 style="font-family:var(--display); font-size:1.05rem; margin-bottom:18px;">Halaman Terpopuler</h3>`));
  if (data.topPages.length === 0) {
    topPagesCard.appendChild(h(`<p style="color:var(--muted); font-size:0.85rem;">Belum ada data halaman.</p>`));
  } else {
    data.topPages.forEach((p, i) => {
      const pct = Math.round((p.views / (data.topPages[0].views || 1)) * 100);
      topPagesCard.appendChild(h(`
        <div style="margin-bottom:13px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.86rem;">
            <span><span style="color:var(--muted); font-family:var(--mono); font-size:0.7rem; margin-right:8px;">${i + 1}</span>${esc(p.path)}</span>
            <span style="font-family:var(--display);">${p.views.toLocaleString('id-ID')}</span>
          </div>
          <div style="height:4px; background:var(--bg-card-2); border-radius:2px; overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:#4ADE80;"></div>
          </div>
        </div>
      `));
    });
  }
  bottomGrid.appendChild(topPagesCard);

  const deviceCard = h(`<div style="background:var(--bg-soft); border:1px solid var(--line); border-radius:12px; padding:22px 20px;"></div>`);
  deviceCard.appendChild(h(`<h3 style="font-family:var(--display); font-size:1.05rem; margin-bottom:18px;">Perangkat</h3>`));
  [
    { label: 'Desktop', val: data.devices.desktop || 0, icon: '🖥️' },
    { label: 'Mobile', val: data.devices.mobile || 0, icon: '📱' },
    { label: 'Tablet', val: data.devices.tablet || 0, icon: '📟' },
  ].forEach(d => {
    deviceCard.appendChild(h(`
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--line);">
        <span style="font-size:0.86rem;">${d.icon} ${d.label}</span>
        <span style="font-size:0.86rem;">${d.val.toLocaleString('id-ID')} <span style="color:var(--muted); font-size:0.72rem;">(${Math.round((d.val / totalDevices) * 100)}%)</span></span>
      </div>
    `));
  });
  bottomGrid.appendChild(deviceCard);

  wrap.appendChild(bottomGrid);

  wrap.appendChild(h(`
    <p style="font-size:0.74rem; color:var(--muted); line-height:1.6;">
      Data dikumpulkan tanpa menyimpan informasi pribadi pengunjung. Alamat IP di-hash dan tidak bisa dibalik ke bentuk aslinya.
    </p>
  `));

  container.innerHTML = '';
  container.appendChild(wrap);
}
