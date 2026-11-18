# worksell-web

Website dan admin **Worksell ID** (worksell.id): Astro di Cloudflare Workers, D1, dan R2.
Dokumen perencanaan dan desain ada di branch [`plan`](../../tree/plan).

| Bagian | Isi |
|---|---|
| Framework | Astro 7 (SSR) + `@astrojs/cloudflare` 14 |
| Database | Cloudflare D1 (`worksell-db`) + Drizzle ORM |
| Foto | Cloudflare R2 (`worksell-media`), disajikan dari `media.worksell.id` |
| Form | Turnstile + rate limit 5 request/menit per IP + validasi Zod |
| Admin | `/admin`, dilindungi Cloudflare Access, JWT diverifikasi lagi di middleware |

Hanya ada satu set resource (production). Development memakai D1 dan R2 lokal (Miniflare),
jadi tidak butuh akun Cloudflare.

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
- Admin: http://localhost:4321/admin (login dilewati karena `ADMIN_DEV_BYPASS=true` di `.dev.vars`;
  middleware menolak bypass ini bila `SITE_URL` adalah worksell.id)
- `seed/dev.sql` mengisi tiga proyek contoh dari desain. **Jangan** dijalankan ke database production.
- Turnstile memakai key uji resmi Cloudflare yang selalu lolos.

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
src/lib/             Access, Turnstile, media/R2, validasi, query konten
src/middleware.ts    guard /admin dan /api/admin, cek Origin, security headers, cache
src/components/      komponen website (port dari design/home-coral-dark.html) dan admin
src/pages/           halaman publik, /admin, /api/leads, /api/admin/*, /media/* (cadangan R2)
```

## Langkah untuk pemilik (sekali saja)

Detail lengkap ada di `docs/05-deploy-cloudflare.md` di branch `plan`. Ringkasnya:

1. Aktifkan R2 di dashboard.
2. Buat database dan bucket:
   ```bash
   npx wrangler d1 create worksell-db
   ```
   ```bash
   npx wrangler r2 bucket create worksell-media
   ```
3. Kirim `database_id` hasil langkah 2 (atau isi sendiri di `wrangler.jsonc`, menggantikan
   `00000000-0000-0000-0000-000000000000`).
4. Isi `vars` di `wrangler.jsonc`: `PUBLIC_TURNSTILE_SITE_KEY`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`.
5. Simpan secret Turnstile:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
6. Custom domain bucket `media.worksell.id`, Access application "Worksell Admin" untuk
   `worksell.id/admin*` dan `worksell.id/api/admin/*`.

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

Setelah Image Transformations aktif dan `media.worksell.id` diizinkan sebagai source,
ubah `IMAGE_TRANSFORMS` menjadi `"on"` supaya foto disajikan dengan `srcset`.

Setelah live, isi nomor WhatsApp, email kontak, dan OG image di `/admin/settings`, lalu
tampilkan item roadmap yang sudah dikonfirmasi di `/admin/roadmap` (seed production menyimpannya sebagai draft).
