# worksell-web

Website dan admin **Worksell ID** (worksell.id): Astro di Cloudflare Workers, D1, dan Vercel Blob.
Dokumen perencanaan dan desain ada di branch [`plan`](../../tree/plan).

| Bagian | Isi |
|---|---|
| Framework | Astro 7 (SSR) + `@astrojs/cloudflare` 14 |
| Database | Cloudflare D1 (`worksell_db`) + Drizzle ORM |
| Foto | Vercel Blob (store publik), lewat HTTP API |
| Form | Rate limit 5 request/menit per IP, honeypot, validasi Zod, Turnstile opsional |
| Admin | `/admin`, login email dan password dari env, cookie sesi bertanda tangan HMAC |

Hanya ada satu set resource (production). Development memakai D1 lokal (Miniflare), dan foto
disimpan di tabel D1 lokal bila `BLOB_READ_WRITE_TOKEN` kosong, jadi tidak butuh akun apa pun.

## Development lokal

```bash
pnpm install
```

```bash
cp .dev.vars.example .dev.vars
```

```bash
pnpm db:migrate:local
```

```bash
pnpm db:seed:local
```

```bash
pnpm dev
```

- Website: http://localhost:4321
- Admin: http://localhost:4321/admin, login dengan `ADMIN_EMAIL` dan `ADMIN_PASSWORD` dari `.dev.vars`
- `seed/dev.sql` mengisi tiga proyek contoh dari desain, `seed/dev-storage.sql` membuat tabel foto lokal.
  **Jangan** jalankan keduanya ke database production.
- Turnstile memakai key uji resmi Cloudflare yang selalu lolos (atau kosongkan untuk mematikannya).

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `pnpm build` | Build ke `dist/` |
| `pnpm check` | Type-check (Astro + TypeScript strict) |
| `pnpm preview` | Build lalu jalankan hasilnya di `wrangler dev` |
| `pnpm db:generate` | Buat file migrasi baru setelah mengubah `src/db/schema.ts` |
| `pnpm cf-typegen` | Perbarui `worker-configuration.d.ts` setelah mengubah `wrangler.jsonc` |

## Struktur

```
migrations/          SQL untuk wrangler d1 migrations (dibuat dengan pnpm db:generate)
seed/dev.sql         data contoh, hanya lokal
public/fonts/        General Sans (Fontshare) dan Geist Mono, di-host sendiri
src/db/              skema Drizzle dan client
src/lib/             sesi admin, Turnstile, penyimpanan Blob, validasi, query konten
src/middleware.ts    login wajib untuk /admin dan /api/admin, cek Origin, security headers, cache
src/components/      komponen website (port dari design/home-coral-dark.html) dan admin
src/pages/           halaman publik, /admin, /api/leads, /api/admin/*, /media/* (foto lokal, dev saja)
```

## Konten asli production

`content/production.json` menyimpan konten asli (proyek, roadmap, kartu sistem, settings).
`scripts/content-sql.ts` memvalidasinya dengan skema Zod yang sama dengan form `/admin`, lalu
membuat SQL yang aman dijalankan ulang.

```bash
pnpm content:apply:remote
```

- Hanya bagian yang ada di file yang disentuh. Di `settings`, hanya key yang ditulis yang diubah.
- `projects` dan `roadmap` adalah daftar lengkap: baris di database yang tidak ada di file dihapus,
  dan urutan di file menjadi urutan tampil.
- Foto dipasang lewat `/admin` dan tidak ditimpa oleh file ini.
- Perubahan lewat `/admin` pada bagian yang sama akan tertimpa saat file dijalankan lagi, jadi
  samakan file dengan isi production dulu bila ada yang diubah lewat admin.
- `pnpm content:sql` hanya menampilkan SQL, `pnpm content:apply:local` mencobanya ke D1 lokal.

## Env yang diisi pemilik

Isi di dashboard Cloudflare: **Workers & Pages > worksell-web > Settings > Variables and Secrets**.
`wrangler.jsonc` memakai `keep_vars: true`, jadi isian dashboard tidak terhapus saat deploy.

| Nama | Tipe | Isi |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Secret | Token read-write Vercel Blob store (store harus akses **public**) |
| `ADMIN_EMAIL` | Text | Email untuk login `/admin` |
| `ADMIN_PASSWORD` | Secret | Password admin. Minimal 12 karakter, acak. Mengganti password mengeluarkan semua sesi |
| `PUBLIC_TURNSTILE_SITE_KEY` | Text | Opsional. Site key widget Turnstile untuk anti-spam form |
| `TURNSTILE_SECRET_KEY` | Secret | Opsional. Secret key Turnstile. Turnstile aktif hanya bila kedua key diisi |

`SITE_URL` dan `IMAGE_TRANSFORMS` sudah ada di `wrangler.jsonc`.

## Setiap rilis

Workers Builds (Settings > Build) memakai:

| Kolom | Isi |
|---|---|
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` (menjalankan migrasi D1 yang belum dijalankan, lalu `wrangler deploy`) |

Token build bawaan Workers Builds tidak punya izin D1. Tambahkan sekali di
My Profile > API Tokens > token Workers Builds > Edit > tambah izin **Account / D1 / Edit**.

Pertama kali: Workers > `worksell-web` > Settings > Domains & Routes > tambah custom domain `worksell.id`.

Setelah Image Transformations aktif di zone worksell.id dan host
`*.public.blob.vercel-storage.com` diizinkan sebagai source, ubah `IMAGE_TRANSFORMS` menjadi `"on"`
supaya foto disajikan dengan `srcset`.

Setelah live, isi nomor WhatsApp, email kontak, dan OG image di `/admin/settings`, lalu
tampilkan item roadmap yang sudah dikonfirmasi di `/admin/roadmap` (seed production menyimpannya sebagai draft).
