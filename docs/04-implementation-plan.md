# Rencana Implementasi Website Worksell ID

Dokumen ini untuk sesi yang akan mengerjakan kode. Baca juga:
[01-positioning.md](01-positioning.md), [02-sitemap-seo.md](02-sitemap-seo.md),
[03-tech-stack.md](03-tech-stack.md), dan desain di [design/home-coral-dark.html](../design/home-coral-dark.html).

## 0. Aturan kerja

- Kode di branch **`main`**. Dokumen dan desain tetap di branch `plan`.
- **Jangan menyimpan gambar di repo.** Foto selalu lewat R2 (lihat bagian 5).
- **Jangan deploy, jangan membuat atau mengubah resource Cloudflare.** Pemilik project yang menjalankan
  semua perintah `wrangler ... --remote` dan `wrangler deploy`. Sesi dev menyiapkan kode, migrasi,
  dan perintah yang perlu dijalankan.
- Jangan menyentuh resource Cloudflare lain di akun ini (D1 `qurban-project`, `dev-workspace`,
  `prod-workspace`; Worker `custom-cosplay-web`, `qurban-project`, `workspace-projects`).
- Pakai versi terbaru Astro dan `@astrojs/cloudflare` yang stabil. Cek dokumentasi adapter untuk cara
  mengakses binding (`env`) di versi itu, karena API-nya pernah berubah antar versi mayor.
- Desain wajib mengikuti `design/home-coral-dark.html`: token, komponen, dan copy-nya.
  Jalankan linter Hallmark (`sloplint.mjs --render`) di halaman hasil build bila memungkinkan.

## 1. Nama resource

| Resource | Nama |
|---|---|
| Worker | `worksell-web` |
| D1 production | `worksell-db` |
| D1 development | `worksell-db-dev` |
| R2 bucket | `worksell-media` (prod), `worksell-media-dev` (dev) |
| Domain website | `worksell.id` (`www.worksell.id` diarahkan ke apex) |
| Domain media | `media.worksell.id` (custom domain bucket R2) |
| Access application | "Worksell Admin", path `worksell.id/admin*` dan `worksell.id/api/admin/*` |

## 2. Struktur project (branch `main`)

```
/
├─ astro.config.mjs
├─ wrangler.jsonc
├─ drizzle.config.ts
├─ package.json
├─ migrations/                 # SQL hasil drizzle-kit, dijalankan dengan wrangler d1 migrations
├─ public/
│  ├─ fonts/                   # GeneralSans-*.woff2, GeistMono-*.woff2
│  └─ favicon.svg
└─ src/
   ├─ env.d.ts
   ├─ middleware.ts            # guard /admin dan /api/admin, security headers
   ├─ db/
   │  ├─ schema.ts             # skema Drizzle
   │  └─ client.ts             # getDb(env)
   ├─ lib/
   │  ├─ access.ts             # verifikasi JWT Cloudflare Access
   │  ├─ turnstile.ts
   │  ├─ media.ts              # helper URL R2 + srcset Image Transformations
   │  └─ validation.ts         # skema Zod
   ├─ styles/
   │  ├─ tokens.css            # :root dari desain
   │  └─ site.css              # komponen dari desain
   ├─ components/              # Nav, Footer, Hero, ProjectCarousel, SystemCard, RoadmapList,
   │                           # IntegrationFlow, LeadForm, Img
   ├─ layouts/
   │  ├─ Site.astro            # head SEO, nav, footer
   │  └─ Admin.astro
   └─ pages/
      ├─ index.astro
      ├─ security-system.astro
      ├─ erp-system.astro
      ├─ workplace-management.astro
      ├─ kebijakan-privasi.astro
      ├─ 404.astro
      ├─ sitemap.xml.ts
      ├─ robots.txt.ts
      ├─ api/
      │  ├─ leads.ts           # POST publik
      │  └─ admin/...          # semua endpoint admin
      └─ admin/
         ├─ index.astro        # dashboard
         ├─ leads/...
         ├─ projects/...
         ├─ roadmap/...
         ├─ systems.astro
         ├─ media.astro
         └─ settings.astro
```

## 3. Konfigurasi Worker (`wrangler.jsonc`)

Binding yang dibutuhkan (ID database diisi setelah pemilik membuatnya):

| Binding | Tipe | Isi |
|---|---|---|
| `DB` | D1 | `worksell-db` / `worksell-db-dev` |
| `MEDIA` | R2 | `worksell-media` / `worksell-media-dev` |
| `LEAD_LIMITER` | Rate limiting | 5 request per 60 detik per IP untuk `POST /api/leads` |
| `ASSETS` | Static assets | output Astro |

Variabel (`vars`):

| Nama | Contoh |
|---|---|
| `SITE_URL` | `https://worksell.id` |
| `MEDIA_BASE_URL` | `https://media.worksell.id` |
| `PUBLIC_TURNSTILE_SITE_KEY` | dari dashboard Turnstile |
| `ACCESS_TEAM_DOMAIN` | `https://<team>.cloudflareaccess.com` |
| `ACCESS_AUD` | Application Audience (AUD) tag dari Access |

Secret (`wrangler secret put`, diisi pemilik): `TURNSTILE_SECRET_KEY`.

Development lokal: `wrangler dev` / `astro dev` memakai D1 dan R2 lokal (Miniflare),
dengan `ADMIN_DEV_BYPASS=true` hanya di `.dev.vars`. Bypass ini **tidak boleh** aktif di production;
middleware harus menolak bypass bila `SITE_URL` adalah domain production.

## 4. Skema database (D1)

Semua timestamp disimpan sebagai teks ISO 8601 (UTC). ID memakai `crypto.randomUUID()`.

```sql
-- Proyek yang tampil di carousel hero (testimoni)
CREATE TABLE projects (
  id            TEXT PRIMARY KEY,
  client_name   TEXT NOT NULL,              -- "PT Contoh Logistik"
  location      TEXT NOT NULL,              -- "Gudang distribusi, Cikarang"
  year          INTEGER NOT NULL,
  system        TEXT NOT NULL CHECK (system IN ('security','erp','spaces','multi')),
  solution      TEXT NOT NULL,              -- "Sistem keamanan", "Keamanan dan Spaces"
  photo_id      TEXT REFERENCES media(id),
  photo_caption TEXT,                       -- teks kecil di bawah foto
  quote         TEXT,
  quote_role    TEXT,                       -- "Kepala operasional"
  status_label  TEXT NOT NULL DEFAULT 'Berjalan',  -- teks stempel
  sort_order    INTEGER NOT NULL DEFAULT 0,
  published     INTEGER NOT NULL DEFAULT 0, -- 0/1
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Baris perangkat per proyek: "Reader face recognition | 12"
CREATE TABLE project_items (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  quantity    TEXT NOT NULL,                -- teks, boleh "1 set"
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Tiga kartu sistem di Home
CREATE TABLE systems (
  slug        TEXT PRIMARY KEY CHECK (slug IN ('security','erp','spaces')),
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  cta_label   TEXT NOT NULL,
  page_path   TEXT NOT NULL,                -- /security-system, /erp-system, /workplace-management
  photo_id    TEXT REFERENCES media(id),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL
);

-- "Sedang kami kembangkan"
CREATE TABLE roadmap_items (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  summary     TEXT NOT NULL,
  stage       TEXT NOT NULL CHECK (stage IN ('perancangan','uji_coba','segera')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- File di R2
CREATE TABLE media (
  id          TEXT PRIMARY KEY,
  r2_key      TEXT NOT NULL UNIQUE,         -- "projects/2026/<uuid>.jpg"
  content_type TEXT NOT NULL,
  bytes       INTEGER NOT NULL,
  width       INTEGER,
  height      INTEGER,
  alt         TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL,
  created_by  TEXT                          -- email dari JWT Access
);

-- Form kontak
CREATE TABLE leads (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  company       TEXT NOT NULL,
  systems       TEXT NOT NULL,              -- JSON array: ["security","erp"]
  building_type TEXT NOT NULL,
  city          TEXT NOT NULL,
  contact_via   TEXT NOT NULL CHECK (contact_via IN ('whatsapp','email')),
  contact_value TEXT NOT NULL,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'baru'
                CHECK (status IN ('baru','dihubungi','survei','penawaran','menang','batal')),
  notes         TEXT,
  source_path   TEXT,
  user_agent    TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX leads_created_idx ON leads(created_at DESC);
CREATE INDEX leads_status_idx ON leads(status);

-- Pengaturan key-value
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,             -- whatsapp_number, contact_email, reply_promise, ...
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- Jejak perubahan dari admin
CREATE TABLE audit_log (
  id          TEXT PRIMARY KEY,
  actor       TEXT NOT NULL,
  action      TEXT NOT NULL,                -- "project.update", "media.delete", ...
  target      TEXT,
  created_at  TEXT NOT NULL
);
```

Seed awal (migrasi terpisah `0001_seed.sql`):

- `systems`: tiga baris, dengan copy dari desain.
- `roadmap_items`: empat item dari desain (Manajemen aset IT, Helpdesk IT, Parkir dan kendaraan,
  Monitoring energi), `published = 0` sampai pemilik mengonfirmasi.
- `settings`: `whatsapp_number` dan `contact_email` kosong, `reply_promise` = "Kami balas dalam satu hari kerja."
- **Tidak ada** data proyek palsu di production. Tiga proyek contoh dari desain hanya di seed dev.

## 5. Media (R2)

- Upload hanya lewat admin: `POST /api/admin/media` (multipart).
  - Tipe yang diterima: `image/jpeg`, `image/png`, `image/webp`, `image/avif`. Maksimal 10 MB.
  - Cek tipe dari magic bytes, bukan hanya header.
  - Key: `{folder}/{yyyy}/{uuid}.{ext}`, folder `projects`, `systems`, `site`.
  - Browser admin membaca `naturalWidth`/`naturalHeight` lalu mengirimkannya bersama file.
  - Simpan `cache-control: public, max-age=31536000, immutable` pada object R2. File tidak pernah
    ditimpa: ganti foto berarti upload baru.
- Hapus media: tolak bila masih dipakai `projects.photo_id` atau `systems.photo_id`.
- Penyajian: bucket punya custom domain `media.worksell.id`.
- Komponen `<Img>` membuat `srcset` lewat Image Transformations:
  `https://worksell.id/cdn-cgi/image/width=800,quality=80,format=auto/https://media.worksell.id/<key>`
  dengan lebar 480, 800, 1200, 1600. `media.worksell.id` harus diizinkan sebagai source di pengaturan
  Transformations zone. Bila Transformations belum aktif, `<Img>` memakai URL asli (fallback lewat flag).
- Filter warna dari desain (`saturate(0.7) contrast(0.97) sepia(0.08)`) tetap di CSS, file asli tidak diubah.

## 6. Halaman publik

| Path | Sumber data | Catatan |
|---|---|---|
| `/` | `projects` (published, urut `sort_order`), `systems`, `roadmap_items`, `settings` | Port penuh dari desain |
| `/security-system` | `systems` + copy statis | Kata kunci dari 02-sitemap-seo.md |
| `/erp-system` | idem | |
| `/workplace-management` | idem | Spaces sebagai nama produk |
| `/kebijakan-privasi` | statis | Wajib karena form mengumpulkan data pribadi (UU PDP) |
| `/sitemap.xml`, `/robots.txt` | endpoint | |
| `404` | statis | |

Halaman layanan cukup dibuat struktur dan copy awal yang mengikuti desain Home (hero, masalah,
komponen sistem, cara kerja singkat, form kontak). Copy final menyusul.

Perilaku Home:

- **Carousel proyek**: data dari D1. Jika tidak ada proyek published, carousel disembunyikan dan hero
  tampil dengan teks saja (jangan tampilkan slot kosong). Script carousel dari desain dipakai ulang
  (progressive enhancement: tanpa JS, slide bisa di-scroll horizontal).
- **Form kontak**: lihat bagian 7.
- **Teks sementara**: H1 = "System integrator untuk keamanan gedung, ERP, dan workplace.",
  footer = "Dirancang dengan benar, dipakai setiap hari." Keduanya bisa diganti pemilik.
- Wordmark: "Worksell ID" (konfirmasi penulisan ke pemilik).

Rendering dan cache:

- Halaman yang membaca D1 dirender per request (SSR). Query-nya kecil, jadi belum perlu cache.
- Header `Cache-Control: public, max-age=0, s-maxage=60` untuk HTML publik. Asset statis di-cache
  panjang. Bila nanti trafik besar, tambahkan Cache API dengan purge saat admin menyimpan.

SEO:

- `<html lang="id">`, title dan meta description per halaman dari 02-sitemap-seo.md, brand "Worksell ID".
- Canonical `https://worksell.id/...`, Open Graph (OG image dari R2, diatur di settings).
- JSON-LD `Organization` + `LocalBusiness` (areaServed: Jakarta, Bogor, Depok, Tangerang, Bekasi).
- `sitemap.xml` berisi halaman publik. `robots.txt` memblokir `/admin` dan `/api`.

## 7. Form kontak dan leads

Alur:

1. Pengunjung mengisi form (field persis seperti desain) dan memilih WhatsApp atau Email.
2. Widget Turnstile (mode managed/invisible) menghasilkan token.
3. `POST /api/leads` dengan JSON:
   - cek rate limit `LEAD_LIMITER` (per IP dari `CF-Connecting-IP`)
   - verifikasi token Turnstile ke `https://challenges.cloudflare.com/turnstile/v0/siteverify`
   - validasi Zod: nama 2–100 karakter, perusahaan 2–150, systems subset `security|erp|spaces|unsure`,
     WhatsApp dinormalisasi ke format `62…` (8–15 digit), email valid, pesan maksimal 1000 karakter
   - insert ke `leads`, balas `{ ok: true, redirect }`, di mana `redirect` adalah link `wa.me` atau
     `mailto:` ke kontak Worksell ID (dari `settings`) dengan pesan yang sudah terisi
4. Browser membuka `redirect` dan menampilkan pesan terima kasih.
   Jika API gagal, form tetap membuka WhatsApp/email supaya lead tidak hilang.

Nomor WhatsApp dan email tujuan diambil dari tabel `settings`, bukan hard-code.

Notifikasi email ke tim saat ada lead baru: **fase 4** (opsional), lewat Email Routing + `send_email` binding.

## 8. Halaman admin

Akses:

- Seluruh `/admin*` dan `/api/admin/*` dilindungi **Cloudflare Access** (login email OTP atau Google,
  hanya email yang ada di daftar policy).
- `middleware.ts` memverifikasi header `Cf-Access-Jwt-Assertion` dengan JWKS
  `${ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs` dan `aud = ACCESS_AUD`. Bila tidak valid: 403.
  Email dari JWT disimpan di `locals.user` dan dipakai di `audit_log`.
- Semua request admin yang mengubah data wajib `POST`/`PATCH`/`DELETE` dan memeriksa header `Origin`
  sama dengan `SITE_URL`.

Fitur:

| Menu | Fungsi |
|---|---|
| Dashboard | Jumlah lead baru minggu ini, lead terbaru, jumlah proyek published |
| Leads | Tabel dengan filter status dan tanggal, detail lead, ubah status, catatan, tombol WhatsApp/email cepat, export CSV |
| Proyek | CRUD proyek dan baris perangkat, pilih atau upload foto, atur urutan, toggle published, preview kartu seperti di hero |
| Sistem | Edit tiga kartu sistem (judul, ringkasan, label CTA, foto) |
| Roadmap | CRUD item "Sedang kami kembangkan", tahap, urutan, published |
| Media | Grid file R2, upload (drag and drop), edit alt text, hapus (diblokir bila dipakai) |
| Pengaturan | Nomor WhatsApp, email kontak, janji balasan, teks H1, slogan footer, OG image |

UI admin memakai token dan font yang sama dengan website, tetapi layout aplikasi sederhana
(sidebar + konten), tanpa efek kertas. Form admin bekerja tanpa framework JS (form HTML + sedikit
JS untuk upload dan preview). Kontrol admin 32–40px dengan area klik 44px.

## 9. Keamanan

- Security headers di middleware: `Content-Security-Policy` (izinkan `challenges.cloudflare.com`,
  `media.worksell.id`, `static.cloudflareinsights.com`), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal,
  `X-Frame-Options: DENY`.
- Semua query lewat Drizzle (parameterized). Output HTML di-escape oleh Astro, jangan pakai `set:html`
  untuk data dari D1.
- Data leads adalah data pribadi: hanya tampil di admin, tidak pernah di log, export CSV hanya dari admin.
- Tidak ada secret di repo. `.dev.vars` masuk `.gitignore`.

## 10. Fase dan kriteria selesai

### Fase 1: fondasi
- Project Astro + adapter Cloudflare, `wrangler.jsonc`, TypeScript strict, pnpm.
- Token dan CSS dari desain, font self-host, layout `Site.astro`, Nav, Footer.
- Skema Drizzle + migrasi `0000_init.sql` dan `0001_seed.sql`.
- `pnpm build` dan `wrangler dev` jalan dengan D1 lokal.
- **Selesai bila**: Home tampil di lokal dengan data seed dev dan tampilannya sama dengan desain.

### Fase 2: website publik
- Home lengkap (carousel dari D1, kartu sistem, roadmap, integrasi, form).
- Tiga halaman layanan, kebijakan privasi, 404, sitemap, robots, JSON-LD.
- `POST /api/leads` dengan Turnstile, rate limit, validasi.
- **Selesai bila**: linter Hallmark 0 FAIL di Home, lead tersimpan di D1 lokal, Lighthouse SEO ≥ 95.

### Fase 3: admin
- Middleware Access, semua menu di bagian 8, upload R2, audit log.
- **Selesai bila**: pemilik bisa menambah proyek dengan foto dari admin dan proyek itu muncul di
  carousel Home tanpa deploy ulang.

### Fase 4: tambahan (setelah live)
- Notifikasi email lead baru.
- Cache API untuk HTML publik.
- Halaman `/insights` (artikel) sesuai 02-sitemap-seo.md.

Setiap fase diakhiri dengan daftar perintah yang perlu dijalankan pemilik (migrasi remote, secret,
deploy), mengacu ke [05-deploy-cloudflare.md](05-deploy-cloudflare.md).

## 11. Pertanyaan terbuka untuk pemilik

- Penulisan brand: "Worksell ID", "Worksell.id", atau "Worksell"?
- Pilihan final H1 dan slogan footer.
- Nomor WhatsApp dan email kontak (diisi lewat admin setelah live).
- Daftar email yang boleh masuk admin.
- Data proyek dan testimoni asli, serta foto-fotonya.
- Isi final "Sedang kami kembangkan".
