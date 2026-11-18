# worksell-web

Website dan admin **Worksell ID** (worksell.id): Astro di Cloudflare Workers, D1, dan Vercel Blob.
Dokumen perencanaan dan desain ada di branch [`plan`](../../tree/plan).

| Bagian | Isi |
|---|---|
| Framework | Astro 7 (SSR) + `@astrojs/cloudflare` 14 |
| Database | Cloudflare D1 (`worksell-db`) + Drizzle ORM |
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
migrations/          SQL untuk wrangler d1 migrations (0000_init, 0001_seed)
seed/dev.sql         data contoh, hanya lokal
public/fonts/        General Sans (Fontshare) dan Geist Mono, di-host sendiri
src/db/              skema Drizzle dan client
src/lib/             sesi admin, Turnstile, penyimpanan Blob, validasi, query konten
src/middleware.ts    login wajib untuk /admin dan /api/admin, cek Origin, security headers, cache
src/components/      komponen website (port dari design/home-coral-dark.html) dan admin
src/pages/           halaman publik, /admin, /api/leads, /api/admin/*, /media/* (foto lokal, dev saja)
```

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

```bash
pnpm install && pnpm build
```

```bash
npx wrangler d1 migrations apply worksell-db --remote
```

```bash
npx wrangler deploy
```

Pertama kali: Workers > `worksell-web` > Settings > Domains & Routes > tambah custom domain `worksell.id`.

Setelah Image Transformations aktif di zone worksell.id dan host
`*.public.blob.vercel-storage.com` diizinkan sebagai source, ubah `IMAGE_TRANSFORMS` menjadi `"on"`
supaya foto disajikan dengan `srcset`.

Setelah live, isi nomor WhatsApp, email kontak, dan OG image di `/admin/settings`, lalu
tampilkan item roadmap yang sudah dikonfirmasi di `/admin/roadmap` (seed production menyimpannya sebagai draft).
