# Panduan Setup dan Deploy Cloudflare

Semua langkah di sini dijalankan oleh **pemilik project**. Sesi Claude memantau lewat koneksi
Cloudflare dan memberi arahan bila ada yang gagal.

Kondisi akun saat plan ini dibuat (18 Nov 2026):

- Zone `worksell.id`: aktif, plan Free.
- D1 yang sudah ada (`qurban-project`, `dev-workspace`, `prod-workspace`) milik project lain, jangan dipakai.
- **R2 belum bisa diakses (HTTP 403).** Kemungkinan R2 belum diaktifkan di akun ini.

## 1. Sekali saja: siapkan resource

Urutan:

1. **Aktifkan R2**: Dashboard → R2 Object Storage → aktifkan. Ini butuh metode pembayaran, tetapi
   pemakaian di bawah kuota gratis (10 GB penyimpanan) tidak ditagih.
2. **Buat database D1**:
   ```bash
   npx wrangler d1 create worksell-db
   ```
   ```bash
   npx wrangler d1 create worksell-db-dev
   ```
   Salin `database_id` ke `wrangler.jsonc`.
3. **Buat bucket R2**:
   ```bash
   npx wrangler r2 bucket create worksell-media
   ```
   ```bash
   npx wrangler r2 bucket create worksell-media-dev
   ```
4. **Custom domain bucket**: R2 → `worksell-media` → Settings → Custom Domains → `media.worksell.id`.
5. **Image Transformations**: zone `worksell.id` → Images → Transformations → Enable, lalu izinkan
   source `media.worksell.id`. Kuota gratis 5.000 transformasi unik per bulan.
6. **Turnstile**: Dashboard → Turnstile → Add widget, domain `worksell.id`. Simpan site key
   (masuk `vars`) dan secret key:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
7. **Cloudflare Access** (Zero Trust, gratis sampai 50 user):
   - Buat application tipe *Self-hosted*, nama "Worksell Admin".
   - Domain: `worksell.id/admin` dan `worksell.id/api/admin`.
   - Policy: *Allow*, include email tim yang boleh masuk.
   - Salin **Application Audience (AUD) tag** dan team domain ke `vars` (`ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`).
8. **Redirect www**: Rules → Redirect Rules → `www.worksell.id/*` ke `https://worksell.id/$1` (301).
9. **Web Analytics**: aktifkan untuk `worksell.id`.

## 2. Setiap rilis

Dari branch `main`:

```bash
pnpm install
```

```bash
pnpm build
```

Jalankan migrasi baru ke database production (hanya bila ada file baru di `migrations/`):

```bash
npx wrangler d1 migrations apply worksell-db --remote
```

Deploy:

```bash
npx wrangler deploy
```

Pertama kali: Workers → `worksell-web` → Settings → Domains & Routes → tambah custom domain `worksell.id`.

Opsi otomatis: hubungkan repo ke **Workers Builds** (Workers → `worksell-web` → Settings → Build),
branch `main`, build command `pnpm build`, deploy command `npx wrangler deploy`.
Migrasi D1 tetap dijalankan manual.

## 3. Cek setelah deploy

- `https://worksell.id` tampil, carousel muncul bila ada proyek published.
- Kirim form test, lalu cek lead masuk di `/admin/leads`.
- `/admin` meminta login Access. Tanpa login hasilnya 403.
- Upload satu foto di admin dan pastikan tampil dari `media.worksell.id`.
- `https://worksell.id/sitemap.xml` dan `/robots.txt` bisa dibuka.

## 4. Yang bisa dipantau Claude

Lewat koneksi Cloudflare, sesi Claude bisa membaca:
- status dan versi Worker `worksell-web`
- log dan error Worker
- isi dan migrasi D1
- daftar file R2 (setelah R2 aktif)

lalu memberi tahu langkah perbaikannya. Claude tidak membuat, mengubah, atau menghapus resource
kecuali pemilik memintanya secara eksplisit.

## 5. Rollback

```bash
npx wrangler rollback
```

Untuk D1, gunakan Time Travel (restore ke titik waktu sebelumnya):

```bash
npx wrangler d1 time-travel restore worksell-db --timestamp <ISO-8601>
```
