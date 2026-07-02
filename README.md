# rezz.vze — Landing Page Creator Assistant Program (Seed Studio Theme)

Landing page recruitment dengan admin panel CMS lengkap, form pendaftaran builtin, dan dashboard analytics — siap deploy ke Netlify.

## Struktur Project

```
public/              -> semua file yang di-serve ke browser (static site)
  index.html           landing page utama
  admin.html           panel admin (password protected)
  style.css            styling landing page (tema Seed Studio: dark navy + green)
  admin.css            styling admin panel
  script.js            render konten dinamis + form submit + page-view tracking
  admin.js             logic utama admin panel (login, shell, save)
  admin-editors-*.js    editor konten per section
  admin-analytics.js    dashboard analytics (visitor, device, top pages)
  admin-leads.js        daftar pendaftar form + ubah status
netlify/functions/   -> backend (serverless functions)
  auth.js               login/logout admin
  content.js            get & save data konten (pakai Netlify Blobs)
  upload.js              upload gambar
  get-image.js           serve gambar yang sudah diupload
  leads.js               terima & kelola data pendaftar form
  track.js               catat page view (anonim, IP di-hash)
  analytics.js           agregat data analytics untuk dashboard admin
  _utils.js              helper cek autentikasi
data/content.json    -> isi konten default/awal
netlify.toml          -> konfigurasi Netlify (routing /api/* ke functions)
```

## Cara Deploy ke Netlify

1. **Push ke GitHub.** Buat repo baru, push semua folder ini ke dalamnya.
2. **Connect ke Netlify.** Di Netlify dashboard, klik "Add new site" → "Import an existing project" → pilih repo GitHub ini.
3. **Build settings** akan otomatis terbaca dari `netlify.toml`:
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. **Set Environment Variables** (penting!). Di Site settings → Environment variables, tambahkan:
   - `ADMIN_PASSWORD` → password yang lo mau pakai untuk login admin
   - `ADMIN_SESSION_SECRET` → string random panjang (bisa generate di [random.org](https://www.random.org/strings/) atau `openssl rand -hex 32` di terminal)
5. **Enable Netlify Blobs.** Otomatis aktif begitu situs di-deploy di Netlify (tidak perlu setup database eksternal). Tidak ada langkah tambahan.
6. **Deploy.** Setelah env var diset, trigger deploy ulang (Deploys → Trigger deploy → Deploy site).

Setelah live, akses admin di `https://nama-situs-lo.netlify.app/admin.html`.

## Fitur Admin Panel

- **Analytics** — total kunjungan, visitor unik, grafik harian 30 hari, halaman terpopuler, breakdown device (desktop/mobile/tablet). Data dikumpulkan tanpa menyimpan PII; alamat IP di-hash satu arah untuk hitung visitor unik.
- **Pendaftar** — daftar semua orang yang submit form pendaftaran, dengan filter status (Baru, Dihubungi, Interview, Diterima, Ditolak) dan link langsung ke WhatsApp mereka.
- **Editor konten** — semua section landing page (Hero, Stats, Why Join, Benefits, How It Works, Galeri, Syarat, FAQ, Form & Footer) bisa diedit teks dan gambarnya, termasuk tambah/hapus item.

Semua perubahan konten disimpan di memori browser dulu — klik **💾 Simpan Semua** untuk benar-benar menyimpannya ke server. Tab Analytics dan Pendaftar tidak butuh tombol simpan karena keduanya read-only dashboard.

## Soal Form Pendaftaran & Keamanan Data

- Form pendaftaran mengumpulkan: nama, umur, domisili, status, Instagram, WhatsApp, dan alasan bergabung.
- **Validasi usia 18+ dilakukan di server** (bukan cuma di browser), jadi tidak bisa di-bypass dengan mengedit HTML form. Submission dengan umur di bawah 18 akan ditolak otomatis oleh backend.
- Data pendaftar tersimpan di Netlify Blobs, hanya bisa diakses lewat admin panel yang password-protected.

## Soal Foto Default

Foto yang terpasang sekarang adalah **placeholder netral** dari Picsum (foto random royalty-free, hanya pengganti sementara). Untuk ganti ke foto asli:
- **Cara termudah:** upload foto lo sendiri (atau foto yang sudah lo punya izin pakai) lewat admin panel di tab terkait.
- **Kalau mau pakai foto stok Unsplash:** buka [unsplash.com](https://unsplash.com), cari foto sesuai vibe, download, lalu upload lewat admin panel.

## Catatan Teknis

- Storage konten, gambar, leads & analytics semuanya pakai **Netlify Blobs** — gratis, built-in, tidak perlu setup database terpisah.
- Auth pakai cookie session HttpOnly yang di-sign dengan HMAC, valid 7 hari.
- Tidak ada framework build (React/Next.js) — semua vanilla JS, supaya ringan dan mudah di-maintain tanpa build step.
- Kalau mau test lokal sebelum deploy: install [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm install -g netlify-cli`), lalu jalankan `netlify dev` di folder project ini.
