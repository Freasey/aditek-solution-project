# Aditek — Planning

Branch `plan` berisi seluruh dokumen perencanaan Aditek.
Kode website/aplikasi dikembangkan di branch `main`.

## Dokumen

| File | Isi |
|---|---|
| [docs/01-positioning.md](docs/01-positioning.md) | Positioning bisnis, target pasar, prinsip "jual sistem, bukan barang" |
| [docs/02-sitemap-seo.md](docs/02-sitemap-seo.md) | Struktur URL website, kata kunci per halaman, aturan SEO |
| [docs/03-tech-stack.md](docs/03-tech-stack.md) | Rencana teknologi website (Astro), belum dieksekusi |
| [design/](design/) | Desain Home page: tema Coral versi gelap (HTML statis) |

## Keputusan yang sudah disepakati

- Brand: **Aditek**
- Area layanan: **Jabodetabek**
- Fokus awal: 3 sistem — **Security, ERP, Workspace**
- Yang dijual: sistem, arsitektur, dan implementasi sampai dipakai user — bukan unit barang
- URL/endpoint berbahasa Inggris, isi halaman berbahasa Indonesia (`<html lang="id">`)
- Setiap halaman layanan bersaing dengan kompetitornya sendiri (1 halaman = 1 kata kunci utama)
- **Spaces** hanya nama produk aplikasi, tidak dipakai sebagai URL
- Modul Spaces ditambahkan bertahap

## Status

- [x] Positioning awal
- [x] Sitemap & endpoint: `/security-system`, `/erp-system`, `/workplace-management`
- [ ] Validasi volume kata kunci (Google Keyword Planner)
- [x] Desain Home page (Coral, dark)
- [ ] Review desain Home oleh tim
- [ ] Setup website di branch `main` (Astro, menunggu keputusan)
- [ ] Google Business Profile
