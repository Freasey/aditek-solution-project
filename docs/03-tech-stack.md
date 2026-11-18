# Tech Stack Website Worksell ID

> Status: **disepakati**. Implementasi mengikuti [04-implementation-plan.md](04-implementation-plan.md),
> deploy mengikuti [05-deploy-cloudflare.md](05-deploy-cloudflare.md).

Domain: **worksell.id**, sudah aktif di Cloudflare (plan Free).

## Ringkasan

| Bagian | Pilihan |
|---|---|
| Framework | Astro (SSR) + adapter `@astrojs/cloudflare` |
| Bahasa | TypeScript (strict) |
| Runtime dan deploy | Cloudflare Workers dengan Static Assets, custom domain `worksell.id` |
| Database | Cloudflare D1 + Drizzle ORM (migrasi lewat `wrangler d1 migrations`) |
| Penyimpanan media | Cloudflare R2, disajikan dari `media.worksell.id` |
| Resize gambar | Cloudflare Image Transformations (`/cdn-cgi/image/...`) |
| Validasi input | Zod |
| Anti-spam form | Cloudflare Turnstile + Workers Rate Limiting binding |
| Login admin | Cloudflare Access (Zero Trust), JWT diverifikasi lagi di middleware (`jose`) |
| Styling | CSS biasa dari `design/home-coral-dark.html` (token warna, spacing, tipografi) |
| Font | General Sans (Fontshare) dan Geist Mono, di-host sendiri di `public/fonts` |
| SEO | `sitemap.xml` dan `robots.txt` sebagai endpoint, JSON-LD, canonical ke `https://worksell.id` |
| Analytics | Cloudflare Web Analytics |
| Package manager | pnpm |

## Aturan

- **Tidak ada gambar di repo.** Semua foto (proyek, testimoni, kartu sistem, OG image) di-upload
  lewat halaman admin ke R2. Repo hanya berisi kode, CSS, font, favicon SVG, dan file konfigurasi.
- Konten yang berubah-ubah (proyek, testimoni, roadmap, kontak) disimpan di D1 dan diedit lewat
  `/admin`, bukan di kode.
- Kode dikembangkan di branch `main`. Branch `plan` hanya untuk dokumen dan desain.
- Deploy dilakukan oleh pemilik project. Sesi Claude hanya memantau dan memberi arahan.

## Kenapa bukan alternatif lain

| Alternatif | Alasan tidak dipilih |
|---|---|
| Next.js di Workers (OpenNext) | Lebih berat dan lebih banyak penyesuaian untuk website yang sebagian besar konten |
| Hono + HTML manual | Ringan, tetapi halaman marketing dan SEO lebih repot dirawat |
| WordPress | Tidak jalan di Workers/D1 |
| Headless CMS eksternal | Admin cukup sederhana, data tetap di D1 milik sendiri |
