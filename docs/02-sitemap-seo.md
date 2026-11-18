# Sitemap & SEO

> Status: **draf**. Volume kata kunci belum divalidasi. Sebelum final,
> cek di Google Keyword Planner / autocomplete Google.

## Aturan umum

- 1 halaman = 1 kata kunci utama → ada di URL, `<title>`, H1, paragraf pertama, meta description
- URL bahasa Inggris, huruf kecil, tanda hubung; isi bahasa Indonesia
- `<html lang="id">`, schema `LocalBusiness` (area: Jabodetabek) + `Service` per halaman
- Halaman induk menjual sistem utuh; subhalaman bersaing di bidangnya sendiri
- Kata kunci produk/harga ditangkap lewat artikel blog, lalu diarahkan ke halaman solusi

## Struktur URL (rekomendasi)

```
/                                   Home — IT solution perusahaan (general)
/security-system                    Sistem keamanan terintegrasi
  /security-system/access-control
  /security-system/cctv
  /security-system/visitor-management
/erp-system                         Sistem ERP perusahaan
  /erp-system/accounting
  /erp-system/inventory
  /erp-system/purchasing
  /erp-system/sales
/workplace-management               Aplikasi workspace (produk: Spaces)
  /workplace-management/meeting-room-booking
  /workplace-management/<modul-berikutnya>
/case-studies
/insights                           Blog
/about
/contact
```

## Alternatif endpoint yang dipertimbangkan

### Security
| Endpoint | Catatan |
|---|---|
| **`/security-system`** ✅ | Sejajar dengan pencarian "security system" & "sistem keamanan"; jelas bahwa yang dijual sistem |
| `/integrated-security` | Lebih "solusi", tapi lebih jarang diketik user |
| `/security-solutions` | Umum dipakai kompetitor SI, kurang spesifik |
| `/access-control` (sebagai induk) | Volume bagus, tapi terlalu sempit untuk induk |

Sub `/cctv` tetap pakai kata "cctv" karena itu yang diketik user ("surveillance" jarang dicari di Indonesia). Isinya tetap sistem (arsitektur, NVR, integrasi), bukan katalog kamera.

### ERP
| Endpoint | Catatan |
|---|---|
| **`/erp-system`** ✅ | Cocok dengan "sistem ERP" / "ERP system"; menekankan sistem, bukan lisensi |
| `/erp-software` | Volume tinggi ("software ERP"), tapi terkesan jual produk |
| `/erp` | Pendek, tapi kurang deskriptif |
| `/erp-implementation` | Intent tinggi, volume kecil — lebih cocok jadi section/artikel |

Sub `/purchasing` dipilih daripada `/procurement` karena istilah "purchasing" lebih umum di perusahaan Indonesia.

### Workspace
| Endpoint | Catatan |
|---|---|
| **`/workplace-management`** ✅ | Istilah standar industri ("workplace management system"), cocok untuk modul booking ruangan, visitor, aset |
| `/office-automation` | Pas untuk "otomasi pekerjaan ringan", tapi istilahnya terkesan lama |
| `/workflow-automation` | Pas untuk modul approval, terlalu sempit untuk booking ruangan |
| `/office-management-system` | Deskriptif, tapi panjang |

Sub modul pakai nama fungsi, bukan nama fitur internal: `/meeting-room-booking` (lebih sering dicari daripada "room-booking").

## Kata kunci per halaman

### Home `/`
- Utama: `IT solution perusahaan`, `jasa IT solution Jakarta`
- Pendukung: `system integrator Jakarta`, `konsultan IT perusahaan`, `solusi IT Jabodetabek`
- Title: `Aditek — IT Solution & System Integrator Perusahaan di Jabodetabek`

### Security `/security-system`
- Utama: `sistem keamanan terintegrasi`
- Pendukung: `security system integrator`, `sistem keamanan gedung`, `sistem keamanan perusahaan`, `integrasi CCTV dan access control`
- Title: `Sistem Keamanan Terintegrasi untuk Perusahaan | Aditek`
- Sub:
  - `/access-control` → `access control system`, `sistem access control perusahaan`, `access door terintegrasi absensi`
  - `/cctv` → `sistem CCTV perusahaan`, `instalasi CCTV gedung`, `CCTV terintegrasi`
  - `/visitor-management` → `visitor management system`, `sistem manajemen tamu`, `buku tamu digital`

### ERP `/erp-system`
- Utama: `sistem ERP perusahaan`
- Pendukung: `jasa implementasi ERP`, `konsultan ERP Jakarta`, `ERP custom`, `ERP untuk distributor`, `ERP manufaktur`
- Title: `Sistem ERP Perusahaan — dari Sales sampai Accounting | Aditek`
- Sub:
  - `/accounting` → `sistem akuntansi perusahaan`, `software akuntansi terintegrasi`
  - `/inventory` → `sistem manajemen inventory`, `sistem stok gudang`
  - `/purchasing` → `sistem purchasing`, `aplikasi purchase order`
  - `/sales` → `sistem penjualan`, `sales order dan invoice`

### Workspace `/workplace-management`
- Utama: `aplikasi manajemen kantor`, `workplace management system`
- Pendukung: `aplikasi otomasi kantor`, `digitalisasi proses kantor`
- Title: `Spaces — Aplikasi Workplace Management untuk Kantor | Aditek`
- Sub:
  - `/meeting-room-booking` → `aplikasi booking ruang meeting`, `sistem reservasi ruangan`, `meeting room booking system`

## Local SEO (Jabodetabek)

- Google Business Profile dengan area layanan: Jakarta, Bogor, Depok, Tangerang, Bekasi
- Fase berikutnya (opsional): halaman per kota untuk layanan yang sangat lokal,
  mis. `/security-system/jakarta` — konten harus benar-benar berbeda, jangan copy-paste

## Ide artikel `/insights` (penangkap kata kunci produk & long-tail)

- CCTV biasa vs sistem keamanan terintegrasi: apa bedanya?
- Berapa biaya membangun sistem access control kantor?
- Access door terintegrasi absensi dan payroll: cara kerjanya
- ERP vs software akuntansi biasa: kapan perusahaan butuh ERP?
- Berapa lama implementasi ERP?
- Cara mengatur booking ruang meeting agar tidak bentrok
- UU PDP untuk data CCTV dan biometrik karyawan
