# Worksell ID — Planning

Branch `plan` berisi seluruh dokumen perencanaan Worksell ID (worksell.id).
Kode website dikembangkan di branch `main`.

## Dokumen

| File | Isi |
|---|---|
| [docs/01-positioning.md](docs/01-positioning.md) | Positioning bisnis, target pasar, prinsip "jual sistem, bukan barang" |
| [docs/02-sitemap-seo.md](docs/02-sitemap-seo.md) | Struktur URL website, kata kunci per halaman, aturan SEO |
| [docs/03-tech-stack.md](docs/03-tech-stack.md) | Stack: Astro di Cloudflare Workers, D1, R2 |
| [docs/04-implementation-plan.md](docs/04-implementation-plan.md) | Rencana implementasi untuk sesi developer: struktur, skema D1, admin, fase |
| [docs/05-deploy-cloudflare.md](docs/05-deploy-cloudflare.md) | Setup resource Cloudflare dan langkah deploy (dijalankan pemilik) |
| [design/](design/) | Desain Home page: tema Coral versi gelap (HTML statis) |

## Keputusan yang sudah disepakati

- Brand: **Worksell ID**, domain **worksell.id**
- Area layanan: **Jabodetabek**
- Fokus awal: 3 sistem yang **berdiri sendiri** dan bisa disambungkan: **Security, ERP, Workspace (Spaces)**
- Yang dijual: sistem, arsitektur, dan implementasi sampai dipakai user, bukan unit barang
- URL berbahasa Inggris, isi halaman berbahasa Indonesia (`<html lang="id">`)
- Setiap halaman layanan bersaing dengan kompetitornya sendiri (1 halaman = 1 kata kunci utama)
- **Spaces** hanya nama produk aplikasi, tidak dipakai sebagai URL
- Stack: Astro + Cloudflare Workers + D1 + R2, admin dilindungi Cloudflare Access
- Tidak ada gambar di repo, semua foto lewat R2
- Deploy dilakukan pemilik; Claude memantau dan memberi arahan

## Status

- [x] Positioning awal
- [x] Sitemap & endpoint: `/security-system`, `/erp-system`, `/workplace-management`
- [ ] Validasi volume kata kunci (Google Keyword Planner)
- [x] Desain Home page (Coral, dark)
- [x] Tech stack dan rencana implementasi
- [ ] Setup resource Cloudflare (R2 belum aktif di akun)
- [ ] Fase 1–3 implementasi di branch `main`
- [ ] Google Business Profile
